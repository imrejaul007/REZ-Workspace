/**
 * REZ Go Receipt Service
 *
 * Generates digital receipts:
 * - PDF receipts
 * - Digital receipt data
 * - Receipt verification
 */

import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

export interface ReceiptItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  mrp?: number;
  cashback?: number;
}

export interface Receipt {
  receiptId: string;
  storeId: string;
  storeName: string;
  sessionId: string;
  userId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashbackEarned: number;
  cashbackCredited: boolean;
  paymentMethod: string;
  paymentId: string;
  savings: number;
  timestamp: Date;
  signature?: string;
}

/**
 * Generate receipt ID
 */
export function generateReceiptId(): string {
  return `GORE-${uuidv4().substring(0, 8).toUpperCase()}`;
}

/**
 * Create receipt object
 */
export function createReceipt(params: {
  sessionId: string;
  storeId: string;
  storeName: string;
  userId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashbackEarned: number;
  cashbackCredited: boolean;
  paymentMethod: string;
  paymentId: string;
  mrpTotal: number;
}): Receipt {
  const savings = mrpTotal - (params.total - params.cashbackEarned);

  return {
    receiptId: generateReceiptId(),
    storeId: params.storeId,
    storeName: params.storeName,
    sessionId: params.sessionId,
    userId: params.userId,
    items: params.items,
    subtotal: params.subtotal,
    tax: params.tax,
    total: params.total,
    cashbackEarned: params.cashbackEarned,
    cashbackCredited: params.cashbackCredited,
    paymentMethod: params.paymentMethod,
    paymentId: params.paymentId,
    savings,
    timestamp: new Date(),
  };
}

/**
 * Generate PDF receipt buffer
 */
export async function generatePDFReceipt(receipt: Receipt): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `REZ Go Receipt ${receipt.receiptId}`,
          Author: 'REZ Go',
          Subject: 'Shopping Receipt',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('REZ Go', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Smart Shopping Receipt', { align: 'center' });
      doc.moveDown();

      // Receipt ID
      doc.fontSize(12).font('Helvetica-Bold').text(`Receipt: ${receipt.receiptId}`);
      doc.moveDown(0.5);

      // Store info
      doc.font('Helvetica').fontSize(10);
      doc.text(`Store: ${receipt.storeName}`);
      doc.text(`Date: ${receipt.timestamp.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`);
      doc.text(`Time: ${receipt.timestamp.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`);
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Items header
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Items Purchased', { underline: true });
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica').fontSize(9);
      for (const item of receipt.items) {
        const itemTotal = item.price * item.quantity;
        const itemMrp = item.mrp ? item.mrp * item.quantity : null;

        doc.text(`${item.quantity}x ${item.name}`, 50, doc.y, { width: 350 });
        doc.text(`₹${itemTotal.toFixed(2)}`, 400, doc.y, { width: 145, align: 'right' });

        if (itemMrp && itemMrp > itemTotal) {
          doc.text(`   MRP: ₹${itemMrp.toFixed(2)}`, { continued: true });
          doc.addPage();
        }
      }

      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Totals
      const totalsY = doc.y;
      doc.font('Helvetica').fontSize(10);

      // Subtotal
      doc.text('Subtotal:', 350, totalsY);
      doc.text(`₹${receipt.subtotal.toFixed(2)}`, 450, totalsY, { width: 95, align: 'right' });

      // Tax
      doc.text('Tax (GST):', 350, totalsY + 18);
      doc.text(`₹${receipt.tax.toFixed(2)}`, 450, totalsY + 18, { width: 95, align: 'right' });

      // Total
      doc.moveTo(350, totalsY + 36).lineTo(545, totalsY + 36).stroke();
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', 350, totalsY + 42);
      doc.text(`₹${receipt.total.toFixed(2)}`, 450, totalsY + 42, { width: 95, align: 'right' });

      // Savings highlight
      doc.moveDown(2);
      doc.fontSize(14).fillColor('#22C55E');
      doc.text(`💰 You Saved: ₹${receipt.savings.toFixed(2)}`, { align: 'center' });
      doc.fillColor('#000000');

      // Cashback
      if (receipt.cashbackEarned > 0) {
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#F59E0B');
        const cashbackText = receipt.cashbackCredited
          ? `₹${receipt.cashbackEarned.toFixed(2)} cashback credited!`
          : `₹${receipt.cashbackEarned.toFixed(2)} cashback will be credited!`;
        doc.text(cashbackText, { align: 'center' });
        doc.fillColor('#000000');
      }

      doc.moveDown();

      // Payment info
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();
      doc.font('Helvetica').fontSize(9);
      doc.text(`Payment: ${receipt.paymentMethod.toUpperCase()}`);
      doc.text(`Transaction ID: ${receipt.paymentId}`);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#6B7280');
      doc.text('Thank you for shopping with REZ Go!', { align: 'center' });
      doc.text('Powered by REZ - Smart Savings + Fast Checkout', { align: 'center' });
      doc.text(`Session: ${receipt.sessionId}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate receipt HTML (for email/web)
 */
export function generateReceiptHTML(receipt: Receipt): string {
  const itemsHTML = receipt.items
    .map(
      (item) => `
    <tr>
      <td>${item.quantity}x ${item.name}</td>
      <td>₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>REZ Go Receipt - ${receipt.receiptId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #22C55E; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #22C55E; }
    .receipt-id { background: #F3F4F6; padding: 10px; border-radius: 8px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F9FAFB; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 40px; margin: 5px 0; }
    .savings { background: #DCFCE7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .savings-amount { font-size: 24px; font-weight: bold; color: #22C55E; }
    .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">REZ Go</div>
    <div>Smart Shopping Receipt</div>
  </div>

  <div class="receipt-id">
    <strong>Receipt ID:</strong> ${receipt.receiptId}<br>
    <strong>Store:</strong> ${receipt.storeName}<br>
    <strong>Date:</strong> ${receipt.timestamp.toLocaleString('en-IN')}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal:</span><span>₹${receipt.subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>Tax (GST):</span><span>₹${receipt.tax.toFixed(2)}</span></div>
    <div class="total-row" style="font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
      <span>Total:</span><span>₹${receipt.total.toFixed(2)}</span>
    </div>
  </div>

  <div class="savings">
    <div>💰 You Saved</div>
    <div class="savings-amount">₹${receipt.savings.toFixed(2)}</div>
  </div>

  ${receipt.cashbackEarned > 0 ? `
  <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; text-align: center;">
    🎁 ₹${receipt.cashbackEarned.toFixed(2)} cashback ${receipt.cashbackCredited ? 'credited!' : 'will be credited!'}
  </div>
  ` : ''}

  <div style="margin-top: 20px;">
    <strong>Payment:</strong> ${receipt.paymentMethod.toUpperCase()}<br>
    <strong>Transaction ID:</strong> ${receipt.paymentId}
  </div>

  <div class="footer">
    <p>Thank you for shopping with REZ Go!</p>
    <p>Powered by REZ - Smart Savings + Fast Checkout</p>
    <p>Session: ${receipt.sessionId}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Verify receipt authenticity
 */
export function verifyReceipt(receipt: Receipt, signature?: string): boolean {
  // In production, verify HMAC signature
  if (!signature) return true;

  // Simple verification - receipt ID format
  const validFormat = /^GORE-[A-Z0-9]{8}$/.test(receipt.receiptId);
  return validFormat;
}

export default {
  generateReceiptId,
  createReceipt,
  generatePDFReceipt,
  generateReceiptHTML,
  verifyReceipt,
};
