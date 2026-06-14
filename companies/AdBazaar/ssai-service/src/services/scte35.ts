import { v4 as uuidv4 } from 'uuid';
import type { SCTE35CueMessage, SCTE35ProcessRequest } from '../types/index.js';
import { SCTE35CueModel } from '../models/index.js';
import { adInsertionService } from './ad-insertion.js';

export class SCTE35Service {
  private readonly SPLICE_INSERT_COMMAND_TYPE = 0x05;
  private readonly SEGMENTATION_TYPES: Record<number, string> = {
    0x01: 'Content Identifier',
    0x10: 'Chapter Start',
    0x20: 'Break Start',
    0x21: 'Provider Advertisement Start',
    0x22: 'Distributor Advertisement Start',
    0x30: 'Provider Placement Opportunity Start',
    0x31: 'Distributor Placement Opportunity Start',
    0x32: 'Provider Overlap Placement Opportunity Start',
    0x33: 'Distributor Overlap Placement Opportunity Start',
    0x34: 'Provider Placement Opportunity End',
    0x35: 'Distributor Placement Opportunity End',
    0x36: 'Provider Placement Opportunity Middle',
    0x37: 'Distributor Placement Opportunity Middle',
    0x40: 'Program Start',
    0x41: 'Program End',
    0x42: 'Program Early Termination',
    0x43: 'Program Overlap Start',
    0x44: 'Program Run Overlap Start',
    0x45: 'Program Run Overlap End',
    0x50: 'Break End',
    0x60: 'Provider Advertisement End',
    0x61: 'Distributor Advertisement End',
    0xFF: 'End Message',
  };

  async processCue(request: SCTE35ProcessRequest): Promise<SCTE35CueMessage> {
    const { streamId, rawData, ptsTime, timestamp } = request;

    const parsedCue = this.parseSCTE35Message(rawData);

    const cueMessage: SCTE35CueMessage = {
      id: uuidv4(),
      streamId,
      spliceEventType: parsedCue.spliceEventType as SCTE35CueMessage['spliceEventType'],
      spliceEventId: parsedCue.spliceEventId,
      spliceCommandType: parsedCue.spliceCommandType,
      spliceInsert: parsedCue.spliceInsert,
      segmentationDescriptor: parsedCue.segmentationDescriptor,
      ptsOffset: ptsTime,
      duration: parsedCue.duration,
      rawData: Buffer.from(rawData, 'hex'),
      processedAt: timestamp ?? new Date(),
    };

    const scte35Cue = new SCTE35CueModel({
      ...cueMessage,
    });

    await scte35Cue.save();

    if (cueMessage.spliceEventType === 'splice_insert' && cueMessage.spliceInsert.spliceExecuteFlag) {
      await this.handleSpliceInsert(streamId, cueMessage);
    }

    return cueMessage;
  }

