/**
 * Email Service - Transactional Emails
 */

import { redis } from './config/redis';

const EMAIL_QUEUE = 'email:queue:';

interface Email {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  attachments?: string[];
}

/**
 * Send email
 */
export async function sendEmail(email: Email): Promise<void> {
  const id = `email_${Date.now()}`;
  await redis.lpush(EMAIL_QUEUE, JSON.stringify({
    ...email,
    id,
    queuedAt: new Date(),
  }));
}

/**
 * Process email queue (worker)
 */
export async function processEmailQueue(): Promise<void> {
  let consecutiveFailures = 0;
  const MAX_FAILURES = 5;
  const RETRY_DELAY_MS = 5000;

  while (true) {
    try {
      // Check Redis connection before processing
      const pingResult = await redis.ping();
      if (pingResult !== 'PONG') {
        console.warn('[EmailService] Redis ping failed, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      const email = await redis.rpoplpush(EMAIL_QUEUE, 'email:processing');
      if (!email) {
        // No emails, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      try {
        await deliverEmail(JSON.parse(email));
        await redis.del('email:processing');
        consecutiveFailures = 0; // Reset on success
      } catch (error) {
        // Retry logic - put back in queue
        await redis.lpush(EMAIL_QUEUE, email);
        consecutiveFailures++;
        console.error('[EmailService] Email delivery failed:', error);
      }
    } catch (error) {
      consecutiveFailures++;
      console.error('[EmailService] Queue processing error:', error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }

    // Exit if too many consecutive failures
    if (consecutiveFailures >= MAX_FAILURES) {
      console.error('[EmailService] Too many consecutive failures, exiting worker');
      throw new Error('Email queue worker failed: too many consecutive failures');
    }
  }
}

/**
 * Deliver email via provider
 */
async function deliverEmail(email: Email): Promise<void> {
  // Use SendGrid/SES
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: email.from || 'noreply@rezapp.com' },
      subject: email.subject,
      content: [{ type: 'text/html', value: email.body }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed: ${response.statusText}`);
  }
}
