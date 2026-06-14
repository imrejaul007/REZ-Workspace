import { z } from 'zod';

export const InsertedAdSchema = z.object({
  id: z.string(),
  adId: z.string(),
  creativeUrl: z.string().url(),
  clickUrl: z.string().url().optional(),
  duration: z.number().positive(),
  offset: z.number().nonnegative(),
  status: z.enum(['pending', 'playing', 'completed', 'skipped']),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const AdBreakSchema = z.object({
  id: z.string(),
  position: z.enum(['preroll', 'midroll', 'postroll']),
  offset: z.number().optional(),
  duration: z.number().positive(),
  maxAds: z.number().int().positive().default(10),
  status: z.enum(['scheduled', 'active', 'completed']).default('scheduled'),
  insertedAds: z.array(InsertedAdSchema).default([]),
  scheduledTime: z.date().optional(),
  actualStartTime: z.date().optional(),
  actualEndTime: z.date().optional(),
});

export const StreamManifestSchema = z.object({
  streamId: z.string(),
  contentId: z.string(),
  contentType: z.enum(['live', 'vod']),
  originalManifestUrl: z.string().url(),
  modifiedManifestUrl: z.string().url().optional(),
  manifestType: z.enum(['hls', 'dash']),
  adBreaks: z.array(AdBreakSchema).default([]),
  slateUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'completed']).default('active'),
});

export const SCTE35CueMessageSchema = z.object({
  id: z.string(),
  streamId: z.string(),
  spliceEventType: z.enum(['splice_insert', 'splice_schedule', 'time_signal', 'bandwidth_sharing']),
  spliceEventId: z.number().int().nonnegative(),
  spliceCommandType: z.number().int(),
  spliceInsert: z.object({
    spliceEventId: z.number().int(),
    spliceExecuteFlag: z.boolean(),
    breakDuration: z.number(),
    availNum: z.number().int().optional(),
    availsExpected: z.number().int().optional(),
  }),
  segmentationDescriptor: z
    .object({
      segmentationEventId: z.number().int(),
      segmentationTypeId: z.number().int(),
      segmentNum: z.number().int().optional(),
      segmentsExpected: z.number().int().optional(),
      subSegmentNum: z.number().int().optional(),
      subSegmentsExpected: z.number().int().optional(),
    })
    .optional(),
  ptsOffset: z.number().optional(),
  duration: z.number().optional(),
  rawData: z.instanceof(Buffer).optional(),
  processedAt: z.date(),
});

export const ManifestProcessRequestSchema = z.object({
  contentUrl: z.string().url(),
  contentType: z.enum(['live', 'vod']),
  manifestType: z.enum(['hls', 'dash']),
  adBreaks: z.array(AdBreakSchema.partial()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

export const AdBreakCompleteRequestSchema = z.object({
  adBreakId: z.string(),
  completedAds: z.array(z.string()).min(1),
  totalDuration: z.number().positive(),
  exitPosition: z.enum(['natural', 'early', 'timeout']).optional(),
});

export const SCTE35ProcessRequestSchema = z.object({
  streamId: z.string(),
  rawData: z.string(),
  ptsTime: z.number().optional(),
  timestamp: z.date().optional(),
});

export const SpliceInsertRequestSchema = z.object({
  streamId: z.string(),
  spliceEventId: z.number().int(),
  breakDuration: z.number().positive(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  assets: z.array(z.string()).optional(),
});

export type InsertedAdInput = z.infer<typeof InsertedAdSchema>;
export type AdBreakInput = z.infer<typeof AdBreakSchema>;
export type StreamManifestInput = z.infer<typeof StreamManifestSchema>;
export type SCTE35CueMessageInput = z.infer<typeof SCTE35CueMessageSchema>;
export type ManifestProcessRequestInput = z.infer<typeof ManifestProcessRequestSchema>;
export type AdBreakCompleteRequestInput = z.infer<typeof AdBreakCompleteRequestSchema>;
export type SCTE35ProcessRequestInput = z.infer<typeof SCTE35ProcessRequestSchema>;
export type SpliceInsertRequestInput = z.infer<typeof SpliceInsertRequestSchema>;