import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Property API
export const propertyApi = {
  search: (params: Record<string, any>) => api.get('/api/v1/properties', { params }),
  getById: (id: string) => api.get(`/api/v1/properties/${id}`),
  getFeatured: () => api.get('/api/v1/properties/featured'),
  getNewLaunches: () => api.get('/api/v1/properties/new-launches'),
}

// Lead API
export const leadApi = {
  create: (data: any) => api.post('/api/v1/leads', data),
  getById: (id: string) => api.get(`/api/v1/leads/${id}`),
  getHot: () => api.get('/api/v1/leads/hot'),
  getDashboard: (brokerId?: string) => api.get('/api/v1/leads/dashboard', { params: { brokerId } }),
}

// Visa API
export const visaApi = {
  checkEligibility: (data: any) => api.post('/api/v1/visa/eligibility', data),
  getPrograms: () => api.get('/api/v1/visa/programs'),
  getRequirements: (programType: string) => api.get('/api/v1/visa/requirements', { params: { programType } }),
}

// Referral API
export const referralApi = {
  validate: (code: string) => api.post('/api/v1/referrals/validate', { code }),
  getMyReferrals: (userId: string) => api.get('/api/v1/referrals/my', { params: { userId } }),
  getEarnings: (userId: string) => api.get('/api/v1/referrals/earnings', { params: { userId } }),
  getLeaderboard: () => api.get('/api/v1/referrals/leaderboard'),
}

// Broker API
export const brokerApi = {
  register: (data: any) => api.post('/api/v1/brokers', data),
  search: (params: any) => api.get('/api/v1/brokers/search', { params }),
  getById: (id: string) => api.get(`/api/v1/brokers/${id}`),
  getDashboard: () => api.get('/api/v1/brokers/dashboard'),
}

// CRM API
export const crmApi = {
  createFollowUp: (data: any) => api.post('/api/v1/crm/follow-ups', data),
  getFollowUps: (params: any) => api.get('/api/v1/crm/follow-ups', { params }),
  getDueFollowUps: (brokerId: string) => api.get('/api/v1/crm/follow-ups/due', { params: { brokerId } }),
  createSiteVisit: (data: any) => api.post('/api/v1/crm/site-visits', data),
  getSiteVisits: (params: any) => api.get('/api/v1/crm/site-visits', { params }),
  getDashboard: (brokerId: string) => api.get('/api/v1/crm/dashboard', { params: { brokerId } }),
}

// Media API
export const mediaApi = {
  createCampaign: (data: any) => api.post('/api/v1/media/campaigns', data),
  getCampaigns: (params: any) => api.get('/api/v1/media/campaigns', { params }),
  getInfluencers: (params: any) => api.get('/api/v1/media/influencers', { params }),
  getROIAnalytics: (brokerId: string) => api.get('/api/v1/media/analytics/roi', { params: { brokerId } }),
}

export default api
