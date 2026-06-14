const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9999;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'webhook-notifications' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Initialize Telegram bot if token is provided
let telegramBot;
if (TELEGRAM_BOT_TOKEN) {
  telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

// Utility functions
const formatAlert = (alert) => {
  const severity = alert.labels?.severity || 'unknown';
  const alertname = alert.labels?.alertname || 'Unknown Alert';
  const summary = alert.annotations?.summary || 'No summary available';
  const description = alert.annotations?.description || 'No description available';
  const runbook = alert.annotations?.runbook_url || '';
  const dashboard = alert.annotations?.dashboard_url || '';
  const team = alert.labels?.team || 'unknown';
  const service = alert.labels?.service || 'unknown';

  return {
    severity,
    alertname,
    summary,
    description,
    runbook,
    dashboard,
    team,
    service,
    startsAt: alert.startsAt,
    endsAt: alert.endsAt,
    status: alert.status
  };
};

const getSeverityEmoji = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return '🚨';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📢';
  }
};

const getTeamEmoji = (team) => {
  switch (team?.toLowerCase()) {
    case 'backend': return '⚙️';
    case 'frontend': return '🎨';
    case 'devops': return '🔧';
    case 'security': return '🔒';
    case 'database': return '🗄️';
    case 'platform': return '🏗️';
    default: return '👥';
  }
};

// Notification handlers
const sendSlackNotification = async (webhook, payload) => {
  if (!webhook) {
    logger.warn('Slack webhook URL not configured');
    return;
  }

  const alerts = payload.alerts || [];
  const status = payload.status || 'unknown';
  const groupLabels = payload.groupLabels || {};

  const fields = alerts.map(alert => {
    const formatted = formatAlert(alert);
    return {
      title: `${getSeverityEmoji(formatted.severity)} ${formatted.alertname}`,
      value: `*Summary:* ${formatted.summary}\\n*Team:* ${getTeamEmoji(formatted.team)} ${formatted.team}\\n*Service:* ${formatted.service}\\n*Status:* ${formatted.status}`,
      short: false
    };
  });

  const color = status === 'resolved' ? 'good' :
                payload.alerts?.some(a => a.labels?.severity === 'critical') ? 'danger' : 'warning';

  const slackPayload = {
    username: 'RestoPapa Monitoring',
    icon_emoji: ':rotating_light:',
    attachments: [{
      color: color,
      title: `${status === 'resolved' ? '✅ Resolved' : '🔔 Alert'}: ${groupLabels.alertname || 'Multiple Alerts'}`,
      fields: fields,
      footer: 'RestoPapa AI Sentry',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    await axios.post(webhook, slackPayload);
    logger.info('Slack notification sent successfully');
  } catch (error) {
    logger.error('Failed to send Slack notification:', error.message);
    throw error;
  }
};

const sendDiscordNotification = async (webhook, payload) => {
  if (!webhook) {
    logger.warn('Discord webhook URL not configured');
    return;
  }

  const alerts = payload.alerts || [];
  const status = payload.status || 'unknown';
  const groupLabels = payload.groupLabels || {};

  const embeds = alerts.map(alert => {
    const formatted = formatAlert(alert);
    const color = formatted.severity === 'critical' ? 0xFF0000 :
                  formatted.severity === 'warning' ? 0xFFA500 : 0x00FF00;

    return {
      title: `${getSeverityEmoji(formatted.severity)} ${formatted.alertname}`,
      description: formatted.summary,
      color: color,
      fields: [
        { name: 'Team', value: `${getTeamEmoji(formatted.team)} ${formatted.team}`, inline: true },
        { name: 'Service', value: formatted.service, inline: true },
        { name: 'Severity', value: formatted.severity, inline: true },
        { name: 'Description', value: formatted.description, inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'RestoPapa AI Sentry' }
    };
  });

  const discordPayload = {
    username: 'RestoPapa Monitoring',
    avatar_url: 'https://example.com/monitoring-avatar.png',
    embeds: embeds
  };

  try {
    await axios.post(webhook, discordPayload);
    logger.info('Discord notification sent successfully');
  } catch (error) {
    logger.error('Failed to send Discord notification:', error.message);
    throw error;
  }
};

const sendTeamsNotification = async (webhook, payload) => {
  if (!webhook) {
    logger.warn('Teams webhook URL not configured');
    return;
  }

  const alerts = payload.alerts || [];
  const status = payload.status || 'unknown';
  const groupLabels = payload.groupLabels || {};

  const facts = alerts.map(alert => {
    const formatted = formatAlert(alert);
    return [
      { name: 'Alert', value: formatted.alertname },
      { name: 'Summary', value: formatted.summary },
      { name: 'Team', value: formatted.team },
      { name: 'Service', value: formatted.service },
      { name: 'Severity', value: formatted.severity }
    ];
  }).flat();

  const themeColor = status === 'resolved' ? '00FF00' :
                     alerts.some(a => a.labels?.severity === 'critical') ? 'FF0000' : 'FFA500';

  const teamsPayload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: `RestoPapa Alert: ${groupLabels.alertname || 'Multiple Alerts'}`,
    themeColor: themeColor,
    sections: [{
      activityTitle: `${status === 'resolved' ? '✅ Resolved' : '🔔 Alert'}: RestoPapa Monitoring`,
      activitySubtitle: `${groupLabels.alertname || 'Multiple Alerts'}`,
      facts: facts
    }]
  };

  try {
    await axios.post(webhook, teamsPayload);
    logger.info('Teams notification sent successfully');
  } catch (error) {
    logger.error('Failed to send Teams notification:', error.message);
    throw error;
  }
};

const sendTelegramNotification = async (chatId, payload) => {
  if (!telegramBot || !chatId) {
    logger.warn('Telegram bot not configured or chat ID not provided');
    return;
  }

  const alerts = payload.alerts || [];
  const status = payload.status || 'unknown';
  const groupLabels = payload.groupLabels || {};

  let message = `${status === 'resolved' ? '✅ Resolved' : '🔔 Alert'}: *${groupLabels.alertname || 'Multiple Alerts'}*\\n\\n`;

  alerts.forEach(alert => {
    const formatted = formatAlert(alert);
    message += `${getSeverityEmoji(formatted.severity)} *${formatted.alertname}*\\n`;
    message += `📝 ${formatted.summary}\\n`;
    message += `${getTeamEmoji(formatted.team)} Team: ${formatted.team}\\n`;
    message += `🏷️ Service: ${formatted.service}\\n`;
    message += `📊 Severity: ${formatted.severity}\\n\\n`;
  });

  message += `🤖 *RestoPapa AI Sentry*`;

  try {
    await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    logger.info('Telegram notification sent successfully');
  } catch (error) {
    logger.error('Failed to send Telegram notification:', error.message);
    throw error;
  }
};

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webhook-notifications',
    version: '1.0.0'
  });
});

