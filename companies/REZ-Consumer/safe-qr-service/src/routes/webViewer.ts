import { Router, Request, Response } from 'express';
import { SafeQR, RelayMessage, RelaySession } from '../shared/models';
import { getTemplates } from '../shared/schemas/templates';
import { sanitizeQRContent } from '../middleware/qrSanitizer';

const router = Router();

/**
 * GET /qr/:shortcode
 * Public web page to view and interact with a Safe QR
 */
router.get('/:shortcode', async (req: Request, res: Response) => {
 try {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     return res.status(404).send(generateNotFoundPage(shortcode));
   }

   const templates = getTemplates(qr.mode);
   const qrPayload = JSON.stringify(qr.qrPayload);

   res.setHeader('Content-Type', 'text/html');
   res.send(generateViewerPage(qr, templates, qrPayload, req.ip));
 } catch (error) {
   logger.error('Viewer error:', error);
   res.status(500).send('Server error');
 }
});

/**
 * POST /qr/:shortcode/message
 * Public API to send message
 * SECURITY: Message content is sanitized to prevent XSS and injection attacks
 */
router.post('/:shortcode/message', async (req: Request, res: Response) => {
 try {
   const { shortcode } = req.params;
   const { content, type = 'text', templateId } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   if (!content) {
     return res.status(400).json({ success: false, error: 'Content required' });
   }

   // SECURITY: Sanitize message content
   const sanitizedResult = sanitizeQRContent(content);
   if (!sanitizedResult.isValid) {
     console.warn('[WebViewer] Blocked potentially malicious message content:', sanitizedResult.warnings);
     return res.status(400).json({
       success: false,
       error: 'Invalid message content: ' + sanitizedResult.warnings.join('; ')
     });
   }

   const sanitizedContent = sanitizedResult.content;

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     return res.status(404).json({ success: false, error: 'QR not found' });
   }

   if (!qr.settings.allowMessages) {
     return res.status(403).json({ success: false, error: 'Messages not allowed' });
   }

   // Create session
   let session = await RelaySession.findOne({
     shortcode: normalizedShortcode,
     status: 'active',
   });

   if (!session) {
     session = new RelaySession({
       sessionId: `session_${Date.now()}`,
       shortcode: normalizedShortcode,
       qrId: qr.qrId,
       mode: qr.mode,
       ownerId: qr.ownerId,
       status: 'active',
       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
     });
     await session.save();
   }

   // Create message (use sanitized content)
   const message = new RelayMessage({
     messageId: `msg_${Date.now()}`,
     sessionId: session.sessionId,
     senderId: req.ip || 'anonymous',
     senderRole: 'finder',
     content: sanitizedContent,
     type,
     templateId,
     read: false,
   });
   await message.save();

   // Update stats
   qr.stats.totalMessages += 1;
   qr.stats.lastMessageAt = new Date();
   await qr.save();

   res.json({ success: true, messageId: message.messageId });
 } catch (error) {
   console.error('Message error:', error);
   res.status(500).json({ success: false, error: 'Server error' });
 }
});

// Import templates from existing function
import { getTemplates } from '../shared/schemas/templates';

