import axios from 'axios';
import type { ManifestType, AdBreak, VariantManifest } from '../types/index.js';
import { config } from '../config/index.js';

export interface HLSManifestInfo {
  masterManifest: string;
  variants: VariantManifest[];
  rawMasterManifest: string;
}

export interface DASHManifestInfo {
  rawManifest: string;
  periods: string[];
}

export class ManifestService {
  private cdnBaseUrl: string;

  constructor() {
    this.cdnBaseUrl = config.cdn.baseUrl;
  }

  async fetchManifest(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/dash+xml, */*',
        },
      });
      return response.data as string;
    } catch (error) {
      throw new Error(`Failed to fetch manifest: ${url}`);
    }
  }

  parseHLSMasterManifest(manifest: string): VariantManifest[] {
    const variants: VariantManifest[] = [];
    const lines = manifest.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const attrs = this.parseAttributes(line);
        const resolution = attrs['RESOLUTION'] ?? 'unknown';
        const bandwidth = parseInt(attrs['BANDWIDTH'] ?? '0', 10);
        const nextLine = lines[i + 1]?.trim() ?? '';

        if (nextLine && !nextLine.startsWith('#')) {
          variants.push({
            resolution,
            bandwidth,
            url: nextLine,
          });
          i++;
        }
      }
    }

    return variants;
  }

  parseHLSMediaManifest(manifest: string): { segments: string[]; duration: number } {
    const segments: string[] = [];
    let totalDuration = 0;
    const lines = manifest.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';

      if (line.startsWith('#EXTINF:')) {
        const durationMatch = line.match(/#EXTINF:([\d.]+)/);
        if (durationMatch) {
          const duration = parseFloat(durationMatch[1] ?? '0');
          totalDuration += duration;
        }

        const nextLine = lines[i + 1]?.trim() ?? '';
        if (nextLine && !nextLine.startsWith('#')) {
          segments.push(nextLine);
          i++;
        }
      }
    }

    return { segments, duration: totalDuration };
  }

  async processHLSManifest(
    originalUrl: string,
    adBreaks: AdBreak[],
    slateUrl?: string
  ): Promise<{ modifiedManifest: string; variantManifests: Record<string, string> }> {
    const masterManifest = await this.fetchManifest(originalUrl);
    const variants = this.parseHLSMasterManifest(masterManifest);

    const variantManifests: Record<string, string> = {};
    const variantUrls = variants.map(v => v.url);

    for (const variantUrl of variantUrls) {
      const mediaManifest = await this.fetchManifest(variantUrl);
      const { duration } = this.parseHLSMediaManifest(mediaManifest);

      let modifiedMediaManifest = mediaManifest;

      for (const adBreak of adBreaks) {
        const adBreakPosition = this.calculateAdBreakPosition(adBreak, duration);
        modifiedMediaManifest = this.insertAdBreakIntoManifest(
          modifiedMediaManifest,
          adBreakPosition,
          adBreak,
          slateUrl
        );
      }

      variantManifests[variantUrl] = modifiedMediaManifest;
    }

    const modifiedMasterManifest = this.generateHLSPageableMaster(masterManifest, variantUrls);

    return {
      modifiedManifest: modifiedMasterManifest,
      variantManifests,
    };
  }

  private calculateAdBreakPosition(adBreak: AdBreak, totalDuration: number): number {
    if (adBreak.position === 'preroll') {
      return 0;
    }
    if (adBreak.position === 'postroll') {
      return totalDuration;
    }
    return adBreak.offset ?? totalDuration / 2;
  }

  private insertAdBreakIntoManifest(
    manifest: string,
    position: number,
    adBreak: AdBreak,
    slateUrl?: string
  ): string {
    const lines = manifest.split('\n');
    let currentDuration = 0;
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';

      if (line.startsWith('#EXTINF:')) {
        const durationMatch = line.match(/#EXTINF:([\d.]+)/);
        if (durationMatch) {
          const segmentDuration = parseFloat(durationMatch[1] ?? '0');

          if (currentDuration + segmentDuration >= position) {
            insertIndex = i;
            break;
          }

          currentDuration += segmentDuration;
        }
      }
    }

    if (insertIndex === -1) {
      insertIndex = lines.length;
    }

    const adManifestLines = this.generateAdManifestLines(adBreak, slateUrl);
    lines.splice(insertIndex, 0, ...adManifestLines);

    if (insertIndex > 0) {
      const prevLine = lines[insertIndex - 1]?.trim() ?? '';
      if (!prevLine.includes('#EXT-X-DISCONTINUITY')) {
        lines.splice(insertIndex, 0, '#EXT-X-DISCONTINUITY');
        insertIndex++;
      }
    }

    lines.splice(insertIndex, 0, '#EXT-X-DISCONTINUITY');

    return lines.join('\n');
  }

  private generateAdManifestLines(adBreak: AdBreak, slateUrl?: string): string[] {
    const lines: string[] = [];

    lines.push('#EXT-X-ASSET:CAIADBREAKID=' + adBreak.id);
    lines.push('#EXT-X-CUE-OUT:' + adBreak.duration);
    lines.push('#EXT-X-CUE-OUT-CONT:ElapsedTime=0,Duration=' + adBreak.duration);

    if (adBreak.insertedAds.length > 0) {
      for (const ad of adBreak.insertedAds) {
        lines.push('#EXTINF:' + ad.duration.toFixed(3) + ',');
        lines.push(ad.creativeUrl);
      }
    } else if (slateUrl) {
      const slateSegments = Math.ceil(adBreak.duration / 10);
      for (let i = 0; i < slateSegments; i++) {
        const remainingDuration = Math.min(10, adBreak.duration - (i * 10));
        if (remainingDuration > 0) {
          lines.push('#EXTINF:' + remainingDuration.toFixed(3) + ',');
          lines.push(slateUrl);
        }
      }
    } else {
      lines.push('#EXTINF:' + adBreak.duration.toFixed(3) + ',');
      lines.push(this.cdnBaseUrl + '/slate/default.mp4');
    }

    lines.push('#EXT-X-CUE-IN');
    lines.push('#EXT-X-CUE-IN-CONT:ElapsedTime=0');

    return lines;
  }

  private generateHLSPageableMaster(originalManifest: string, _variantUrls: string[]): string {
    const lines = originalManifest.split('\n');
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const nextLine = lines[i + 1]?.trim() ?? '';

        if (nextLine && !nextLine.startsWith('#')) {
          const variantUrl = nextLine;
          const pageUrl = this.generatePageableUrl(variantUrl);
          newLines.push(line);
          newLines.push(pageUrl);
          i++;
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    newLines.push('#EXT-X-SESSION-KEY:METHOD=SAMPLE-AES,URI="cid:adbazaar",KEYFORMAT="com.apple.streamingkeydelivery",KEYFORMATVERSIONS="1"');
    newLines.push('#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOADING=YES');
    newLines.push('#EXT-X-PAGEABLE-EXTENSION:TYPE="com.adbazaar.ssai",VERSION="1.0"');

    return newLines.join('\n');
  }

  private generatePageableUrl(originalUrl: string): string {
    const url = new URL(originalUrl);
    url.searchParams.set('ssai', '1');
    url.searchParams.set('bid', 'adbazaar');
    return url.toString();
  }

  async processDASHManifest(
    originalUrl: string,
    adBreaks: AdBreak[],
    slateUrl?: string
  ): Promise<string> {
    const manifest = await this.fetchManifest(originalUrl);

    let modifiedManifest = manifest;

    for (const adBreak of adBreaks) {
      modifiedManifest = this.insertDASHAdPeriod(modifiedManifest, adBreak, slateUrl);
    }

    return modifiedManifest;
  }

  private insertDASHAdPeriod(manifest: string, adBreak: AdBreak, slateUrl?: string): string {
    const adPeriodXml = this.generateDASHAdPeriodXml(adBreak, slateUrl);

    const periodInsertPoint = manifest.indexOf('</Period>');
    if (periodInsertPoint === -1) {
      throw new Error('Invalid DASH manifest: no Period element found');
    }

    const insertionIndex = manifest.lastIndexOf('</Period>');
    const before = manifest.substring(0, insertionIndex);
    const after = manifest.substring(insertionIndex);

    return before + adPeriodXml + '\n' + after;
  }

  private generateDASHAdPeriodXml(adBreak: AdBreak, slateUrl?: string): string {
    const adId = 'ad-' + adBreak.id;
    const duration = 'PT' + adBreak.duration.toFixed(3) + 'S';

    let adaptationSetContent = '';

    if (adBreak.insertedAds.length > 0) {
      for (const ad of adBreak.insertedAds) {
        adaptationSetContent += `
        <Representation id="${ad.id}-rep" bandwidth="${ad.duration * 50000}" width="1920" height="1080">
          <BaseURL>${ad.creativeUrl}</BaseURL>
          <SegmentTemplate media="segment_${ad.id}_$Number$.m4s" initialization="init_${ad.id}.m4s" timescale="90000" presentationTimeOffset="${ad.offset * 90000}">
            <SegmentTimeline>
              <S t="0" d="${ad.duration * 90000}" r="0"/>
            </SegmentTimeline>
          </SegmentTemplate>
        </Representation>`;
      }
    } else if (slateUrl) {
      adaptationSetContent += `
        <Representation id="${adId}-slate" bandwidth="5000000" width="1920" height="1080">
          <BaseURL>${slateUrl}</BaseURL>
        </Representation>`;
    } else {
      adaptationSetContent += `
        <Representation id="${adId}-default" bandwidth="5000000" width="1920" height="1080">
          <BaseURL>${this.cdnBaseUrl}/slate/default.mp4</BaseURL>
        </Representation>`;
    }

    return `
  <Period id="${adId}" start="${duration}" duration="${duration}">
    <AdaptationSet id="${adId}-as" contentType="video">
      ${adaptationSetContent}
    </AdaptationSet>
    <AdaptationSet id="${adId}-as-audio" contentType="audio">
      <Representation id="${adId}-audio" bandwidth="128000">
        <BaseURL>${this.cdnBaseUrl}/audio/silence.mp4</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>`;
  }

  private parseAttributes(line: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrString = line.substring(line.indexOf(':') + 1);

    const pairs = attrString.split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        attrs[key.trim()] = value.trim().replace(/^"|"$/g, '');
      }
    }

    return attrs;
  }

  async getManifestInfo(url: string, type: ManifestType): Promise<HLSManifestInfo | DASHManifestInfo> {
    const manifest = await this.fetchManifest(url);

    if (type === 'hls') {
      const variants = this.parseHLSMasterManifest(manifest);
      return {
        masterManifest: manifest,
        variants,
        rawMasterManifest: manifest,
      };
    } else {
      return {
        rawManifest: manifest,
        periods: [],
      };
    }
  }

  generateModifiedManifestUrl(streamId: string, manifestType: ManifestType): string {
    const timestamp = Date.now();
    return `${this.cdnBaseUrl}/manifests/${streamId}.${manifestType}?v=${timestamp}`;
  }
}

export const manifestService = new ManifestService();