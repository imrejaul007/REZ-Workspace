import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Screen, Campaign, CampaignAnalytics } from '../types';
import { logger } from '../utils/logger';

interface ICampaign extends Document {
  name: string; advertiserId: string; screens: string[]; startDate: string; endDate: string;
  totalBudget: number; spent: number; impressions: number; status: string; targeting: any;
}

const CampaignSchema = new Schema({
  name: { type: String, required: true }, advertiserId: { type: String, required: true, index: true },
  screens: [String], startDate: { type: String, required: true }, endDate: { type: String, required: true },
  totalBudget: { type: Number, required: true }, spent: { type: Number, default: 0 }, impressions: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  targeting: { airports: [String], terminals: [String], timeSlots: [String] }
}, { timestamps: true });

export const CampaignModel = model<ICampaign>('Campaign', CampaignSchema);

const sampleScreens: Screen[] = [
  { id: 'SCR001', airport: 'DEL', terminal: 'T3', location: 'Security Area', type: 'led', size: { width: 1920, height: 1080 }, orientation: 'landscape', resolution: '1920x1080', available: true, pricePerDay: { amount: 50000, currency: 'INR' } },
  { id: 'SCR002', airport: 'DEL', terminal: 'T3', location: 'Gate Area', type: 'lcd', size: { width: 1080, height: 1920 }, orientation: 'portrait', resolution: '1080x1920', available: true, pricePerDay: { amount: 35000, currency: 'INR' } },
  { id: 'SCR003', airport: 'BOM', terminal: 'T2', location: 'Check-in Hall', type: 'led', size: { width: 3840, height: 2160 }, orientation: 'landscape', resolution: '4K', available: true, pricePerDay: { amount: 60000, currency: 'INR' } },
  { id: 'SCR004', airport: 'BLR', terminal: 'T1', location: 'Baggage Claim', type: 'lcd', size: { width: 1920, height: 1080 }, orientation: 'landscape', resolution: '1920x1080', available: true, pricePerDay: { amount: 40000, currency: 'INR' } }
];

export class DOOHService {
  async getScreens(airport?: string, terminal?: string): Promise<Screen[]> {
    let results = [...sampleScreens];
    if (airport) results = results.filter(s => s.airport === airport.toUpperCase());
    if (terminal) results = results.filter(s => s.terminal === terminal);
    return results;
  }

  async getScreenById(screenId: string): Promise<Screen | null> {
    return sampleScreens.find(s => s.id === screenId) || null;
  }

  async createCampaign(advertiserId: string, name: string, screens: string[], startDate: string, endDate: string, totalBudget: number, targeting?: { airports?: string[]; terminals?: string[]; timeSlots?: string[] }): Promise<Campaign> {
    const campaign = new CampaignModel({ name, advertiserId, screens, startDate, endDate, totalBudget, spent: 0, impressions: 0, status: 'draft', targeting: targeting || {} });
    await campaign.save();
    return { id: campaign._id.toString(), name: campaign.name, advertiserId: campaign.advertiserId, screens: campaign.screens, startDate: campaign.startDate, endDate: campaign.endDate, totalBudget: campaign.totalBudget, spent: campaign.spent, impressions: campaign.impressions, status: campaign.status as any, targeting: campaign.targeting as any, createdAt: campaign.createdAt };
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const c = await CampaignModel.findById(campaignId);
    return c ? { id: c._id.toString(), name: c.name, advertiserId: c.advertiserId, screens: c.screens, startDate: c.startDate, endDate: c.endDate, totalBudget: c.totalBudget, spent: c.spent, impressions: c.impressions, status: c.status as any, targeting: c.targeting as any, createdAt: c.createdAt } : null;
  }

  async getAdvertiserCampaigns(advertiserId: string): Promise<Campaign[]> {
    const campaigns = await CampaignModel.find({ advertiserId }).sort({ createdAt: -1 });
    return campaigns.map(c => ({ id: c._id.toString(), name: c.name, advertiserId: c.advertiserId, screens: c.screens, startDate: c.startDate, endDate: c.endDate, totalBudget: c.totalBudget, spent: c.spent, impressions: c.impressions, status: c.status as any, targeting: c.targeting as any, createdAt: c.createdAt }));
  }

  async updateCampaignStatus(campaignId: string, status: 'draft' | 'active' | 'paused' | 'completed'): Promise<Campaign | null> {
    const c = await CampaignModel.findByIdAndUpdate(campaignId, { status }, { new: true });
    return c ? { id: c._id.toString(), name: c.name, advertiserId: c.advertiserId, screens: c.screens, startDate: c.startDate, endDate: c.endDate, totalBudget: c.totalBudget, spent: c.spent, impressions: c.impressions, status: c.status as any, targeting: c.targeting as any, createdAt: c.createdAt } : null;
  }

  async getAnalytics(campaignId: string, startDate?: string, endDate?: string): Promise<CampaignAnalytics[]> {
    const c = await CampaignModel.findById(campaignId);
    if (!c) return [];

    const days = Math.ceil((new Date(endDate || Date.now()).getTime() - new Date(startDate || c.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const analytics: CampaignAnalytics[] = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate || c.startDate);
      date.setDate(date.getDate() + i);
      analytics.push({ campaignId: c._id.toString(), date: date.toISOString().split('T')[0], impressions: Math.floor(Math.random() * 10000) + 5000, reach: Math.floor(Math.random() * 5000) + 2000, ctr: Math.random() * 0.05, views: Math.floor(Math.random() * 15000) + 8000 });
    }
    return analytics;
  }
}

export const doohService = new DOOHService();
export default doohService;