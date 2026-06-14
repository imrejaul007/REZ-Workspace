/**
 * Notification Service - Handles sending alerts via various channels
 */

import axios from 'axios';
import nodemailer from 'nodemailer';
import { ICrisisAlert } from '../models';
import { ICrisisPlaybook, IPlaybookNotification } from '../models';
import config from '../config';
import { crisisMetrics } from '../utils/metrics';
import logger from '../utils/logger';

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    if (config.email.username && config.email.password) {
      this.emailTransporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpSecure,
        auth: {
          user: config.email.username,
          pass: config.email.password,
        },
      });
    }
  }

  /**
   * Send alert notification to configured channels
   */
  async sendAlertNotification(alert: ICrisisAlert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to Slack
    if (config.slackWebhookUrl) {
      promises.push(this.sendSlackNotification(alert));
    }

    // Send email for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      promises.push(this.sendEmailNotification(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send escalation notification
   */
  async sendEscalationNotification(alert: ICrisisAlert, escalateTo: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    if (config.slackWebhookUrl) {
      promises.push(this.sendSlackEscalation(alert, escalateTo));
    }

    // Always send email for escalations
    promises.push(this.sendEscalationEmail(alert, escalateTo));

    await Promise.allSettled(promises);
  }

  /**
   * Send playbook notification
   */
  async sendPlaybookNotification(
    alert: ICrisisAlert,
    playbook: ICrisisPlaybook,
    notification: IPlaybookNotification
  ): Promise<void> {
    const message = this.formatPlaybookMessage(alert, playbook, notification);

    if (notification.channel === 'slack') {
      await this.sendSlackMessage(notification.recipients.join(','), message);
    } else if (notification.channel === 'email') {
      await this.sendEmail(
        notification.recipients,
        `Playbook Triggered: ${playbook.name}`,
        message
      );
    }
  }

  /**
   * Send Slack notification for new alert
   */
  private async sendSlackNotification(alert: ICrisisAlert): Promise<void> {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${severityEmoji} Crisis Alert: ${alert.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity:*\n${alert.severity.toUpperCase()}` },
            { type: 'mrkdwn', text: `*Type:*\n${alert.type}` },
            { type: 'mrkdwn', text: `*Status:*\n${alert.status}` },
            { type: 'mrkdwn', text: `*Mentions:*\n${alert.metrics.mentions}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${alert.description}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Source:* ${alert.source.platform}${alert.source.authorUsername ? ` (@${alert.source.authorUsername})` : ''}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Alert ID: ${alert.alertId} | Created: ${alert.createdAt.toISOString()}`,
            },
          ],
        },
      ],
    };

    await this.sendSlackWebhook(message);
    crisisMetrics.incrementNotificationsSent('slack');
    logger.info('Slack notification sent', { alertId: alert.alertId });
  }

  /**
   * Send Slack escalation notification
   */
  private async sendSlackEscalation(alert: ICrisisAlert, escalateTo: string[]): Promise<void> {
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `ESCALATION: ${alert.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Alert has been escalated to: ${escalateTo.join(', ')}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity:*\n${alert.severity.toUpperCase()}` },
            { type: 'mrkdwn', text: `*Alert ID:*\n${alert.alertId}` },
          ],
        },
      ],
    };

    await this.sendSlackWebhook(message);
    crisisMetrics.incrementNotificationsSent('slack');
  }

  /**
   * Send Slack webhook
   */
  private async sendSlackWebhook(message: object): Promise<void> {
    if (!config.slackWebhookUrl) return;

    try {
      await axios.post(config.slackWebhookUrl, message, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  /**
   * Send Slack message to specific recipients (channels or users)
   */
  private async sendSlackMessage(recipient: string, message: string): Promise<void> {
    // In a real implementation, this would use Slack API to send DMs
    logger.info('Slack message would be sent', { recipient, message });
    crisisMetrics.incrementNotificationsSent('slack');
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: ICrisisAlert): Promise<void> {
    const subject = `[${alert.severity.toUpperCase()}] Crisis Alert: ${alert.title}`;
    const html = this.formatAlertEmail(alert);

    await this.sendEmail([config.email.from], subject, html);
    crisisMetrics.incrementNotificationsSent('email');
    logger.info('Email notification sent', { alertId: alert.alertId });
  }

  /**
   * Send escalation email
   */
  private async sendEscalationEmail(alert: ICrisisAlert, escalateTo: string[]): Promise<void> {
    const subject = `ESCALATION: Crisis Alert ${alert.alertId}`;
    const html = `
      <h2>Crisis Alert Escalated</h2>
      <p><strong>Alert:</strong> ${alert.title}</p>
      <p><strong>ID:</strong> ${alert.alertId}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Escalated To:</strong> ${escalateTo.join(', ')}</p>
      <p><strong>Description:</strong> ${alert.description}</p>
    `;

    await this.sendEmail(escalateTo, subject, html);
    crisisMetrics.incrementNotificationsSent('email');
  }

  /**
   * Send email
   */
  private async sendEmail(to: string[], subject: string, html: string): Promise<void> {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured, skipping email');
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: config.email.from,
        to: to.join(', '),
        subject,
        html,
      });
    } catch (error) {
      logger.error('Failed to send email', { error, to });
    }
  }

  /**
   * Format alert email HTML
   */
  private formatAlertEmail(alert: ICrisisAlert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Crisis Alert</h1>
          <p style="margin: 10px 0 0 0;">${alert.title}</p>
        </div>
        <div style="padding: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Severity</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.severity.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Type</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Status</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.status}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mentions</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.metrics.mentions}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Sentiment</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.metrics.sentiment}</td>
            </tr>
          </table>
          <h3>Description</h3>
          <p>${alert.description}</p>
          <h3>Source</h3>
          <p>Platform: ${alert.source.platform}</p>
          ${alert.source.authorUsername ? `<p>Author: @${alert.source.authorUsername}</p>` : ''}
          ${alert.source.postUrl ? `<p>Link: <a href="${alert.source.postUrl}">View Post</a></p>` : ''}
          <hr>
          <p style="color: #666; font-size: 12px;">
            Alert ID: ${alert.alertId}<br>
            Created: ${alert.createdAt.toISOString()}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Format playbook notification message
   */
  private formatPlaybookMessage(
    alert: ICrisisAlert,
    playbook: ICrisisPlaybook,
    notification: IPlaybookNotification
  ): string {
    return notification.template
      .replace('{{alertId}}', alert.alertId)
      .replace('{{alertTitle}}', alert.title)
      .replace('{{severity}}', alert.severity)
      .replace('{{playbookName}}', playbook.name);
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      low: ':bell:',
      medium: ':warning:',
      high: ':exclamation:',
      critical: ':rotating_light:',
    };
    return emojis[severity] || ':bell:';
  }

  /**
   * Get severity color for email
   */
  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };
    return colors[severity] || '#6c757d';
  }
}
