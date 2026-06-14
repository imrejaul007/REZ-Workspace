/**
 * BIZORA Invoice Generator
 * Generates professional PDF invoices
 */

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4103;

// In-memory storage
const invoices = new Map();

function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); }

// Create Invoice
app.post('/api/invoices', (req, res) => {
  const {
    from,           // Seller details
    to,             // Buyer details
    items,          // Line items
    invoiceNumber,  // INV-2026-001
    invoiceDate,    // Date
    dueDate,        // Payment due
    taxRate = 18,   // GST %
    notes,           // Notes
    paymentTerms     // NET 30, etc.
  } = req.body;

  if (!from || !to || !items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const total = subtotal + taxAmount;
  const inWords = numberToWords(total);

  const invoice = {
    id: genId('inv'),
    invoiceNumber: invoiceNumber || 'INV-' + Date.now(),
    invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    from,
    to,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    inWords,
    notes: notes || '',
    paymentTerms: paymentTerms || 'Net 30',
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  invoices.set(invoice.id, invoice);

  // Generate HTML for PDF
  const html = generateInvoiceHTML(invoice);

  res.status(201).json({
    success: true,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subtotal,
      taxAmount,
      total,
      status: invoice.status
    },
    html,
    message: 'Invoice generated. Use HTML to create PDF.'
  });
});

// Get invoice
app.get('/api/invoices/:id', (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

  const html = generateInvoiceHTML(invoice);
  res.json({ success: true, invoice, html });
});

// List invoices
app.get('/api/invoices', (req, res) => {
  const { status, customerId } = req.query;
  let all = Array.from(invoices.values());
  if (status) all = all.filter(i => i.status === status);
  if (customerId) all = all.filter(i => i.to.gstin === customerId);
  res.json({ success: true, invoices: all, total: all.length });
});

// Update invoice
app.put('/api/invoices/:id', (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

  Object.assign(invoice, req.body, { updatedAt: new Date().toISOString() });
  invoices.set(invoice.id, invoice);

  res.json({ success: true, invoice });
});

// Send invoice
app.post('/api/invoices/:id/send', (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

  invoice.status = 'sent';
  invoice.sentAt = new Date().toISOString();
  invoices.set(invoice.id, invoice);

  // In production, send email here
  res.json({
    success: true,
    invoice,
    message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.to.email || invoice.to.name}`
  });
});

// Mark as paid
app.post('/api/invoices/:id/paid', (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

  invoice.status = 'paid';
  invoice.paidAt = new Date().toISOString();
  invoice.paidAmount = invoice.total;
  invoices.set(invoice.id, invoice);

  res.json({ success: true, invoice, message: 'Invoice marked as paid' });
});

// Generate HTML invoice
function generateInvoiceHTML(invoice) {
  const itemsHTML = invoice.items.map((item, i) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${i + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.rate.toLocaleString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.rate).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #667eea; }
    .invoice-title { font-size: 32px; color: #333; }
    .invoice-meta { text-align: right; }
    .invoice-meta p { margin: 5px 0; }
    .parties { display: flex; gap: 40px; margin-bottom: 40px; }
    .party { flex: 1; }
    .party h3 { color: #667eea; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
    .party p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { padding: 8px 0; }
    .totals tr.total { font-size: 18px; font-weight: bold; color: #667eea; }
    .amount-in-words { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
    .status.draft { background: #fef3c7; color: #92400e; }
    .status.sent { background: #dbeafe; color: #1e40af; }
    .status.paid { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BIZORA</div>
      <p style="color: #666; font-size: 14px;">Your Business Operating Platform</p>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p>Date: ${invoice.invoiceDate}</p>
      <p>Due: ${invoice.dueDate}</p>
      <span class="status ${invoice.status}">${invoice.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p><strong>${invoice.from.name || invoice.from.businessName}</strong></p>
      ${invoice.from.address ? `<p>${invoice.from.address}</p>` : ''}
      ${invoice.from.city ? `<p>${invoice.from.city}${invoice.from.state ? ', ' + invoice.from.state : ''}</p>` : ''}
      ${invoice.from.gstin ? `<p>GSTIN: ${invoice.from.gstin}</p>` : ''}
      ${invoice.from.pan ? `<p>PAN: ${invoice.from.pan}</p>` : ''}
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p><strong>${invoice.to.name || invoice.to.businessName}</strong></p>
      ${invoice.to.address ? `<p>${invoice.to.address}</p>` : ''}
      ${invoice.to.city ? `<p>${invoice.to.city}${invoice.to.state ? ', ' + invoice.to.state : ''}</p>` : ''}
      ${invoice.to.gstin ? `<p>GSTIN: ${invoice.to.gstin}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px;">#</th>
        <th>Description</th>
        <th style="width: 80px; text-align: center;">Qty</th>
        <th style="width: 120px;">Rate</th>
        <th style="width: 120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td style="text-align: right; padding-right: 20px;">Subtotal</td>
      <td style="text-align: right;">₹${invoice.subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="text-align: right; padding-right: 20px;">Tax (${invoice.taxRate}% GST)</td>
      <td style="text-align: right;">₹${invoice.taxAmount.toLocaleString()}</td>
    </tr>
    <tr class="total">
      <td style="text-align: right; padding-right: 20px;">Total</td>
      <td style="text-align: right;">₹${invoice.total.toLocaleString()}</td>
    </tr>
  </table>

  <div class="amount-in-words">
    <strong>Amount in Words:</strong><br>
    ${invoice.inWords}
  </div>

  ${invoice.notes ? `
  <div>
    <strong>Notes:</strong>
    <p>${invoice.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Payment Terms:</strong> ${invoice.paymentTerms}</p>
    <p>Thank you for your business!</p>
    <p>Generated by BIZORA - Your Business Operating Platform</p>
  </div>
</body>
</html>
  `;
}

// Convert number to words (Indian system)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function twoDigit(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function threeDigit(n) {
    if (n < 100) return twoDigit(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigit(n % 100) : '');
  }

  if (num >= 10000000) {
    return threeDigit(Math.floor(num / 10000000)) + ' Crore' +
      (num % 10000000 >= 100000 ? ' ' + threeDigit(Math.floor((num % 10000000) / 100000)) + ' Lakh' : '') +
      (num % 100000 >= 1000 ? ' ' + threeDigit(Math.floor((num % 100000) / 1000)) + ' Thousand' : '') +
      (num % 1000 > 0 ? ' ' + threeDigit(num % 1000) : '') + ' Only';
  } else if (num >= 100000) {
    return threeDigit(Math.floor(num / 100000)) + ' Lakh' +
      (num % 100000 >= 1000 ? ' ' + threeDigit(Math.floor((num % 100000) / 1000)) + ' Thousand' : '') +
      (num % 1000 > 0 ? ' ' + threeDigit(num % 1000) : '') + ' Only';
  } else if (num >= 1000) {
    return threeDigit(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 > 0 ? ' ' + threeDigit(num % 1000) : '') + ' Only';
  } else {
    return twoDigit(num) + ' Only';
  }
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'invoice-generator', invoices: invoices.size });
});

app.listen(PORT, () => {
  console.log(`📄 Invoice Generator running on port ${PORT}`);
});
