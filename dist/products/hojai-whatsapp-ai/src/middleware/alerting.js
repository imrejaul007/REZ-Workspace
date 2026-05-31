// Alerting service
import axios from 'axios';
export var AlertLevel;
(function (AlertLevel) {
    AlertLevel["INFO"] = "info";
    AlertLevel["WARN"] = "warn";
    AlertLevel["ERROR"] = "error";
    AlertLevel["CRITICAL"] = "critical";
})(AlertLevel || (AlertLevel = {}));
const alerts = [];
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
export async function alert(level, message, context) {
    const newAlert = {
        level,
        message,
        context,
        timestamp: new Date()
    };
    alerts.unshift(newAlert);
    if (alerts.length > 1000)
        alerts.pop();
    console.error(`[ALERT:${level}] ${message}`, context);
    // Send to Slack
    if (SLACK_WEBHOOK && (level === AlertLevel.ERROR || level === AlertLevel.CRITICAL)) {
        try {
            await axios.post(SLACK_WEBHOOK, {
                text: `*[${level.toUpperCase()}]* ${message}`,
                blocks: [
                    { type: 'section', text: { type: 'mrkdwn', text: `*${message}*` } },
                    { type: 'section', text: { type: 'mrkdwn', text: '```' + JSON.stringify(context) + '```' } }
                ]
            });
        }
        catch {
            // Silently fail Slack webhook
        }
    }
}
export function getAlerts(limit = 100) {
    return alerts.slice(0, limit);
}
export function clearAlerts() {
    alerts.length = 0;
}
//# sourceMappingURL=alerting.js.map