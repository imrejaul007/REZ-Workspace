import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR } from '../shared/models';
import { getTemplates } from '../shared/schemas/templates';

const router = Router();

/**
 * GET /api/print/:shortcode
 * Generate printable QR design
 */
router.get(
 '/:shortcode',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   const templates = getTemplates(qr.mode);

   // Generate print-ready HTML
   const html = generatePrintHTML(qr.shortcode, qr.mode, qr.profile as unknown);

   res.setHeader('Content-Type', 'text/html');
   res.send(html);
 })
);

/**
 * GET /api/print/:shortcode/pdf
 * Generate PDF-ready HTML (for PDF conversion)
 */
router.get(
 '/:shortcode/pdf',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   const html = generatePrintHTML(qr.shortcode, qr.mode, qr.profile as unknown, true);

   res.setHeader('Content-Type', 'text/html');
   res.send(html);
 })
);

function generatePrintHTML(shortcode: string, mode: string, profile, forPdf = false): string {
 const modeName = getModeName(mode);
 const modeColor = getModeColor(mode);
 const itemName = profile?.name || profile?.displayName || profile?.brand || modeName;
 const qrUrl = `https://rez.app/s/${shortcode}`;
 const qrPayload = JSON.stringify({
   v: 1,
   type: 'safe',
   mode,
   id: shortcode,
   shortcode,
 });

 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <title>ReZ Safe QR - ${itemName}</title>
 <style>
   * { margin: 0; padding: 0; box-sizing: border-box; }
   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     background: #f3f4f6;
     min-height: 100vh;
     padding: 20px;
   }
   .container {
     max-width: 600px;
     margin: 0 auto;
     background: white;
     border-radius: 24px;
     overflow: hidden;
     box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   }
   .header {
     background: ${modeColor};
     color: white;
     padding: 24px;
     text-align: center;
   }
   .header h1 {
     font-size: 24px;
     font-weight: 700;
     margin-bottom: 4px;
   }
   .header p {
     opacity: 0.9;
     font-size: 14px;
   }
   .qr-section {
     padding: 32px;
     display: flex;
     flex-direction: column;
     align-items: center;
   }
   .qr-frame {
     border: 8px solid ${modeColor};
     border-radius: 16px;
     padding: 16px;
     background: white;
   }
   .qr-code {
     width: 200px;
     height: 200px;
   }
   .shortcode {
     margin-top: 16px;
     font-size: 32px;
     font-weight: 800;
     letter-spacing: 4px;
     color: #1f2937;
   }
   .item-name {
     margin-top: 8px;
     font-size: 18px;
     color: #6b7280;
   }
   .info-section {
     padding: 24px;
     background: #f9fafb;
   }
   .info-row {
     display: flex;
     justify-content: space-between;
     padding: 12px 0;
     border-bottom: 1px solid #e5e7eb;
   }
   .info-row:last-child {
     border-bottom: none;
   }
   .info-label {
     color: #6b7280;
     font-size: 14px;
   }
   .info-value {
     font-weight: 600;
     color: #1f2937;
     font-size: 14px;
   }
   .instructions {
     padding: 24px;
     text-align: center;
   }
   .instructions h3 {
     font-size: 18px;
     font-weight: 600;
     color: #1f2937;
     margin-bottom: 16px;
   }
   .steps {
     display: flex;
     justify-content: center;
     gap: 24px;
   }
   .step {
     text-align: center;
   }
   .step-num {
     width: 32px;
     height: 32px;
     background: ${modeColor};
     color: white;
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
     font-weight: 700;
     margin: 0 auto 8px;
   }
   .step-text {
     font-size: 12px;
     color: #6b7280;
   }
   .emergency-note {
     margin-top: 24px;
     padding: 16px;
     background: #fef2f2;
     border: 1px solid #fecaca;
     border-radius: 12px;
     text-align: center;
   }
   .emergency-note strong {
     color: #dc2626;
   }
   .print-btn {
     display: block;
     width: calc(100% - 48px);
     margin: 24px;
     padding: 16px;
     background: ${modeColor};
     color: white;
     text-align: center;
     border: none;
     border-radius: 12px;
     font-size: 16px;
     font-weight: 600;
     cursor: pointer;
     ${forPdf ? 'display: none;' : ''}
   }
   .footer {
     padding: 16px;
     text-align: center;
     color: #9ca3af;
     font-size: 12px;
   }
   @media print {
     body { background: white; padding: 0; }
     .container { box-shadow: none; border-radius: 0; }
     .print-btn { display: none; }
   }
 </style>