function generateViewerPage(qr, templates: unknown[], qrPayload: string, ip: string): string {
 const modeColors: Record<string, string> = {
   pet: '#f59e0b', device: '#10b981', medical: '#ef4444',
   vehicle: '#3b82f6', personal: '#6366f1', helmet: '#8b5cf6',
   child: '#ec4899', bicycle: '#f97316', key: '#84cc16',
   luggage: '#06b6d4', home: '#14b8a6', office: '#64748b',
 };
 const modeColor = modeColors[qr.mode] || '#6366f1';
 const modeName = qr.mode.charAt(0).toUpperCase() + qr.mode.slice(1);
 const profile = qr.profile || {};

 // SECURITY: Escape HTML in all user-provided data to prevent XSS
 function escapeHtml(str): string {
   if (typeof str !== 'string') return '';
   return str
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;');
 }

 const itemName = escapeHtml(profile.name || profile.displayName || profile.brand || modeName);
 const description = escapeHtml(profile.description || '');
 const breed = escapeHtml(profile.breed || profile.species || profile.model || profile.vehicleType || '');
 const bloodType = escapeHtml(profile.bloodType || '');
 const allergies = Array.isArray(profile.allergies) ? profile.allergies.map((a) => escapeHtml(a.allergen)).join(', ') : '';
 const conditions = Array.isArray(profile.medicalConditions) ? profile.medicalConditions.map((c) => escapeHtml(c)).join(', ') : '';

 return `
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>${itemName} - ReZ Safe QR</title>
 <script src="https://cdn.tailwindcss.com"></script>
 <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
 <style>
   body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
   .gradient-bg { background: linear-gradient(135deg, ${modeColor}15, ${modeColor}05); }
 </style>
</head>
<body class="min-h-screen gradient-bg">
 <div class="max-w-lg mx-auto py-8 px-4">
   <!-- Header -->
   <div class="text-center mb-6">
     <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4" style="background: ${modeColor}20; color: ${modeColor}">
       <span>${modeName}</span>
       ${qr.status === 'lost' ? '<span class="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-2">LOST</span>' : ''}
     </div>
     <h1 class="text-3xl font-bold text-gray-900">${itemName}</h1>
     ${breed ? `<p class="text-gray-600 mt-1">${breed}</p>` : ''}
   </div>

   <!-- QR Code -->
   <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
     <div class="inline-block p-4 border-4 rounded-xl" style="border-color: ${modeColor}">
       <div id="qrcode" class="w-48 h-48 mx-auto"></div>
     </div>
     <p class="text-3xl font-bold tracking-widest text-gray-900 mt-4">${qr.shortcode}</p>
     <p class="text-sm text-gray-500 mt-1">Scan with ReZ Safe QR app</p>
   </div>

   ${qr.status === 'lost' ? `
   <!-- Lost Alert -->
   <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
     <p class="text-red-700 font-semibold">⚠️ This item is reported lost</p>
     <p class="text-red-600 text-sm mt-1">Please help find it and contact the owner</p>
   </div>
   ` : ''}

   <!-- Description -->
   ${description ? `
   <div class="bg-white rounded-xl p-4 mb-6">
     <p class="text-gray-700">${description}</p>
   </div>
   ` : ''}

   <!-- Quick Actions -->
   ${qr.settings.allowMessages ? `
   <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
     <div class="p-4 border-b">
       <h2 class="font-semibold text-gray-900">Send a Message</h2>
       <p class="text-sm text-gray-500">The owner will see your message anonymously</p>
     </div>

     <!-- Templates -->
     <div class="p-4">
       <p class="text-sm font-medium text-gray-700 mb-3">Quick Messages</p>
       <div class="space-y-2">
         ${templates.slice(0, 4).map((t) => `
           <button
             onclick="sendMessage('${t.message.replace(/'/g, "\\'")}', 'template', '${t.id}')"
             class="w-full text-left p-3 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
           >
             <span class="text-lg mr-2">${t.icon || '💬'}</span>
             <span class="text-gray-700">${t.label}</span>
           </button>
         `).join('')}
       </div>

       <!-- Custom Message -->
       <div class="mt-4">
         <p class="text-sm font-medium text-gray-700 mb-2">Or write your own...</p>
         <textarea
           id="customMessage"
           rows="3"
           class="w-full border rounded-xl p-3 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
           placeholder="Type your message here..."
         ></textarea>
         <button
           onclick="sendCustomMessage()"
           class="w-full mt-3 py-3 rounded-xl font-semibold text-white transition-colors"
           style="background: ${modeColor}"
         >
           Send Message
         </button>
       </div>
     </div>
   </div>
   ` : ''}

   <!-- Success Message (Hidden) -->
   <div id="successMessage" class="hidden bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
     <p class="text-green-700 font-semibold">✓ Message Sent!</p>
     <p class="text-green-600 text-sm mt-1">The owner will be notified</p>
   </div>

   <!-- Medical Info -->
   ${qr.mode === 'medical' ? `
   <div class="bg-white rounded-xl p-4 mb-6">
     <h3 class="font-semibold text-gray-900 mb-2">Emergency Information</h3>
     ${bloodType ? `<p class="text-gray-700">Blood Type: <strong>${bloodType}</strong></p>` : ''}
     ${allergies ? `<p class="text-red-600">⚠️ Allergies: ${allergies}</p>` : ''}
     ${conditions ? `<p class="text-gray-700">Conditions: ${conditions}</p>` : ''}
   </div>
   ` : ''}

   <!-- Footer -->
   <div class="text-center text-gray-500 text-sm">
     <p>Powered by <span class="font-semibold">ReZ Safe QR</span></p>
     <p class="mt-1">${qr.stats?.totalScans || 0} scans • ${qr.stats?.totalMessages || 0} messages</p>
   </div>
 </div>

 <script>
   // Generate QR
   const payload = ${qrPayload};
   QRCode.toDataURL(JSON.stringify(payload), {
     width: 192,
     margin: 0,
     color: { dark: '#000000', light: '#ffffff' }
   }).then(url => {
     document.getElementById('qrcode').innerHTML = '<img src="' + url + '" class="w-48 h-48">';
   });

   // Send template message
   async function sendMessage(message, type, templateId) {
     try {
       const response = await fetch('/qr/${qr.shortcode}/message', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ content: message, type, templateId })
       });
       const result = await response.json();
       if (result.success) {
         document.getElementById('successMessage').classList.remove('hidden');
       }
     } catch (error) {
       alert('Failed to send message');
     }
   }

   // Send custom message
   async function sendCustomMessage() {
     const content = document.getElementById('customMessage').value.trim();
     if (!content) {
       alert('Please enter a message');
       return;
     }
     await sendMessage(content, 'text');
     document.getElementById('customMessage').value = '';
   }
 </script>
</body>
</html>
 `;
}

function generateNotFoundPage(shortcode: string): string {
 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>QR Not Found - ReZ Safe QR</title>
 <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center">
 <div class="text-center">
   <div class="text-6xl mb-4">🔍</div>
   <h1 class="text-2xl font-bold text-gray-900 mb-2">QR Not Found</h1>
   <p class="text-gray-600 mb-4">The QR code "${shortcode}" does not exist or has been removed.</p>
   <a href="https://rez.app" class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
     Get Your Own Safe QR
   </a>
 </div>
</body>
</html>
 `;
}

export default router;
