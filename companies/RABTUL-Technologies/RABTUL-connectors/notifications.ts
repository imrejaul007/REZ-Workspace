/**
 * RABTUL Notification Connector
 * Port: 4011
 */
import axios from 'axios';

const NOTIFY_URL = process.env.NOTIFY_URL || 'http://localhost:4011';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export class NotificationConnector {
  private url: string;
  private token: string;

  constructor(url?: string, token?: string) {
    this.url = url || NOTIFY_URL;
    this.token = token || TOKEN || '';
  }

  private headers() {
    return {
      'X-Internal-Token': this.token,
      'Content-Type': 'application/json'
    };
  }

  // Send push notification
  async push(userId: string, title: string, body: string, data?: Record<string, any>) {
    const res = await axios.post(`${this.url}/api/notifications/push`, { userId, title, body, data }, { headers: this.headers() });
    return res.data;
  }

  // Send SMS
  async sms(phone: string, message: string) {
    const res = await axios.post(`${this.url}/api/notifications/sms`, { phone, message }, { headers: this.headers() });
    return res.data;
  }

  // Send WhatsApp
  async whatsapp(phone: string, template: string, variables?: Record<string, string>) {
    const res = await axios.post(`${this.url}/api/channels/whatsapp/send`, { phone, template, variables }, { headers: this.headers() });
    return res.data;
  }

  // Send email
  async email(to: string, subject: string, template: string, variables?: Record<string, string>) {
    const res = await axios.post(`${this.url}/api/notifications/email`, { to, subject, template, variables }, { headers: this.headers() });
    return res.data;
  }
}

export const notificationConnector = new NotificationConnector();
