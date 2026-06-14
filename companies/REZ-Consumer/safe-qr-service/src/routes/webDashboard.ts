import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR, RelaySession, RelayMessage, KarmaState } from '../shared/models';
import { getTemplates } from '../shared/schemas/templates';

const router = Router();

/**
 * GET /dashboard
 * Web dashboard page (requires auth via token in URL)
 */
router.get('/', async (req: Request, res: Response) => {
 const token = req.query.token as string;

 if (!token) {
   return res.redirect('/login');
 }

 // Verify token and render dashboard
 res.setHeader('Content-Type', 'text/html');
 res.send(generateDashboardHTML());
});

/**
 * GET /dashboard/my-qrs
 * List user's QRs (API)
 */
router.get('/api/my-qrs', authenticate, asyncHandler(async (req: Request, res: Response) => {
 const qrs = await SafeQR.find({ ownerId: req.userId! })
   .select('shortcode qrId mode status stats profile createdAt lostModeActivatedAt')
   .sort({ createdAt: -1 });

 res.json({ success: true, data: qrs });
}));

/**
 * GET /dashboard/sessions
 * List user's sessions (API)
 */
router.get('/api/sessions', authenticate, asyncHandler(async (req: Request, res: Response) => {
 const sessions = await RelaySession.find({ ownerId: req.userId! })
   .sort({ updatedAt: -1 })
   .limit(20);

 res.json({ success: true, data: sessions });
}));

/**
 * GET /dashboard/sessions/:id/messages
 * Get session messages (API)
 */
router.get('/api/sessions/:sessionId/messages', authenticate, asyncHandler(async (req: Request, res: Response) => {
 const { sessionId } = req.params;

 const session = await RelaySession.findOne({ sessionId, ownerId: req.userId! });
 if (!session) {
   throw createError('Session not found', 404, 'NOT_FOUND');
 }

 const messages = await RelayMessage.find({ sessionId })
   .sort({ createdAt: 1 });

 res.json({ success: true, data: messages });
}));

/**
 * POST /dashboard/sessions/:id/messages
 * Send message (API)
 */
router.post('/api/sessions/:sessionId/messages', authenticate, asyncHandler(async (req: Request, res: Response) => {
 const { sessionId } = req.params;
 const { content } = req.body;

 if (!content) {
   throw createError('Content required', 400, 'VALIDATION_ERROR');
 }

 const session = await RelaySession.findOne({ sessionId, ownerId: req.userId! });
 if (!session) {
   throw createError('Session not found', 404, 'NOT_FOUND');
 }

 const message = new RelayMessage({
   messageId: `msg_${Date.now()}`,
   sessionId,
   senderId: req.userId!,
   senderRole: 'owner',
   content,
   type: 'text',
   read: true,
 });
 await message.save();

 res.json({ success: true, data: message });
}));

/**
 * GET /dashboard/karma
 * Get karma state (API)
 */
router.get('/api/karma', authenticate, asyncHandler(async (req: Request, res: Response) => {
 const karma = await KarmaState.findOne({ userId: req.userId! });

 res.json({
   success: true,
   data: karma || {
     totalPoints: 0,
     helpCount: 0,
     level: 'Newbie',
     badge: '',
   },
 });
}));

