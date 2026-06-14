import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import cron from 'node-cron';

export interface QueuedPost {
  id: string;
  content: string;
  platform: string;
  scheduledFor: Date;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  retries: number;
  lastError?: string;
  createdAt: Date;
}

export class PostQueue {
  private queue: Map<string, QueuedPost> = new Map();
  private processing = false;

  start() {
    // Process queue every minute
    cron.schedule('* * * * *', () => this.processQueue());
    logger.info('Post Queue started');
  }

  addToQueue(post: Omit<QueuedPost, 'id' | 'status' | 'retries' | 'createdAt'>): QueuedPost {
    const queuedPost: QueuedPost = {
      ...post,
      id: uuidv4(),
      status: 'pending',
      retries: 0,
      createdAt: new Date()
    };
    this.queue.set(queuedPost.id, queuedPost);
    logger.info(`Added post ${queuedPost.id} to queue for ${scheduledFor.toISOString()}`);
    return queuedPost;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    const now = new Date();
    const duePosts = Array.from(this.queue.values())
      .filter(p => p.status === 'pending' && new Date(p.scheduledFor) <= now);

    for (const post of duePosts) {
      await this.publishPost(post);
    }

    this.processing = false;
  }

  private async publishPost(post: QueuedPost) {
    post.status = 'scheduled';
    try {
      logger.info(`Publishing post ${post.id} to ${post.platform}`);
      // Simulate publish
      await new Promise(resolve => setTimeout(resolve, 100));
      post.status = 'published';
    } catch (error: any) {
      post.retries++;
      post.lastError = error.message;
      if (post.retries >= 3) {
        post.status = 'failed';
      } else {
        post.status = 'pending';
        post.scheduledFor = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 min
      }
    }
  }

  getQueue(status?: string): QueuedPost[] {
    let posts = Array.from(this.queue.values());
    if (status) posts = posts.filter(p => p.status === status);
    return posts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  remove(id: string): boolean {
    return this.queue.delete(id);
  }
}

const scheduledFor = new Date();
