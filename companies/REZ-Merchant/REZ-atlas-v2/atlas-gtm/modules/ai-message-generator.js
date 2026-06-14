/**
 * AI Message Generator
 *
 * Uses OpenAI to generate personalized outreach messages
 * for Email, LinkedIn, WhatsApp, and Call scripts
 */

const OpenAI = require('openai');

// Initialize OpenAI client (supports both OpenAI and Anthropic via same interface)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-demo'
});

/**
 * Generate personalized email
 */
async function generateEmail(prospect, campaign, options = {}) {
  const {
    tone = 'professional',
    length = 'medium',
    includePainPoint = true,
    includeCaseStudy = true
  } = options;

  const companyInsight = campaign.companyInsight || {};
  const painPoints = prospect.painPoints || [];

  const systemPrompt = `You are an expert B2B sales copywriter specializing in personalized outreach emails.
Your emails are:
- Concise (under 150 words)
- Personalized to the recipient
- Focus on value, not features
- Include a clear call-to-action
- Written in a ${tone} tone
- Break the "Hi [Name]" pattern with creative openers`;

  const userPrompt = `Generate a personalized email for the following:

RECIPIENT:
- Name: ${prospect.firstName || 'there'}
- Title: ${prospect.persona || 'Marketing Leader'}
- Company: ${prospect.company}
- Seniority: ${prospect.seniority || 'Manager'}
${includePainPoint && painPoints.length ? `- Pain Points: ${painPoints.join(', ')}` : ''}

SENDER COMPANY (us):
- Name: ${campaign.domain || 'REZ'}
- Industry: ${companyInsight.industry || 'Technology'}
- Value Props: ${(companyInsight.valueProps || []).join(', ')}
- Differentiators: ${(companyInsight.differentiators || []).join(', ')}

TASK:
Write a personalized email that:
1. Has a creative, non-generic subject line
2. Opens with something specific to their situation
3. Addresses their pain point (if provided)
4. Shows understanding of their industry
5. Ends with a clear, low-commitment CTA

Format output as JSON:
{
  "subject": "email subject line",
  "preview": "2-3 word preview text",
  "body": "full email body (markdown format, line breaks OK)"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    // Fallback to template
    return generateEmailTemplate(prospect, campaign);
  }
}

/**
 * Generate LinkedIn message
 */
async function generateLinkedIn(prospect, campaign, options = {}) {
  const { tone = 'conversational' } = options;

  const systemPrompt = `You are an expert LinkedIn outreach specialist.
Your messages are:
- Under 300 characters for connection requests
- Under 500 characters for follow-up messages
- Conversational, not salesy
- Reference something specific about them
- End with a question or soft CTA`;

  const userPrompt = `Generate a LinkedIn message for:

PROSPECT:
- Name: ${prospect.firstName || 'there'}
- Title: ${prospect.persona || 'VP Marketing'}
- Company: ${prospect.company}
- Pain Points: ${(prospect.painPoints || []).join(', ')}

OUR COMPANY: ${campaign.domain || 'REZ'}
- Industry: ${(campaign.companyInsight || {}).industry || 'Tech'}

Generate 2 LinkedIn messages:
1. Connection request note (under 300 chars)
2. Follow-up message after connecting (under 500 chars)

Format as JSON:
{
  "connectionNote": "short connection note",
  "followUp": "follow-up message"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    return generateLinkedInTemplate(prospect, campaign);
  }
}

/**
 * Generate WhatsApp message
 */