</head>
<body>
 <div class="container">
   <div class="header">
     <h1>${itemName}</h1>
     <p>${modeName} Safe QR</p>
   </div>

   <div class="qr-section">
     <div class="qr-frame">
       <div class="qr-code" id="qrcode"></div>
     </div>
     <div class="shortcode">${shortcode}</div>
     <div class="item-name">${itemName}</div>
   </div>

   <div class="info-section">
     <div class="info-row">
       <span class="info-label">Shortcode</span>
       <span class="info-value">${shortcode}</span>
     </div>
     <div class="info-row">
       <span class="info-label">Type</span>
       <span class="info-value">${modeName}</span>
     </div>
     ${profile?.breed ? `
     <div class="info-row">
       <span class="info-label">Breed</span>
       <span class="info-value">${profile.breed}</span>
     </div>
     ` : ''}
     ${profile?.bloodType ? `
     <div class="info-row">
       <span class="info-label">Blood Type</span>
       <span class="info-value">${profile.bloodType}</span>
     </div>
     ` : ''}
   </div>

   <div class="instructions">
     <h3>How It Works</h3>
     <div class="steps">
       <div class="step">
         <div class="step-num">1</div>
         <div class="step-text">Print this QR</div>
       </div>
       <div class="step">
         <div class="step-num">2</div>
         <div class="step-text">Attach to item</div>
       </div>
       <div class="step">
         <div class="step-num">3</div>
         <div class="step-text">Get notified</div>
       </div>
     </div>
   </div>

   ${mode === 'medical' || mode === 'helmet' ? `
   <div class="emergency-note">
     <strong>Emergency:</strong> This QR provides medical information.
     Scan to view emergency details and contact helpers.
   </div>
   ` : ''}

   <button class="print-btn" onclick="window.print()">Print QR Code</button>

   <div class="footer">
     Powered by ReZ Safe QR • ${qrUrl}
   </div>
 </div>

 <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
 <script>
   const payload = ${JSON.stringify(qrPayload)};
   QRCode.toDataURL(payload, {
     width: 200,
     margin: 0,
     color: { dark: '#000000', light: '#ffffff' }
   }).then(url => {
     document.getElementById('qrcode').innerHTML = '<img src="' + url + '" width="200" height="200">';
   });
 </script>
</body>
</html>
 `;
}

function getModeName(mode: string): string {
 const names: Record<string, string> = {
   pet: 'Pet',
   personal: 'Personal',
   device: 'Device',
   medical: 'Medical',
   helmet: 'Helmet',
   child: 'Child',
   vehicle: 'Vehicle',
   bicycle: 'Bicycle',
   key: 'Key',
   luggage: 'Luggage',
   home: 'Home',
   office: 'Office',
   event: 'Event',
   student: 'Student',
   package: 'Package',
 };
 return names[mode] || 'Safe QR';
}

function getModeColor(mode: string): string {
 const colors: Record<string, string> = {
   pet: 'linear-gradient(135deg, #f59e0b, #d97706)',
   personal: 'linear-gradient(135deg, #6366f1, #4f46e5)',
   device: 'linear-gradient(135deg, #10b981, #059669)',
   medical: 'linear-gradient(135deg, #ef4444, #dc2626)',
   helmet: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
   child: 'linear-gradient(135deg, #ec4899, #db2777)',
   vehicle: 'linear-gradient(135deg, #3b82f6, #2563eb)',
   bicycle: 'linear-gradient(135deg, #f97316, #ea580c)',
   key: 'linear-gradient(135deg, #84cc16, #65a30d)',
   luggage: 'linear-gradient(135deg, #06b6d4, #0891b2)',
   home: 'linear-gradient(135deg, #14b8a6, #0d9488)',
   office: 'linear-gradient(135deg, #64748b, #475569)',
   event: 'linear-gradient(135deg, #d946ef, #c026d3)',
   student: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
   package: 'linear-gradient(135deg, #a855f7, #9333ea)',
 };
 return colors[mode] || 'linear-gradient(135deg, #6366f1, #4f46e5)';
}

export default router;
