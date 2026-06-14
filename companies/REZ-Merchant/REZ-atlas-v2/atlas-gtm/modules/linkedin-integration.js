/**
 * LinkedIn Sales Navigator Integration
 *
 * Connects to LinkedIn via:
 * - LinkedIn Sales Navigator API
 * - PhantomBuster API (for automation)
 * - Phantombuster for outreach actions
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Configuration
const linkedinConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || null,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || null,
  accessToken: process.env.LINKEDIN_ACCESS_TOKEN || null,
  salesNavigatorId: process.env.LINKEDIN_SALES_NAV_ID || null,
  phantomBusterKey: process.env.PHANTOBUSTER_KEY || null
};

const LINKEDIN_API = 'https://api.linkedin.com/v2';
const SALES_NAV_API = 'https://api.linkedin.com/sales-api';

// In-memory storage
const connections = new Map();
const outreachMessages = new Map();
const connectionRequests = new Map();
const profiles = new Map();
const groups = new Map();
const campaigns = new Map();

/**
 * Search for prospects on LinkedIn
 */
async function searchProspects(options = {}) {
  const {
    keywords = [],
    titles = [],
    industries = [],
    locations = [],
    companySizes = [],
    seniorities = [],
    limit = 25
  } = options;

  // Build search query
  const query = {
    keywords: keywords.join(' '),
    titleFilter: titles,
    industryFilter: industries,
    locationFilter: locations,
    companySizeFilter: companySizes,
    seniorityFilter: seniorities
  };

  if (!linkedinConfig.accessToken) {
    // Return mock results
    return generateMockProspects(limit, query);
  }

  try {
    // Use Sales Navigator API
    const response = await axios.post(
      `${SALES_NAV_API}/searchQuery`,
      {
        query: {
          keywords: query.keywords,
         Filters: {
            ...(titles.length && { title: titles }),
            ...(industries.length && { industry: industries }),
            ...(locations.length && { geo: locations })
          }
        },
        count: limit
      },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );

    return response.data.elements.map(formatProspect);
  } catch (error) {
    console.error('LinkedIn search error:', error.message);
    return generateMockProspects(limit, query);
  }
}

function generateMockProspects(count, query) {
  const mockProspects = [];
  const firstNames = ['Sarah', 'Michael', 'Priya', 'Raj', 'Aisha', 'David', 'Lisa', 'James', 'Emily', 'Alex'];
  const lastNames = ['Chen', 'Patel', 'Kim', 'Singh', 'Müller', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson'];
  const titles = ['VP of Marketing', 'Head of Growth', 'Director of Sales', 'CMO', 'CEO', 'Founder', 'Marketing Manager', 'Sales Director'];
  const companies = ['TechCorp India', 'GrowthLabs', 'DigitalFirst', 'ScaleUp', 'DataDriven', 'CloudFirst', 'AIVentures', 'MarketPro'];
  const industries = ['Technology', 'SaaS', 'E-commerce', 'Fintech', 'Healthcare', 'Manufacturing'];
  const locations = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    mockProspects.push({
      id: `li_${uuidv4().slice(0, 8)}`,
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      companySize: `${Math.floor(Math.random() * 50) + 10}-${Math.floor(Math.random() * 50) + 50} employees`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      seniority: ['IC', 'Manager', 'Director', 'VP', 'C-level'][Math.floor(Math.random() * 5)],
      connections: Math.floor(Math.random() * 500) + 50,
      profilePicture: null,
      email: `${firstName.toLowerCase()}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s/g, '')}.com`,
      phone: null,
      savedAt: new Date().toISOString(),
      tags: []
    });
  }

  return mockProspects;
}

