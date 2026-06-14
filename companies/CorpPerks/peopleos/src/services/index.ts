/**
 * CorpPerks Ecosystem Services
 * Connects PeopleOS to all CorpPerks apps
 */

export * from './merchant';
export * from './attendance';
export * from './rez-ai';

// CorpPerks App URLs
export const CORPPERKS_APPS = {
  landing: 'https://corpperks.vercel.app',
  peopleos: 'https://peopleos.vercel.app',
  talentai: 'https://talentai.vercel.app',
  insightCampus: 'https://insight-campus.vercel.app',
  nextaBizz: 'https://nextabizz.vercel.app',
  restopapa: 'https://restopapa.vercel.app',
};

// REZ Services URLs
export const REZ_SERVICES = {
  auth: 'https://rez-auth-service.onrender.com',
  profile: 'https://rez-profile-service.onrender.com',
  wallet: 'https://rez-wallet-service.onrender.com',
  ride: 'https://rez-ride.onrender.com',
  intent: 'https://rez-intent-predictor.onrender.com',
  predictive: 'https://rez-predictive-engine.onrender.com',
};
