export { default as UnifiedPost, default as UnifiedPostModel } from './unified-post.model';
export { default as ContentQueue, default as ContentQueueModel } from './content-queue.model';
export { default as ConnectedPlatform, default as ConnectedPlatformModel } from './connected-platform.model';
export { default as PlatformConfigSchema, type IPlatformConfig, type PlatformType } from './platform-config.model';
export type {
  IUnifiedPost,
  IUnifiedPostDocument,
  IContent,
  IMedia,
  IWorkflow,
  PostStatus,
  WorkflowStatus,
  IPlatformAnalytics,
} from './unified-post.model';
export type {
  IContentQueue,
  IContentQueueDocument,
  QueueStatus,
} from './content-queue.model';
export type {
  IConnectedPlatform,
  IConnectedPlatformDocument,
} from './connected-platform.model';