async function generateWhatsApp(prospect, campaign, options = {}) {
  const systemPrompt = `You are a WhatsApp outreach specialist for B2B sales.
WhatsApp messages are:
- Very short (under 200 chars for first message)
- Conversational and friendly
- Don't use formal language
- Include emojis appropriately
- Reference context quickly`;

  const userPrompt = `Generate WhatsApp messages for:

PROSPECT: ${prospect.firstName || 'there'} from ${prospect.company}
PAIN POINTS: ${(prospect.painPoints || []).join(', ')}

Generate:
1. Introduction message (under 200 chars)
2. Follow-up message (under 300 chars)

Format as JSON:
{
  "intro": "first message",
  "followUp": "follow-up message"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    return generateWhatsAppTemplate(prospect, campaign);
  }
}

/**
 * Generate call script
 */
async function generateCallScript(prospect, campaign, options = {}) {
  const systemPrompt = `You are an expert B2B sales coach helping create phone scripts.
Your scripts:
- Start with a soft opener, not "Hi this is X calling from Y"
- Include discovery questions
- Have objection handlers ready
- End with a clear next step`;

  const userPrompt = `Generate a phone call script for:

PROSPECT: ${prospect.firstName || 'there'}
- Title: ${prospect.persona}
- Company: ${prospect.company}
- Pain Points: ${(prospect.painPoints || []).join(', ')}

Generate:
1. Opening (how to start the call)
2. 4 discovery questions to understand their situation
3. Key talking points
4. How to close/ask for next step
5. Objection handlers for: "not interested", "send me an email", "too expensive"

Format as JSON:
{
  "opening": "how to start",
  "discovery": ["question 1", "question 2", "question 3", "question 4"],
  "talkingPoints": ["point 1", "point 2", "point 3"],
  "close": "how to ask for next step",
  "objections": {
    "not interested": "handler",
    "send me email": "handler",
    "too expensive": "handler"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    return generateCallScriptTemplate(prospect, campaign);
  }
}

/**
 * Generate cold call opener
 */
async function generateColdCallOpener(prospect, campaign) {
  const userPrompt = `Give me a single, compelling cold call opener for:
- ${prospect.firstName || 'this prospect'} at ${prospect.company}
- They are a ${prospect.persona || 'marketing leader'}
- Their pain point: ${(prospect.painPoints || ['growing revenue'])[0]}

Keep it under 20 words. Make it something that creates curiosity or relates to their specific situation.
Do NOT use "Hi, this is X from Y" as the first words.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at cold call openers. Be direct and compelling.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 100
    });

    return { opener: response.choices[0].message.content };
  } catch (error) {
    return { opener: `Quick question about ${prospect.company}...` };
  }
}

/**
 * Generate all messages at once
 */
async function generateAllMessages(prospect, campaign, options = {}) {
  const [email, linkedin, whatsapp, callScript] = await Promise.all([
    generateEmail(prospect, campaign, options),
    generateLinkedIn(prospect, campaign, options),
    generateWhatsApp(prospect, campaign, options),
    generateCallScript(prospect, campaign, options)
  ]);

  return {
    email,
    linkedin,
    whatsapp,
    callScript,
    generatedAt: new Date().toISOString()
  };
}

// ============================================
// TEMPLATE FALLBACKS (when AI is unavailable)
// ============================================

function generateEmailTemplate(prospect, campaign) {
  const companyInsight = campaign.companyInsight || {};
  return {
    subject: `${prospect.company} + ${companyInsight.industry || 'loyalty'} - quick question`,
    preview: 'Saw something interesting',
    body: `Hi ${prospect.firstName || 'there'},

I came across ${prospect.company} and noticed a few things that got me thinking.

For companies like ${prospect.company}, the biggest opportunity we see is around ${(prospect.painPoints || ['customer retention'])[0]}. Most teams in ${prospect.persona || 'your role'} spend a lot of time on acquisition, but the real leverage is often in maximizing what you already have.

We've helped companies similar to yours increase repeat purchases by 25-40% in the first 90 days. Curious if that's relevant to what you're working on?

Would love to share how in a quick 15-min call.

Best,
Alex
REZ Money`
  };
}

function generateLinkedInTemplate(prospect, campaign) {
  return {
    connectionNote: `Hi ${prospect.firstName || 'there'} - I help companies like ${prospect.company} increase customer loyalty. Would love to connect and share some insights.`,
    followUp: `Hey ${prospect.firstName || 'there'}! Thanks for connecting.

Quick question - is retention a focus area for ${prospect.company} right now?

We work with ${prospect.persona || 'marketing teams'} who want to turn one-time buyers into loyal customers. Happy to share how if it's relevant.`
  };
}

function generateWhatsAppTemplate(prospect, campaign) {
  return {
    intro: `Hey ${prospect.firstName || 'there'}! 👋

Saw ${prospect.company} and thought you might be interested in our loyalty solution that helps brands like yours boost repeat purchases by 25-40%.

Worth a quick chat?`,
    followUp: `Hey! 👋 Just circling back on my message. Would love to share how we helped similar companies boost retention. Let me know if you're interested! 📈`
  };
}

function generateCallScriptTemplate(prospect, campaign) {
  return {
    opening: `Hi ${prospect.firstName || 'there'}, this is Alex from REZ Money. Do you have 2 minutes? I saw ${prospect.company} and had a quick question about your customer retention strategy.`,
    discovery: [
      'What does your current customer retention look like?',
      'What\'s your average customer lifetime value?',
      'Have you looked at loyalty programs before?',
      'What would a 20% improvement in retention mean for your business?'
    ],
    talkingPoints: [
      `${prospect.company} could increase repeat purchases by 25-40%`,
      `We integrate with ${['Shopify', 'Magento', 'WooCommerce'][Math.floor(Math.random() * 3)]} in one click`,
      'Companies see results in 30 days'
    ],
    close: 'Based on what you\'ve shared, I think we could help. Would you be open to a demo where I show you exactly how this would work for your team?',
    objections: {
      'not interested': 'I understand. What would need to be true for this to be interesting?',
      'send me email': 'Happy to email details. But first, let me ask - what would make this worth a 15-min call?',
      'too expensive': 'What if I could show you how companies fund this from the additional revenue they generate?'
    }
  };
}

module.exports = {
  generateEmail,
  generateLinkedIn,
  generateWhatsApp,
  generateCallScript,
  generateColdCallOpener,
  generateAllMessages
};