function formatProspect(raw) {
  return {
    id: raw.id,
    linkedinUrl: raw.publicIdentifier ? `https://linkedin.com/in/${raw.publicIdentifier}` : null,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    fullName: `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    title: raw.headline || '',
    company: raw.companyName || '',
    companySize: raw.employeeCountRange || '',
    industry: raw.industryName || '',
    location: raw.geoLocationName || '',
    seniority: raw.seniority || '',
    connections: raw.connectionCount || 0,
    profilePicture: raw.profilePicture || null,
    email: raw.email || null,
    phone: null,
    savedAt: new Date().toISOString(),
    tags: []
  };
}

/**
 * Get prospect profile
 */
async function getProfile(profileId) {
  // Check cache
  if (profiles.has(profileId)) {
    return profiles.get(profileId);
  }

  if (!linkedinConfig.accessToken) {
    return generateMockProspects(1, {})[0];
  }

  try {
    const response = await axios.get(
      `${SALES_NAV_API}/people/${profileId}`,
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );

    const profile = formatProspect(response.data);
    profiles.set(profileId, profile);
    return profile;
  } catch (error) {
    console.error('LinkedIn profile error:', error.message);
    return null;
  }
}

/**
 * Send connection request
 */
async function sendConnectionRequest(options = {}) {
  const {
    profileId,
    profileUrl,
    message = '',
    note = '',
    greeting = 'Hi {{firstName}}'
  } = options;

  const requestId = uuidv4();

  if (!linkedinConfig.accessToken) {
    // Mock mode
    const mockRequest = {
      id: requestId,
      profileId,
      profileUrl,
      message,
      note,
      status: 'sent',
      sentAt: new Date().toISOString()
    };
    connectionRequests.set(requestId, mockRequest);
    return mockRequest;
  }

  try {
    // Format message with prospect name
    const profile = await getProfile(profileId);
    const formattedMessage = greeting.replace('{{firstName}}', profile?.firstName || 'there');

    const response = await axios.post(
      `${SALES_NAV_API}/invitations`,
      {
        invitee: {
          'com.linkedin.sales.spyglass:memberSynapseGraphqlQueryBasedEntityLookup': {
            identifiers: [{ identifierType: 'PROFILE_URL', identifier: profileUrl }]
          }
        },
        customSubject: formattedMessage,
        customBody: message
      },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308',
          'Content-Type': 'application/json'
        }
      }
    );

    const request = {
      id: requestId,
      profileId,
      profileUrl,
      message: formattedMessage,
      note,
      status: 'sent',
      sentAt: new Date().toISOString(),
      liRequestId: response.data
    };

    connectionRequests.set(requestId, request);
    return request;
  } catch (error) {
    console.error('Connection request error:', error.message);
    throw error;
  }
}

/**
 * Send InMail (Sales Navigator)
 */
async function sendInMail(options = {}) {
  const {
    profileId,
    subject,
    body
  } = options;

  const messageId = uuidv4();

  if (!linkedinConfig.accessToken) {
    const mockMessage = {
      id: messageId,
      profileId,
      subject,
      body,
      type: 'inmail',
      status: 'sent',
      sentAt: new Date().toISOString()
    };
    outreachMessages.set(messageId, mockMessage);
    return mockMessage;
  }

  try {
    const response = await axios.post(
      `${SALES_NAV_API}/inMails`,
      {
        "的歌": {
          "com.linkedin.sales.spyglass.graphql.TemplatedInMailQuery": {
            "query": {
              "recipients": [{ "trackingId": profileId }],
              "template": {
                "subject": subject,
                "body": body
              }
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );

    const message = {
      id: messageId,
      profileId,
      subject,
      body,
      type: 'inmail',
      status: 'sent',
      sentAt: new Date().toISOString(),
      liMessageId: response.data
    };

    outreachMessages.set(messageId, message);
    return message;
  } catch (error) {
    console.error('InMail error:', error.message);
    throw error;
  }
}

/**
 * Save prospect to Sales Navigator
 */
async function saveToSalesNav(profileId, listId = 'saved') {
  if (!linkedinConfig.accessToken) {
    return { success: true, mock: true };
  }

  try {
    await axios.post(
      `${SALES_NAV_API}/entityAssets`,
      {
        entity: profileId,
        listId
      },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Save to Sales Nav error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get engagement insights
 */
async function getEngagementInsights(profileId) {
  if (!linkedinConfig.accessToken) {
    return {
      profileId,
      views: Math.floor(Math.random() * 100),
      searchAppearances: Math.floor(Math.random() * 50),
      connectionRequests: Math.floor(Math.random() * 20),
      inmails: Math.floor(Math.random() * 10),
      engagementRate: (Math.random() * 5).toFixed(1) + '%',
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  try {
    const response = await axios.get(
      `${SALES_NAV_API}/people/${profileId}/engagement`,
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Engagement insights error:', error.message);
    return null;
  }
}

/**
 * Join LinkedIn group
 */
async function joinGroup(groupId) {
  if (!linkedinConfig.accessToken) {
    groups.set(groupId, { id: groupId, joinedAt: new Date().toISOString() });
    return { success: true, mock: true };
  }

  try {
    await axios.post(
      `${LINKEDIN_API}/groupDistinctions`,
      { groupId },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );
    groups.set(groupId, { id: groupId, joinedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Join group error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Post to LinkedIn
 */
async function postUpdate(options = {}) {
  const {
    text,
    media = null,
    visibility = 'PUBLIC'
  } = options;

  if (!linkedinConfig.accessToken) {
    return {
      id: uuidv4(),
      success: true,
      mock: true,
      postUrl: `https://linkedin.com/posts/mock-${uuidv4().slice(0, 8)}`
    };
  }

  try {
    const response = await axios.post(
      `${LINKEDIN_API}/ugcPosts`,
      {
        author: `urn:li:person:${linkedinConfig.salesNavigatorId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: media ? 'IMAGE' : 'NONE',
            ...(media && {
              media: [{
                status: 'READY',
                originalUrl: media
              }]
            })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );

    return {
      id: response.data.id,
      success: true,
      postUrl: `https://linkedin.com/posts/${response.data.id}`
    };
  } catch (error) {
    console.error('Post update error:', error.message);
    throw error;
  }
}