  private parseSCTE35Message(hexData: string): {
    spliceEventType: string;
    spliceEventId: number;
    spliceCommandType: number;
    spliceInsert: {
      spliceEventId: number;
      spliceExecuteFlag: boolean;
      breakDuration: number;
      availNum?: number;
      availsExpected?: number;
    };
    segmentationDescriptor?: {
      segmentationEventId: number;
      segmentationTypeId: number;
      segmentNum?: number;
      segmentsExpected?: number;
      subSegmentNum?: number;
      subSegmentsExpected?: number;
    };
    duration?: number;
  } {
    const bytes = this.hexToBytes(hexData);

    if (bytes.length < 14) {
      return this.createDefaultParse();
    }

    const tableId = bytes[0];

    if (tableId !== 0xFC) {
      return this.createDefaultParse();
    }

    const splice_event_id = this.readUInt32BE(bytes, 3);
    const splice_event_type = this.readUInt16BE(bytes, 7);

    let spliceEventType = 'unknown';
    if (splice_event_type === 0x05) {
      spliceEventType = 'splice_insert';
    } else if (splice_event_type === 0x06) {
      spliceEventType = 'splice_schedule';
    } else if (splice_event_type === 0x07) {
      spliceEventType = 'time_signal';
    } else if (splice_event_type === 0x08) {
      spliceEventType = 'bandwidth_sharing';
    }

    const splice_command_type = bytes[9];

    let spliceInsert: {
      spliceEventId: number;
      spliceExecuteFlag: boolean;
      breakDuration: number;
      availNum?: number;
      availsExpected?: number;
    } = {
      spliceEventId: splice_event_id,
      spliceExecuteFlag: false,
      breakDuration: 0,
    };

    let segmentationDescriptor;
    let duration;

    if (splice_command_type === this.SPLICE_INSERT_COMMAND_TYPE && bytes.length >= 18) {
      const byte10 = bytes[10] ?? 0;
      const breakDurationPresent = (byte10 & 0x40) !== 0;
      const breakDuration = breakDurationPresent
        ? this.parsePTSTimestamp(bytes.slice(14, 19))
        : 0;

      spliceInsert = {
        spliceEventId: splice_event_id,
        spliceExecuteFlag: (byte10 & 0x01) !== 0,
        breakDuration: breakDuration * 90,
        availNum: bytes[11],
        availsExpected: bytes[12],
      };

      duration = breakDuration * 90;

      if (bytes.length >= 20 && bytes[19] !== undefined && bytes[19] > 0) {
        const descriptorLength = bytes[19];
        if (bytes.length >= 20 + descriptorLength) {
          const descriptorData = bytes.slice(20, 20 + descriptorLength);
          segmentationDescriptor = this.parseSegmentationDescriptor(descriptorData);
        }
      }
    }

    return {
      spliceEventType,
      spliceEventId: splice_event_id,
      spliceCommandType: splice_command_type ?? 0,
      spliceInsert,
      segmentationDescriptor,
      duration,
    };
  }

  private parseSegmentationDescriptor(data: Uint8Array): {
    segmentationEventId: number;
    segmentationTypeId: number;
    segmentNum?: number;
    segmentsExpected?: number;
    subSegmentNum?: number;
    subSegmentsExpected?: number;
  } {
    const segmentationEventId = this.readUInt32BE(data, 1);
    const segmentationTypeId = data[5] ?? 0;

    return {
      segmentationEventId,
      segmentationTypeId,
      segmentNum: data[6] ?? undefined,
      segmentsExpected: data[7] ?? undefined,
      subSegmentNum: data[8] ?? undefined,
      subSegmentsExpected: data[9] ?? undefined,
    };
  }

  private parsePTSTimestamp(bytes: Uint8Array): number {
    if (bytes.length < 5) {
      return 0;
    }

    const firstByte = bytes[0] ?? 0;
    const secondByte = bytes[1] ?? 0;
    const thirdByte = bytes[2] ?? 0;
    const fourthByte = bytes[3] ?? 0;
    const fifthByte = bytes[4] ?? 0;

    const highBit = (firstByte & 0x80) !== 0;

    const tsValue =
      ((firstByte & 0x0f) << 30) |
      (secondByte << 22) |
      ((thirdByte & 0xfe) << 14) |
      (fourthByte << 7) |
      ((fifthByte & 0xfe) >>> 1);

    return highBit ? tsValue / 90000 : tsValue / 90000;
  }

  private readUInt32BE(data: Uint8Array, offset: number): number {
    const byte0 = data[offset] ?? 0;
    const byte1 = data[offset + 1] ?? 0;
    const byte2 = data[offset + 2] ?? 0;
    const byte3 = data[offset + 3] ?? 0;
    return (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
  }

  private readUInt16BE(data: Uint8Array, offset: number): number {
    const byte0 = data[offset] ?? 0;
    const byte1 = data[offset + 1] ?? 0;
    return (byte0 << 8) | byte1;
  }

  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/^0x/, '');
    const bytes = new Uint8Array(cleanHex.length / 2);

    for (let i = 0; i < cleanHex.length; i += 2) {
      const byteStr = cleanHex.substring(i, i + 2);
      bytes[i / 2] = parseInt(byteStr, 16);
    }

