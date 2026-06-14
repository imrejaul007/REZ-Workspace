/**
 * RisnaEstate - REZ Media Integration
 * Uses REZ Media services for campaigns, DOOH, QR
 */

import { useEffect, useState } from 'react';

const REZ_MEDIA_URL = process.env.NEXT_PUBLIC_REZ_MEDIA_URL || 'https://rez-media.rez.app';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  metrics: { impressions: number; clicks: number; leads: number };
}

interface DOOHScreen {
  id: string;
  name: string;
  type: string;
  location: { city: string; address: string };
  hourlyRate: number;
}

export function useREZMedia() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const createCampaign = async (data: Partial<Campaign>) => {
    const res = await fetch(`${REZ_MEDIA_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  };

  const getCampaigns = async (brokerId?: string) => {
    setLoading(true);
    const url = brokerId ? `${REZ_MEDIA_URL}/api/campaigns?brokerId=${brokerId}` : `${REZ_MEDIA_URL}/api/campaigns`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('risna_token')}` } });
    const data = await res.json();
    setCampaigns(data.data || []);
    setLoading(false);
    return data;
  };

  const pauseCampaign = async (id: string) => {
    await fetch(`${REZ_MEDIA_URL}/api/campaigns/${id}/pause`, { method: 'POST' });
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'paused' } : c));
  };

  return { campaigns, loading, createCampaign, getCampaigns, pauseCampaign };
}

export function useDOOHScreens(city?: string) {
  const [screens, setScreens] = useState<DOOHScreen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = city ? `${REZ_MEDIA_URL}/api/dooh?city=${city}` : `${REZ_MEDIA_URL}/api/dooh`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setScreens(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [city]);

  return { screens, loading };
}

export async function bookDOOH(screenId: string, hours: number, creativeUrl: string) {
  return fetch(`${REZ_MEDIA_URL}/api/dooh/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenId, hours, creativeUrl })
  }).then(r => r.json());
}

export async function createQRCampaign(name: string, propertyId: string, targetUrl: string) {
  return fetch(`${REZ_MEDIA_URL}/api/qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, propertyId, targetUrl })
  }).then(r => r.json());
}

export async function getCampaignAnalytics(campaignId: string) {
  return fetch(`${REZ_MEDIA_URL}/api/campaigns/${campaignId}/analytics`)
    .then(r => r.json());
}
