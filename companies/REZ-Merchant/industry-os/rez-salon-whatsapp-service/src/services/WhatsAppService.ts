import logger from './utils/logger';

import { Client, LocalAuth, Message, List, Buttons, Location } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { IMessage, MessageType } from '../models/Conversation';

export interface WhatsAppConfig {
  puppeteer?: {
    headless?: boolean;
    args?: string[];
  };
  authStrategy?: 'local' | 'cloud';
  qrTimeout?: number;
  qrCacheTime?: number;
}

export interface OutgoingMessage {
  to: string;
  content: string | Message | List | Buttons;
  type?: MessageType;
  mediaUrl?: string;
  buttons?: { id: string; title: string; }[];
  list?: {
    title: string;
    rows: { id: string; title: string; description?: string; }[];
  };
}

export class WhatsAppService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private qrCodeData: string | null = null;
  private messageHandlers: Map<string, (message: IMessage) => Promise<void>> = new Map();
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig = {}) {
    this.config = {
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      ...config
    };
  }

  async initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
        puppeteer: this.config.puppeteer
      });

      this.client.on('qr', async (qr: string) => {
        this.qrCodeData = qr;
        try {
          const qrImage = await qrcode.toDataURL(qr);
          resolve(qrImage);
        } catch (error) {
          reject(error);
        }
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('WhatsApp client is ready');
      });

      this.client.on('message', async (message: Message) => {
        await this.handleIncomingMessage(message);
      });

      this.client.on('disconnected', () => {
        this.isConnected = false;
        logger.info('WhatsApp client disconnected');
      });

      this.client.on('auth_failure', (error) => {
        console.error('WhatsApp auth failure:', error);
        reject(error);
      });

      this.client.initialize().catch(reject);
    });
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();

      const incomingMessage: IMessage = {
        from: message.from,
        to: message.to,
        content: message.body,
        type: this.mapMessageType(message),
        timestamp: message.timestamp,
        mediaUrl: await this.getMediaUrl(message),
        metadata: {
          hasMedia: message.hasMedia,
          isGroup: chat.isGroup,
          contactName: contact.pushname || contact.name || 'Unknown'
        }
      };

      for (const handler of this.messageHandlers.values()) {
        await handler(incomingMessage);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  private mapMessageType(message: Message): MessageType {
    if (message.hasMedia) {
      if (message.type === 'image') return MessageType.IMAGE;
      if (message.type === 'video') return MessageType.VIDEO;
      if (message.type === 'audio') return MessageType.AUDIO;
      if (message.type === 'document') return MessageType.DOCUMENT;
    }
    if (message.type === 'location') return MessageType.LOCATION;
    if (message.type === 'buttons_response' || message.type === 'list_response') {
      return MessageType.INTERACTIVE;
    }
    return MessageType.TEXT;
  }

  private async getMediaUrl(message: Message): Promise<string | undefined> {
    if (!message.hasMedia) return undefined;
    try {
      const media = await message.downloadMedia();
      if (media && media.mimetype) {
        const ext = media.mimetype.split('/')[1]?.split(';')[0] || 'bin';
        return `data:${media.mimetype};base64,${media.data}`;
      }
    } catch (error) {
      console.error('Error downloading media:', error);
    }
    return undefined;
  }

  onMessage(handlerId: string, handler: (message: IMessage) => Promise<void>): void {
    this.messageHandlers.set(handlerId, handler);
  }

  removeMessageHandler(handlerId: string): void {
    this.messageHandlers.delete(handlerId);
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp client is not connected');
    }

    const chatId = `${message.to}@c.us`;

    if (message.buttons && message.buttons.length > 0) {
      const buttons = new Buttons(
        message.content as string,
        message.buttons.map(b => ({ id: b.id, body: b.title })),
        'Salon Bot',
        'Choose an option'
      );
      await this.client.sendMessage(chatId, buttons);
      return uuidv4();
    }

    if (message.list) {
      const listMessage = new List(
        message.list.title,
        'View options',
        message.list.rows.map(r => ({ id: r.id, title: r.title, description: r.description })),
        message.content
      );
      await this.client.sendMessage(chatId, listMessage);
      return uuidv4();
    }

    if (message.mediaUrl) {
      const mediaMessage = await this.client.sendMessage(
        chatId,
        message.content,
        { media: Buffer.from(message.mediaUrl.split(',')[1], 'base64') }
      );
      return mediaMessage.id._serialized;
    }

    const sentMessage = await this.client.sendMessage(chatId, message.content);
    return sentMessage.id._serialized;
  }

  async sendTextMessage(to: string, content: string): Promise<string> {
    return this.sendMessage({ to, content, type: MessageType.TEXT });
  }

  async sendButtonMessage(to: string, content: string, buttons: { id: string; title: string }[]): Promise<string> {
    return this.sendMessage({ to, content, buttons, type: MessageType.BUTTON });
  }

  async sendListMessage(
    to: string,
    content: string,
    title: string,
    rows: { id: string; title: string; description?: string }[]
  ): Promise<string> {
    return this.sendMessage({
      to,
      content,
      type: MessageType.INTERACTIVE,
      list: { title, rows }
    });
  }

  async sendMediaMessage(to: string, content: string, mediaUrl: string): Promise<string> {
    return this.sendMessage({ to, content, mediaUrl, type: MessageType.IMAGE });
  }

  async getContactInfo(phoneNumber: string): Promise<{ name?: string; pushname?: string } | null> {
    if (!this.client) return null;
    try {
      const contact = await this.client.getContactById(`${phoneNumber}@c.us`);
      return { name: contact.name, pushname: contact.pushname };
    } catch {
      return null;
    }
  }

  async getQRCode(): Promise<string | null> {
    return this.qrCodeData;
  }

  getConnectionStatus(): { isConnected: boolean; qrCode?: string | null } {
    return {
      isConnected: this.isConnected,
      qrCode: this.qrCodeData
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const whatsAppService = new WhatsAppService();
