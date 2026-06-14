/**
 * BIZORA Contract Service
 * Digital contract management
 */

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4105;

const contracts = new Map();

function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); }

// Create Contract
app.post('/api/contracts', (req, res) => {
  const {
    title,
    type, // vendor, employee, service, nda, lease, partnership
    parties,
    startDate,
    endDate,
    value,
    currency = 'INR',
    terms,
    deliverables,
    paymentTerms,
    renewalTerms
  } = req.body;

  if (!title || !type || !parties?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const contract = {
    id: genId('contract'),
    title,
    type,
    parties,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate,
    value,
    currency,
    terms: terms || [],
    deliverables: deliverables || [],
    paymentTerms: paymentTerms || 'Net 30',
    renewalTerms: renewalTerms || 'Auto-renew',
    status: 'draft', // draft, pending_signature, active, expired, terminated
    signatures: [],
    documents: [],
    createdAt: new Date().toISOString()
  };

  contracts.set(contract.id, contract);

  res.status(201).json({
    success: true,
    contract: {
      id: contract.id,
      title: contract.title,
      status: contract.status
    },
    message: 'Contract created'
  });
});

// Get Contract
app.get('/api/contracts/:id', (req, res) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });
  res.json({ success: true, contract });
});

// List Contracts
app.get('/api/contracts', (req, res) => {
  const { status, type, partyId } = req.query;
  let all = Array.from(contracts.values());
  if (status) all = all.filter(c => c.status === status);
  if (type) all = all.filter(c => c.type === type);
  if (partyId) all = all.filter(c => c.parties.some(p => p.email === partyId));
  res.json({ success: true, contracts: all, total: all.length });
});

// Add Signature
app.post('/api/contracts/:id/sign', (req, res) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

  const { partyEmail, signature, signedAt } = req.body;
  const party = contract.parties.find(p => p.email === partyEmail);

  if (!party) return res.status(404).json({ success: false, error: 'Party not found' });

  contract.signatures.push({
    partyId: partyEmail,
    partyName: party.name,
    signature: signature || 'ESIGN',
    signedAt: signedAt || new Date().toISOString()
  });

  // Check if all parties signed
  if (contract.signatures.length === contract.parties.length) {
    contract.status = 'active';
  } else {
    contract.status = 'pending_signature';
  }

  contract.updatedAt = new Date().toISOString();
  contracts.set(contract.id, contract);

  res.json({
    success: true,
    contract,
    message: `Signature added by ${party.name}`
  });
});

// Terminate Contract
app.post('/api/contracts/:id/terminate', (req, res) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

  contract.status = 'terminated';
  contract.terminatedAt = new Date().toISOString();
  contract.terminateReason = req.body.reason || '';
  contracts.set(contract.id, contract);

  res.json({ success: true, contract, message: 'Contract terminated' });
});

// Renew Contract
app.post('/api/contracts/:id/renew', (req, res) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

  const newEndDate = req.body.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0];

  const renewed = {
    id: genId('contract'),
    title: contract.title + ' (Renewed)',
    type: contract.type,
    parties: contract.parties,
    startDate: new Date().toISOString().split('T')[0],
    endDate: newEndDate,
    value: contract.value,
    currency: contract.currency,
    terms: contract.terms,
    deliverables: contract.deliverables,
    paymentTerms: contract.paymentTerms,
    renewalTerms: contract.renewalTerms,
    status: 'draft',
    signatures: [],
    renewedFrom: contract.id,
    createdAt: new Date().toISOString()
  };

  contracts.set(renewed.id, renewed);

  res.status(201).json({
    success: true,
    contract: renewed,
    message: 'Contract renewed'
  });
});

// Generate HTML
app.get('/api/contracts/:id/html', (req, res) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

  const partiesHTML = contract.parties.map(p => `
    <div class="party">
      <h3>${p.role || 'Party'}</h3>
      <p><strong>${p.name}</strong></p>
      <p>${p.email}</p>
      ${p.company ? `<p>${p.company}</p>` : ''}
      ${p.address ? `<p>${p.address}</p>` : ''}
    </div>
  `).join('');

  const termsHTML = contract.terms.map((t, i) => `<li><strong>${i + 1}.</strong> ${t}</li>`).join('');

  const deliverablesHTML = contract.deliverables.map((d, i) => `<li>${d}</li>`).join('');

  const signaturesHTML = contract.signatures.length > 0
    ? contract.signatures.map(s => `
        <div class="signature-block">
          <p><strong>${s.partyName}</strong></p>
          <p>${s.signature === 'ESIGN' ? '✓' : s.signature}</p>
          <p class="date">Signed: ${new Date(s.signedAt).toLocaleDateString()}</p>
        </div>
      `).join('')
    : '<p style="color: #999;">Awaiting signatures...</p>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${contract.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .meta { color: #666; font-size: 14px; }
    .parties { display: flex; gap: 40px; margin: 30px 0; padding: 20px; background: #f9f9f9; }
    .party { flex: 1; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #667eea; margin-bottom: 10px; }
    .section { margin: 30px 0; }
    .section h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    ul { padding-left: 20px; }
    li { margin: 10px 0; }
    .value { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: #f5f5f5; margin: 20px 0; }
    .signatures { display: flex; gap: 60px; margin-top: 60px; }
    .signature-block { flex: 1; border-top: 1px solid #333; padding-top: 10px; }
    .signature-block .date { font-size: 12px; color: #666; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
    .status.draft { background: #fef3c7; color: #92400e; }
    .status.pending { background: #dbeafe; color: #1e40af; }
    .status.active { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${contract.title.toUpperCase()}</div>
    <div class="meta">
      Contract ID: ${contract.id} |
      Type: ${contract.type.toUpperCase()} |
      Status: <span class="status ${contract.status}">${contract.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="parties">
    ${partiesHTML}
  </div>

  <div class="section">
    <h2>Contract Period</h2>
    <p><strong>Start Date:</strong> ${contract.startDate}</p>
    ${contract.endDate ? `<p><strong>End Date:</strong> ${contract.endDate}</p>` : ''}
    ${contract.value ? `
    <div class="value">
      Contract Value: ${contract.currency} ${contract.value.toLocaleString()}
    </div>
    ` : ''}
  </div>

  ${contract.terms?.length ? `
  <div class="section">
    <h2>Terms & Conditions</h2>
    <ol>${termsHTML}</ol>
  </div>
  ` : ''}

  ${contract.deliverables?.length ? `
  <div class="section">
    <h2>Deliverables</h2>
    <ul>${deliverablesHTML}</ul>
  </div>
  ` : ''}

  <div class="section">
    <h2>Payment Terms</h2>
    <p>${contract.paymentTerms}</p>
  </div>

  <div class="section">
    <h2>Signatures</h2>
    <div class="signatures">
      ${signaturesHTML}
    </div>
  </div>

  <div class="footer">
    <p>Generated by BIZORA - Your Business Operating Platform</p>
    <p>Created: ${new Date(contract.createdAt).toLocaleDateString()}</p>
  </div>
</body>
</html>
  `;

  res.json({ success: true, html });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'contract-service', contracts: contracts.size });
});

app.listen(PORT, () => {
  console.log(`📝 Contract Service running on port ${PORT}`);
});