app.get('/metrics', (req, res) => {
  // Basic metrics endpoint for Prometheus
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP webhook_notifications_total Total number of webhook notifications sent
# TYPE webhook_notifications_total counter
webhook_notifications_total{channel="slack"} ${global.slackCount || 0}
webhook_notifications_total{channel="discord"} ${global.discordCount || 0}
webhook_notifications_total{channel="teams"} ${global.teamsCount || 0}
webhook_notifications_total{channel="telegram"} ${global.telegramCount || 0}

# HELP webhook_notifications_errors_total Total number of webhook notification errors
# TYPE webhook_notifications_errors_total counter
webhook_notifications_errors_total{channel="slack"} ${global.slackErrors || 0}
webhook_notifications_errors_total{channel="discord"} ${global.discordErrors || 0}
webhook_notifications_errors_total{channel="teams"} ${global.teamsErrors || 0}
webhook_notifications_errors_total{channel="telegram"} ${global.telegramErrors || 0}
  `);
});

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
  const payload = req.body;

  logger.info('Received webhook payload:', {
    receiver: payload.receiver,
    status: payload.status,
    alertCount: payload.alerts?.length || 0,
    groupLabels: payload.groupLabels
  });

  const notifications = [];

  // Send to all configured channels
  if (SLACK_WEBHOOK_URL) {
    notifications.push(
      sendSlackNotification(SLACK_WEBHOOK_URL, payload)
        .then(() => { global.slackCount = (global.slackCount || 0) + 1; })
        .catch(error => {
          global.slackErrors = (global.slackErrors || 0) + 1;
          throw error;
        })
    );
  }

  if (DISCORD_WEBHOOK_URL) {
    notifications.push(
      sendDiscordNotification(DISCORD_WEBHOOK_URL, payload)
        .then(() => { global.discordCount = (global.discordCount || 0) + 1; })
        .catch(error => {
          global.discordErrors = (global.discordErrors || 0) + 1;
          throw error;
        })
    );
  }

  if (TEAMS_WEBHOOK_URL) {
    notifications.push(
      sendTeamsNotification(TEAMS_WEBHOOK_URL, payload)
        .then(() => { global.teamsCount = (global.teamsCount || 0) + 1; })
        .catch(error => {
          global.teamsErrors = (global.teamsErrors || 0) + 1;
          throw error;
        })
    );
  }

  if (TELEGRAM_CHAT_ID) {
    notifications.push(
      sendTelegramNotification(TELEGRAM_CHAT_ID, payload)
        .then(() => { global.telegramCount = (global.telegramCount || 0) + 1; })
        .catch(error => {
          global.telegramErrors = (global.telegramErrors || 0) + 1;
          throw error;
        })
    );
  }

  try {
    await Promise.allSettled(notifications);
    res.status(200).json({
      status: 'success',
      message: 'Notifications sent',
      channels: notifications.length
    });
  } catch (error) {
    logger.error('Error sending notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send some notifications',
      error: error.message
    });
  }
});

// Channel-specific endpoints
app.post('/slack', async (req, res) => {
  try {
    await sendSlackNotification(SLACK_WEBHOOK_URL, req.body);
    res.status(200).json({ status: 'success', channel: 'slack' });
  } catch (error) {
    res.status(500).json({ status: 'error', channel: 'slack', error: error.message });
  }
});

app.post('/discord', async (req, res) => {
  try {
    await sendDiscordNotification(DISCORD_WEBHOOK_URL, req.body);
    res.status(200).json({ status: 'success', channel: 'discord' });
  } catch (error) {
    res.status(500).json({ status: 'error', channel: 'discord', error: error.message });
  }
});

app.post('/teams', async (req, res) => {
  try {
    await sendTeamsNotification(TEAMS_WEBHOOK_URL, req.body);
    res.status(200).json({ status: 'success', channel: 'teams' });
  } catch (error) {
    res.status(500).json({ status: 'error', channel: 'teams', error: error.message });
  }
});

app.post('/telegram', async (req, res) => {
  try {
    await sendTelegramNotification(TELEGRAM_CHAT_ID, req.body);
    res.status(200).json({ status: 'success', channel: 'telegram' });
  } catch (error) {
    res.status(500).json({ status: 'error', channel: 'telegram', error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Webhook notification service started on port ${PORT}`);
  logger.info('Configured channels:', {
    slack: !!SLACK_WEBHOOK_URL,
    discord: !!DISCORD_WEBHOOK_URL,
    teams: !!TEAMS_WEBHOOK_URL,
    telegram: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;