/**
 * Create outreach campaign
 */
function createCampaign(options = {}) {
  const {
    name,
    type = 'connection',
    message,
    note = '',
    targetCriteria = {},
    dailyLimit = 20
  } = options;

  const campaign = {
    id: uuidv4(),
    name,
    type,
    message,
    note,
    targetCriteria,
    dailyLimit,
    status: 'draft',
    stats: {
      sent: 0,
      accepted: 0,
      replied: 0,
      failed: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Execute outreach campaign
 */
async function executeCampaign(campaignId, prospects) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  campaign.status = 'running';
  campaign.startedAt = new Date().toISOString();

  const results = [];
  const today = new Date().toISOString().split('T')[0];
  let sentToday = 0;

  for (const prospect of prospects) {
    if (sentToday >= campaign.dailyLimit) {
      console.log(`Daily limit reached (${campaign.dailyLimit})`);
      break;
    }

    try {
      let result;
      if (campaign.type === 'connection') {
        result = await sendConnectionRequest({
          profileId: prospect.id,
          profileUrl: prospect.linkedinUrl,
          message: campaign.message,
          note: campaign.note
        });
      } else if (campaign.type === 'inmail') {
        result = await sendInMail({
          profileId: prospect.id,
          subject: campaign.message.split('\n')[0] || 'Quick question',
          body: campaign.message
        });
      }

      results.push({ success: true, prospect, result });
      campaign.stats.sent++;
      sentToday++;
    } catch (error) {
      results.push({ success: false, prospect, error: error.message });
      campaign.stats.failed++;
    }

    // Respect rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  campaign.completedAt = new Date().toISOString();
  campaign.status = 'completed';

  return { campaign, results };
}

/**
 * Get campaign analytics
 */
function getCampaignAnalytics(campaignId = null) {
  if (campaignId) {
    const campaign = campaigns.get(campaignId);
    return campaign ? {
      ...campaign,
      stats: {
        ...campaign.stats,
        acceptanceRate: campaign.stats.sent ?
          ((campaign.stats.accepted / campaign.stats.sent) * 100).toFixed(1) + '%' : '0%'
      }
    } : null;
  }

  // Aggregate analytics
  const allCampaigns = Array.from(campaigns.values());
  return {
    total: allCampaigns.length,
    active: allCampaigns.filter(c => c.status === 'running').length,
    completed: allCampaigns.filter(c => c.status === 'completed').length,
    totalSent: allCampaigns.reduce((sum, c) => sum + c.stats.sent, 0),
    totalAccepted: allCampaigns.reduce((sum, c) => sum + c.stats.accepted, 0),
    totalReplied: allCampaigns.reduce((sum, c) => sum + c.stats.replied, 0),
    totalFailed: allCampaigns.reduce((sum, c) => sum + c.stats.failed, 0),
    campaigns: allCampaigns
  };
}

/**
 * Track profile views
 */
async function trackProfileViews() {
  if (!linkedinConfig.accessToken) {
    return {
      views: Math.floor(Math.random() * 50),
      profileSearchAppearances: Math.floor(Math.random() * 30),
      searchRank: Math.floor(Math.random() * 10) + 1
    };
  }

  try {
    const response = await axios.get(
      `${SALES_NAV_API}/me/profileViews`,
      {
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'LinkedIn-Version': '202308'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Profile views error:', error.message);
    return null;
  }
}

module.exports = {
  // Search& Profiles
  searchProspects,
  getProfile,
  getEngagementInsights,
  trackProfileViews,

  // Outreach
  sendConnectionRequest,
  sendInMail,
  saveToSalesNav,

  // Groups
  joinGroup,

  // Content
  postUpdate,

  // Campaigns
  createCampaign,
  executeCampaign,
  getCampaignAnalytics,

  // Storage
  connections,
  outreachMessages,
  connectionRequests,
  profiles,
  campaigns
};