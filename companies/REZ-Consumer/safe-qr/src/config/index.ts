// API Configuration
export const config = {
 apiUrl: process.env.API_URL || 'http://localhost:4000/api',

 // Service endpoints
 endpoints: {
   health: '/health',
   scan: '/scan',
   qr: '/qr',
   karma: '/karma',
   sessions: '/sessions',
   modes: '/modes',
   profile: '/profile',
 },

 // QR mode configurations
 modes: [
   { mode: 'pet', name: 'Pet Safe QR', icon: '', color: '#f59e0b' },
   { mode: 'personal', name: 'Personal Safe QR', icon: '', color: '#6366f1' },
   { mode: 'device', name: 'Device Safe QR', icon: '', color: '#10b981' },
   { mode: 'medical', name: 'Medical Safe QR', icon: '', color: '#ef4444' },
   { mode: 'helmet', name: 'Helmet Safe QR', icon: '', color: '#8b5cf6' },
   { mode: 'child', name: 'Child Safe QR', icon: '', color: '#ec4899' },
   { mode: 'vehicle', name: 'Vehicle Safe QR', icon: '', color: '#3b82f6' },
   { mode: 'bicycle', name: 'Bicycle Safe QR', icon: '', color: '#f97316' },
   { mode: 'key', name: 'Key Safe QR', icon: '', color: '#84cc16' },
   { mode: 'luggage', name: 'Luggage Safe QR', icon: '', color: '#06b6d4' },
   { mode: 'home', name: 'Home Safe QR', icon: '', color: '#14b8a6' },
   { mode: 'office', name: 'Office Safe QR', icon: '', color: '#64748b' },
   { mode: 'event', name: 'Event Safe QR', icon: '', color: '#d946ef' },
   { mode: 'student', name: 'Student Safe QR', icon: '', color: '#0ea5e9' },
   { mode: 'package', name: 'Package Safe QR', icon: '', color: '#a855f7' },
 ],
};

export type Mode = {
 mode: string;
 name: string;
 icon: string;
 color: string;
};
