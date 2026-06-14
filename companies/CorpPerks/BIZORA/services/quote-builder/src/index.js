/**
 * BIZORA Quote Builder
 * Professional quote/proposal builder
 */

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4104;

const quotes = new Map();

function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); }

// Create Quote
app.post('/api/quotes', (req, res) => {
  const {
    from,
    to,
    items,
    quoteNumber,
    quoteDate,
    validUntil,
    subject,
    description,
    terms,
    notes,
    taxRate = 18
  } = req.body;

  if (!from || !to || !items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const total = subtotal + taxAmount;

  const quote = {
    id: genId('quote'),
    quoteNumber: quoteNumber || 'QT-' + Date.now(),
    quoteDate: quoteDate || new Date().toISOString().split('T')[0],
    validUntil: validUntil || new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
    from,
    to,
    subject: subject || 'Quotation',
    description: description || '',
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    terms: terms || ['30 days validity', 'Prices inclusive of GST', 'Delivery within agreed timeline'],
    notes: notes || '',
    status: 'draft', // draft, sent, accepted, rejected, expired
    createdAt: new Date().toISOString()
  };

  quotes.set(quote.id, quote);

  res.status(201).json({
    success: true,
    quote: {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      total,
      status: quote.status
    },
    message: 'Quote created'
  });
});

// Get Quote
app.get('/api/quotes/:id', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });
  res.json({ success: true, quote });
});

// List Quotes
app.get('/api/quotes', (req, res) => {
  const { status, vendorId } = req.query;
  let all = Array.from(quotes.values());
  if (status) all = all.filter(q => q.status === status);
  if (vendorId) all = all.filter(q => q.from.email === vendorId);
  res.json({ success: true, quotes: all, total: all.length });
});

// Update Quote
app.put('/api/quotes/:id', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  if (req.body.items) {
    const subtotal = req.body.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = Math.round(subtotal * quote.taxRate / 100);
    req.body.subtotal = subtotal;
    req.body.taxAmount = taxAmount;
    req.body.total = subtotal + taxAmount;
  }

  Object.assign(quote, req.body, { updatedAt: new Date().toISOString() });
  quotes.set(quote.id, quote);

  res.json({ success: true, quote });
});

// Send Quote
app.post('/api/quotes/:id/send', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  quote.status = 'sent';
  quote.sentAt = new Date().toISOString();
  quotes.set(quote.id, quote);

  res.json({ success: true, quote, message: 'Quote sent to ' + quote.to.email });
});

// Accept Quote
app.post('/api/quotes/:id/accept', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  quote.status = 'accepted';
  quote.acceptedAt = new Date().toISOString();
  quotes.set(quote.id, quote);

  res.json({ success: true, quote, message: 'Quote accepted! Order can be created.' });
});

// Reject Quote
app.post('/api/quotes/:id/reject', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  quote.status = 'rejected';
  quote.rejectedAt = new Date().toISOString();
  quote.rejectReason = req.body.reason || '';
  quotes.set(quote.id, quote);

  res.json({ success: true, quote, message: 'Quote rejected' });
});

// Generate HTML Quote
app.get('/api/quotes/:id/html', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  const itemsHTML = quote.items.map((item, i) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">${i + 1}</td>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">₹${item.rate.toLocaleString()}</td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.rate).toLocaleString()}</td>
    </tr>
  `).join('');

  const termsHTML = quote.terms.map(term => `<li>${term}</li>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote ${quote.quoteNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #667eea; }
    .quote-title { font-size: 28px; color: #333; }
    .quote-meta { text-align: right; }
    .quote-meta p { margin: 5px 0; }
    .parties { display: flex; gap: 60px; margin-bottom: 40px; }
    .party h3 { color: #667eea; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; }
    .party p { margin: 5px 0; font-size: 14px; }
    .subject { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .subject h2 { margin: 0 0 10px 0; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { padding: 8px 0; }
    .totals tr:last-child { font-size: 20px; font-weight: bold; color: #667eea; }
    .terms { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0; }
    .terms h3 { margin: 0 0 10px 0; font-size: 14px; }
    .terms ul { margin: 0; padding-left: 20px; font-size: 13px; }
    .notes { margin: 20px 0; font-size: 13px; color: #666; }
    .signatures { display: flex; gap: 60px; margin-top: 60px; }
    .signature { flex: 1; text-align: center; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; font-size: 12px; }
    .validity { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; text-align: center; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
    .status.draft { background: #fef3c7; color: #92400e; }
    .status.sent { background: #dbeafe; color: #1e40af; }
    .status.accepted { background: #dcfce7; color: #166534; }
    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BIZORA</div>
      <p style="color: #666; font-size: 14px;">Your Business Operating Platform</p>
    </div>
    <div class="quote-meta">
      <div class="quote-title">QUOTATION</div>
      <p><strong>${quote.quoteNumber}</strong></p>
      <p>Date: ${quote.quoteDate}</p>
      <p>Valid Until: ${quote.validUntil}</p>
      <span class="status ${quote.status}">${quote.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p><strong>${quote.from.name}</strong></p>
      ${quote.from.businessName ? `<p>${quote.from.businessName}</p>` : ''}
      ${quote.from.address ? `<p>${quote.from.address}</p>` : ''}
      ${quote.from.city ? `<p>${quote.from.city}</p>` : ''}
      ${quote.from.email ? `<p>${quote.from.email}</p>` : ''}
      ${quote.from.phone ? `<p>${quote.from.phone}</p>` : ''}
    </div>
    <div class="party">
      <h3>To</h3>
      <p><strong>${quote.to.name}</strong></p>
      ${quote.to.businessName ? `<p>${quote.to.businessName}</p>` : ''}
      ${quote.to.address ? `<p>${quote.to.address}</p>` : ''}
      ${quote.to.city ? `<p>${quote.to.city}</p>` : ''}
      ${quote.to.email ? `<p>${quote.to.email}</p>` : ''}
      ${quote.to.phone ? `<p>${quote.to.phone}</p>` : ''}
    </div>
  </div>

  <div class="subject">
    <h2>Subject: ${quote.subject}</h2>
    ${quote.description ? `<p>${quote.description}</p>` : ''}
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
      <td style="text-align: right;">₹${quote.subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="text-align: right; padding-right: 20px;">Tax (${quote.taxRate}% GST)</td>
      <td style="text-align: right;">₹${quote.taxAmount.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="text-align: right; padding-right: 20px;"><strong>TOTAL</strong></td>
      <td style="text-align: right;"><strong>₹${quote.total.toLocaleString()}</strong></td>
    </tr>
  </table>

  <div class="validity">
    ⏰ This quote is valid until ${quote.validUntil}
  </div>

  <div class="terms">
    <h3>Terms & Conditions</h3>
    <ul>
      ${termsHTML}
    </ul>
  </div>

  ${quote.notes ? `<div class="notes"><strong>Notes:</strong><br>${quote.notes}</div>` : ''}

  <div class="signatures">
    <div class="signature">
      <div class="signature-line">Authorized Signature (Vendor)</div>
    </div>
    <div class="signature">
      <div class="signature-line">Authorized Signature (Client)</div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
    <p>Generated by BIZORA - Your Business Operating Platform</p>
  </div>
</body>
</html>
  `;

  res.json({ success: true, html });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'quote-builder', quotes: quotes.size });
});

app.listen(PORT, () => {
  console.log(`📝 Quote Builder running on port ${PORT}`);
});