function generateDashboardHTML(): string {
 return `
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>ReZ Safe QR - Dashboard</title>
 <script src="https://cdn.tailwindcss.com"></script>
 <style>
   body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
 </style>
</head>
<body class="bg-gray-100 min-h-screen">
 <!-- Header -->
 <header class="bg-indigo-600 text-white py-4 px-6 shadow-lg">
   <div class="max-w-6xl mx-auto flex items-center justify-between">
     <div class="flex items-center gap-3">
       <span class="text-2xl">🏷️</span>
       <h1 class="text-xl font-bold">ReZ Safe QR Dashboard</h1>
     </div>
     <div class="flex items-center gap-4">
       <span id="userPoints" class="text-sm bg-indigo-700 px-3 py-1 rounded-full">Loading...</span>
       <button onclick="logout()" class="text-sm hover:underline">Logout</button>
     </div>
   </div>
 </header>

 <main class="max-w-6xl mx-auto py-6 px-4">
   <!-- Stats -->
   <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
     <div class="bg-white rounded-xl p-6 shadow">
       <p class="text-gray-500 text-sm">Total QRs</p>
       <p id="statQrs" class="text-3xl font-bold text-indigo-600">-</p>
     </div>
     <div class="bg-white rounded-xl p-6 shadow">
       <p class="text-gray-500 text-sm">Total Scans</p>
       <p id="statScans" class="text-3xl font-bold text-green-600">-</p>
     </div>
     <div class="bg-white rounded-xl p-6 shadow">
       <p class="text-gray-500 text-sm">Unread Messages</p>
       <p id="statMessages" class="text-3xl font-bold text-orange-600">-</p>
     </div>
     <div class="bg-white rounded-xl p-6 shadow">
       <p class="text-gray-500 text-sm">Karma Points</p>
       <p id="statKarma" class="text-3xl font-bold text-purple-600">-</p>
     </div>
   </div>

   <!-- Tabs -->
   <div class="flex gap-2 mb-6">
     <button onclick="showTab('qrs')" id="tabQrs" class="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white">My QRs</button>
     <button onclick="showTab('messages')" id="tabMessages" class="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700">Messages</button>
     <button onclick="showTab('karma')" id="tabKarma" class="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700">Karma</button>
   </div>

   <!-- My QRs Tab -->
   <div id="panelQrs" class="bg-white rounded-xl shadow overflow-hidden">
     <div class="p-4 border-b flex justify-between items-center">
       <h2 class="font-semibold text-lg">My Safe QRs</h2>
       <button onclick="location.href='/create'" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">+ Create QR</button>
     </div>
     <div id="qrsList" class="divide-y">
       <div class="p-8 text-center text-gray-500">Loading...</div>
     </div>
   </div>

   <!-- Messages Tab -->
   <div id="panelMessages" class="hidden bg-white rounded-xl shadow overflow-hidden">
     <div class="p-4 border-b">
       <h2 class="font-semibold text-lg">Conversations</h2>
     </div>
     <div id="sessionsList" class="divide-y max-h-96 overflow-y-auto">
       <div class="p-8 text-center text-gray-500">Loading...</div>
     </div>
   </div>

   <!-- Karma Tab -->
   <div id="panelKarma" class="hidden bg-white rounded-xl shadow p-6">
     <div class="text-center mb-8">
       <span id="karmaBadge" class="text-6xl">🟢</span>
       <p id="karmaLevel" class="text-2xl font-bold mt-2">Newbie</p>
       <p id="karmaPoints" class="text-gray-500">0 points</p>
     </div>
     <div class="border-t pt-6">
       <h3 class="font-semibold mb-4">Levels</h3>
       <div class="space-y-3">
         ${['Newbie', 'Active', 'Contributor', 'Helper', 'Guardian', 'Hero', 'Legend'].map(level =>
           `<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
             <span>${level}</span>
             <span class="text-gray-500">${level === 'Newbie' ? '0' : level === 'Active' ? '10' : level === 'Contributor' ? '50' : level === 'Helper' ? '200' : level === 'Guardian' ? '500' : level === 'Hero' ? '1000' : '5000'}+</span>
           </div>`
         ).join('')}
       </div>
     </div>
   </div>
 </main>

 <script>
   const API = '/api';
   let currentTab = 'qrs';

   // Load data on page load
   document.addEventListener('DOMContentLoaded', loadData);

   async function loadData() {
     await Promise.all([loadQRs(), loadSessions(), loadKarma()]);
   }

   async function loadQRs() {
     try {
       const res = await fetch(\`\${API}/dashboard/api/my-qrs\`);
       const data = await res.json();
       if (data.success) {
         document.getElementById('statQrs').textContent = data.data.length;
         document.getElementById('statScans').textContent = data.data.reduce((s, q) => s + (q.stats?.totalScans || 0), 0);
         renderQRs(data.data);
       }
     } catch (e) {
       logger.error(e);
     }
   }

   async function loadSessions() {
     try {
       const res = await fetch(\`\${API}/dashboard/api/sessions\`);
       const data = await res.json();
       if (data.success) {
         renderSessions(data.data);
       }
     } catch (e) {
       logger.error(e);
     }
   }

   async function loadKarma() {
     try {
       const res = await fetch(\`\${API}/dashboard/api/karma\`);
       const data = await res.json();
       if (data.success) {
         document.getElementById('statKarma').textContent = data.data.totalPoints;
         document.getElementById('userPoints').textContent = data.data.totalPoints + ' pts';
         document.getElementById('karmaLevel').textContent = data.data.level;
         document.getElementById('karmaBadge').textContent = data.data.badge || '';
       }
     } catch (e) {
       logger.error(e);
     }
   }

   function renderQRs(qrs) {
     const container = document.getElementById('qrsList');
     if (qrs.length === 0) {
       container.innerHTML = '<div class="p-8 text-center text-gray-500">No QRs yet. <a href="/create" class="text-indigo-600">Create one</a></div>';
       return;
     }
     container.innerHTML = qrs.map(qr => \`
       <div class="p-4 hover:bg-gray-50 flex items-center gap-4">
         <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style="background: \${getModeColor(qr.mode)}20">
           \${getModeIcon(qr.mode)}
         </div>
         <div class="flex-1">
           <p class="font-medium">\${qr.shortcode}</p>
           <p class="text-sm text-gray-500">\${qr.mode} • \${qr.stats?.totalScans || 0} scans</p>
         </div>
         <div class="text-right">
           <span class="inline-block px-2 py-1 rounded text-xs font-medium \${qr.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
             \${qr.status.toUpperCase()}
           </span>
           <p class="text-xs text-gray-500 mt-1">
             <a href="/qr/\${qr.shortcode}" class="text-indigo-600">View</a> •
             <a href="/print/\${qr.shortcode}" class="text-indigo-600">Print</a>
           </p>
         </div>
       </div>
     \`).join('');
   }

   function renderSessions(sessions) {
     const container = document.getElementById('sessionsList');
     if (sessions.length === 0) {
       container.innerHTML = '<div class="p-8 text-center text-gray-500">No conversations yet</div>';
       return;
     }
     container.innerHTML = sessions.map(s => \`
       <div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="viewSession('\${s.sessionId}')">
         <div class="flex justify-between">
           <span class="font-medium">\${s.shortcode}</span>
           <span class="text-xs text-gray-500">\${getModeIcon(s.mode)} \${s.mode}</span>
         </div>
         <p class="text-sm text-gray-500 mt-1">\${s.messageCount || 0} messages</p>
       </div>
     \`).join('');
   }

   function viewSession(sessionId) {
     window.location.href = '/dashboard/session/' + sessionId;
   }

   function showTab(tab) {
     document.querySelectorAll('[id^="panel"]').forEach(p => p.classList.add('hidden'));
     document.querySelectorAll('[id^="tab"]').forEach(t => {
       t.classList.remove('bg-indigo-600', 'text-white');
       t.classList.add('bg-gray-200', 'text-gray-700');
     });
     document.getElementById('panel' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
     document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('bg-gray-200', 'text-gray-700');
     document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('bg-indigo-600', 'text-white');
     currentTab = tab;
   }

   function getModeIcon(mode) {
     const icons = { pet: '🐕', device: '💻', medical: '🏥', vehicle: '🚗', personal: '👤', helmet: '⛑️', child: '👶' };
     return icons[mode] || '🏷️';
   }

   function getModeColor(mode) {
     const colors = { pet: '#f59e0b', device: '#10b981', medical: '#ef4444', vehicle: '#3b82f6', personal: '#6366f1', helmet: '#8b5cf6' };
     return colors[mode] || '#6366f1';
   }

   function logout() {
     localStorage.removeItem('authToken');
     window.location.href = '/login';
   }
 </script>
</body>
</html>
 `;
}

export default router;
