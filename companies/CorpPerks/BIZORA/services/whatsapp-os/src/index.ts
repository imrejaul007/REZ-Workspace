/**
 * BIZORA WhatsApp Operating System
 * WhatsApp-First Business Operations
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Service configuration
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bizora_whatsapp_verify_token';

// Menu system for WhatsApp commands
const MENU_COMMANDS = {
  // Main menu
  'menu': {
    text: `📋 *BIZORA Business Menu*

1️⃣ Dashboard - View KPIs
2️⃣ Compliance - GST/TDS status
3️⃣ Payments - Receivables/Payables
4️⃣ Orders - Track orders
5️⃣ Marketing - Campaigns
6️⃣ Team - Staff & Payroll
7️⃣ AI Assistant - Bizora AI

_Reply with a number or type your query_`
  },
  // Dashboard
  '1': {
    text: `🎯 *Business Dashboard*

📊 Today: ₹15,000 (+12%)
📦 Orders: 47 pending
📜 Compliance: ✅ On Track
👥 Team: 12 active

⚠️ Actions needed: 2
🤖 AI Suggestions: 3 new

_Reply with number or /menu_
`
  },
  // Compliance
  '2': {
    text: `📜 *Compliance Status*

✅ GSTR-3B: Filed (May 2026)
✅ TDS: Filed (Q4 FY 2026)
⚠️ *GSTR-1: Due 11th June*
⚠️ *PF/ESI: Due 15th June*

_/file_gst - File now
/menu - Back to menu_
`
  },
  // Payments
  '3': {
    text: `💰 *Payment Summary*

📥 Receivables: ₹45,000
📤 Payables: ₹12,000

*Overdue:*
• Customer A: ₹15,000 (15 days)
• Customer B: ₹8,500 (7 days)
• Customer C: ₹21,500 (3 days)

_/send_reminder - Auto reminder
/menu - Back_
`
  },
  // AI
  '7': {
    text: `🤖 *Bizora AI Assistant*

Ask me anything!

Examples:
• "What's my GST status?"
• "File my May GST"
• "Launch weekend campaign"
• "Send invoice to Rahul"
• "HR report"

_Type your question_
`
  }
};

// Command handlers
const COMMAND_HANDLERS: Record<string, () => string> = {
  '/menu': () => MENU_COMMANDS['menu'].text,
  '/dashboard': () => MENU_COMMANDS['1'].text,
  '/compliance': () => MENU_COMMANDS['2'].text,
  '/payments': () => MENU_COMMANDS['3'].text,
  '/ai': () => MENU_COMMANDS['7'].text,
  '/file_gst': () => `📜 Filing GSTR-3B...

[Auto-filing triggered]
✅ Invoice data auto-populated
✅ Tax calculated: ₹12,500
⏳ Awaiting your confirmation...

_Reply YES to confirm_
`,
  '/send_reminder': () => `📱 Payment reminder sent to 3 customers

_Track responses in dashboard_
`,
  '/launch_campaign': () => `📢 Campaign launching...

🎯 Target: All customers
📊 Audience: 150 customers
💰 Budget: ₹5,000

_/menu - Back_
`,
  '/revenue_report': () => `📊 *Revenue Report*

*Today:* ₹15,000 (+12%)
*This Week:* ₹1,05,000 (+8%)
*This Month:* ₹4,20,000 (+15%)

*By Channel:*
• Dine-in: 40%
• Delivery: 35%
• Takeaway: 25%
`,
  '/business_health': () => `📊 *Business Health Score: 85/100*

✅ Compliance: Excellent
✅ Revenue: Growing 12%
⚠️ Marketing: Needs attention
✅ Team: Engaged

*AI Insights:*
• Weekend campaigns 3x ROI
• Customer retention 92%
• Staff satisfaction 88%
`,
  '/approvals': () => `✅ *Pending Approvals*

1. Leave: 2 requests
2. Expenses: ₹8,500
3. Orders: 5 pending
4. Vendors: 1 contract

_Reply with number to approve_
`,
};

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'whatsapp-os',
    timestamp: new Date().toISOString(),
    commands: Object.keys(MENU_COMMANDS).length + Object.keys(COMMAND_HANDLERS).length,
  });
});

// Process WhatsApp message
app.post('/api/process', (req: Request, res: Response) => {
  const { phone, message } = req.body;

  if (!message) {
    return res.json({ error: 'Message required' });
  }

  const lower = message.toLowerCase().trim();
  const session = getSession(phone);

  // Check command handlers first
  if (COMMAND_HANDLERS[lower]) {
    return res.json({
      response: COMMAND_HANDLERS[lower](),
      session: { state: session.state }
    });
  }

  // Check menu commands
  if (MENU_COMMANDS[lower]) {
    return res.json({
      response: MENU_COMMANDS[lower].text,
      session: { state: session.state }
    });
  }

  // AI-like responses
  if (lower.includes('gst') || lower.includes('tax')) {
    return res.json({
      response: `📜 *GST Status*

Your GSTR-3B for May 2026:
• Total Sales: ₹1,20,000
• Tax: ₹12,500 (₹6,250 CGST + ₹6,250 SGST)
• ITC Available: ₹8,000

*Due: 20th June 2026*

Shall I file it now? Reply *YES* to confirm`,
      session: { state: session.state }
    });
  }

  if (lower.includes('invoice') || lower.includes('payment')) {
    return res.json({
      response: `💳 *Invoice Actions*

1. View All Invoices
2. Send Reminder
3. Create New Invoice
4. Record Payment

_Reply with number_`,
      session: { state: session.state }
    });
  }

  if (lower.includes('campaign') || lower.includes('marketing')) {
    return res.json({
      response: `📢 *Marketing*

Active Campaigns: 2
• Weekend Special - Running
• Summer Sale - Draft

AI Suggestion: Launch weekend campaign for 23% higher footfall.

_Reply LAUNCH to start_
`,
      session: { state: session.state }
    });
  }

  if (lower.includes('employee') || lower.includes('leave') || lower.includes('staff')) {
    return res.json({
      response: `👥 *Team Management*

Pending: 2 leave requests
Attendance: 95% this week
Next Payroll: 15th June

_Pending approvals shown in dashboard_`,
      session: { state: session.state }
    });
  }

  // Default AI response
  res.json({
    response: `🤖 I'm Bizora AI. I can help with:

• "What's my GST status?"
• "File GST return"
• "Send invoice"
• "Launch campaign"
• "Employee leave request"
• "Payment reminder"

_Type your query_`,
    session: { state: session.state }
  });
});

// WhatsApp webhook
app.post('/webhook', (req: Request, res: Response) => {
  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  const phone = message?.from?.replace('91', '');

  if (message?.text?.body) {
    const text = message.text.body;
    logger.info(`[WhatsApp] ${phone}: ${text}`);
  }

  res.sendStatus(200);
});

// Verify webhook
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});

interface Session {
  phone: string;
  state: string;
  lastCommand?: string;
}

const sessions = new Map<string, Session>();

function getSession(phone: string): Session {
  let session = sessions.get(phone);
  if (!session) {
    session = { phone, state: 'menu' };
    sessions.set(phone, session);
  }
  return session;
}

app.listen(4051, () => {
  logger.info(`
╔═══════════════════════════════════════╗
║  💬 WhatsApp Operating System     ║
║  Port: 4051                       ║
║  Menu Commands: 4                  ║
║  Actions: 10+                       ║
╚═══════════════════════════════════════╝
  `);
});
