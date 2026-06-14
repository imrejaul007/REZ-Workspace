import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (_req, res) => {
  const services = [
    { name: 'Property', url: process.env.RISNA_PROPERTY_URL },
    { name: 'Lead', url: process.env.RISNA_LEAD_URL },
    { name: 'Visa', url: process.env.RISNA_VISA_URL },
    { name: 'Referral', url: process.env.RISNA_REFERRAL_URL },
    { name: 'Broker', url: process.env.RISNA_BROKER_URL },
    { name: 'CRM', url: process.env.RISNA_CRM_URL },
    { name: 'Media', url: process.env.RISNA_MEDIA_URL },
  ];

  const results = await Promise.allSettled(
    services.map(async (s) => {
      try {
        const res = await axios.get((s.url || '') + '/health', { timeout: 2000 });
        return { name: s.name, status: res.data.status || 'ok' };
      } catch {
        return { name: s.name, status: 'unreachable' };
      }
    })
  );

  const allHealthy = results.every(r => r.status === 'fulfilled' && r.value.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    gateway: 'ok',
    services: results.map((r, i) => ({
      name: services[i].name,
      status: r.status === 'fulfilled' ? r.value.status : 'error'
    }))
  });
});

export default router;