    return bytes;
  }

  private createDefaultParse() {
    return {
      spliceEventType: 'splice_insert',
      spliceEventId: 0,
      spliceCommandType: this.SPLICE_INSERT_COMMAND_TYPE,
      spliceInsert: {
        spliceEventId: 0,
        spliceExecuteFlag: true,
        breakDuration: 30000,
      },
    };
  }

  private async handleSpliceInsert(
    streamId: string,
    cueMessage: SCTE35CueMessage
  ): Promise<void> {
    try {
      const breakDurationSeconds = (cueMessage.spliceInsert.breakDuration / 90000);

      await adInsertionService.spliceInsert({
        streamId,
        spliceEventId: cueMessage.spliceEventId,
        breakDuration: breakDurationSeconds,
        startTime: cueMessage.ptsOffset,
      });
    } catch (error) {
      logger.error('Failed to handle splice insert:', error);
    }
  }

  async getCueHistory(streamId: string, limit = 100): Promise<SCTE35CueMessage[]> {
    const cues = await SCTE35CueModel.find({ streamId })
      .sort({ processedAt: -1 })
      .limit(limit)
      .exec();

    return cues.map(cue => ({
      id: cue.id,
      streamId: cue.streamId,
      spliceEventType: cue.spliceEventType as SCTE35CueMessage['spliceEventType'],
      spliceEventId: cue.spliceEventId,
      spliceCommandType: cue.spliceCommandType,
      spliceInsert: cue.spliceInsert,
      segmentationDescriptor: cue.segmentationDescriptor,
      ptsOffset: cue.ptsOffset,
      duration: cue.duration,
      processedAt: cue.processedAt,
    }));
  }

  async getCueById(cueId: string): Promise<SCTE35CueMessage | null> {
    const cue = await SCTE35CueModel.findOne({ id: cueId }).exec();

    if (!cue) {
      return null;
    }

    return {
      id: cue.id,
      streamId: cue.streamId,
      spliceEventType: cue.spliceEventType as SCTE35CueMessage['spliceEventType'],
      spliceEventId: cue.spliceEventId,
      spliceCommandType: cue.spliceCommandType,
      spliceInsert: cue.spliceInsert,
      segmentationDescriptor: cue.segmentationDescriptor,
      ptsOffset: cue.ptsOffset,
      duration: cue.duration,
      processedAt: cue.processedAt,
    };
  }

  getSegmentationTypeName(typeId: number): string {
    return this.SEGMENTATION_TYPES[typeId] ?? 'Unknown';
  }

  generateSCTE35SpliceInsert(
    spliceEventId: number,
    breakDurationSeconds: number,
    spliceExecuteFlag = true
  ): string {
    const breakDuration90k = Math.round(breakDurationSeconds * 90000);

    const breakDurationBytes = this.formatPTSTimestamp(breakDuration90k / 90);

    const spliceInfoLength = 18;

    const headerBytes = [
      0xFC,
      0x00,
      0x00,
      (spliceEventId >> 24) & 0xFF,
      (spliceEventId >> 16) & 0xFF,
      (spliceEventId >> 8) & 0xFF,
      spliceEventId & 0xFF,
      0x00,
      0x05,
      this.SPLICE_INSERT_COMMAND_TYPE,
      spliceExecuteFlag ? 0x41 : 0x40,
      0xFF,
      0xFF,
      0x04,
      breakDurationBytes[0] ?? 0,
      breakDurationBytes[1] ?? 0,
      breakDurationBytes[2] ?? 0,
      breakDurationBytes[3] ?? 0,
      breakDurationBytes[4] ?? 0,
      0x00,
      spliceInfoLength & 0xFF,
      (spliceInfoLength >> 8) & 0xFF,
    ];

    return headerBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private formatPTSTimestamp(seconds: number): number[] {
    const pts90k = Math.round(seconds * 90000);

    return [
      ((pts90k >> 30) & 0x0F) | 0x01,
      (pts90k >> 22) & 0xFF,
      ((pts90k >> 15) & 0xFE) | 0x01,
      (pts90k >> 7) & 0xFF,
      ((pts90k & 0x7F) << 1) | 0x01,
    ];
  }
}

export const scte35Service = new SCTE35Service();