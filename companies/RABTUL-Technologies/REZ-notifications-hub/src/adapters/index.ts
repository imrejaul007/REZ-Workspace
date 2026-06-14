export { BaseAdapter } from './base.adapter';
export { EmailAdapter } from './email.adapter';
export { SmsAdapter } from './sms.adapter';
export { WhatsAppAdapter } from './whatsapp.adapter';
export { PushAdapter } from './push.adapter';

import { EmailAdapter } from './email.adapter';
import { SmsAdapter } from './sms.adapter';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { PushAdapter } from './push.adapter';
import { BaseAdapter } from './base.adapter';
import { NotificationChannel } from '../types';

// Adapter registry
export class AdapterRegistry {
  private adapters: Map<NotificationChannel, BaseAdapter> = new Map();

  constructor() {
    // Initialize all adapters
    this.register('email', new EmailAdapter());
    this.register('sms', new SmsAdapter());
    this.register('whatsapp', new WhatsAppAdapter());
    this.register('push', new PushAdapter());
  }

  register(channel: NotificationChannel, adapter: BaseAdapter): void {
    this.adapters.set(channel, adapter);
  }

  get(channel: NotificationChannel): BaseAdapter | undefined {
    return this.adapters.get(channel);
  }

  getAll(): Map<NotificationChannel, BaseAdapter> {
    return this.adapters;
  }

  has(channel: NotificationChannel): boolean {
    return this.adapters.has(channel);
  }
}

export const adapterRegistry = new AdapterRegistry();
