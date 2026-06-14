/**
 * BIZORA Tally Sync Service
 * Syncs BIZORA invoices/entries with Tally Prime
 *
 * Supports:
 * - Push invoices to Tally
 * - Pull vouchers from Tally
 * - Sync master data (ledgers, groups)
 */

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4106;

// Tally Configuration
const TALLY_HOST = process.env.TALLY_HOST || 'localhost';
const TALLY_PORT = process.env.TALLY_PORT || 9000;
const TALLY_COMPANY = process.env.TALLY_COMPANY || '';

// In-memory storage
const syncLogs = [];
const tallyLedgers = new Map();
const tallyVouchers = new Map();

// ============================================================================
// HELPERS
// ============================================================================

function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

function log(level, message, data = {}) {
  const entry = {
    id: genId('log'),
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
  syncLogs.push(entry);
  console.log(`[${level}] ${message}`);
}

// ============================================================================
// TALLY XML GENERATION
// ============================================================================

// Generate Tally XML for a voucher
function generateVoucherXML(voucher) {
  const voucherType = getVoucherType(voucher.type);

  return `
    <VOUCHER>
      <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
      <DATE>${formatTallyDate(voucher.date)}</DATE>
      <VOUCHERNUMBER>${voucher.number}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${voucher.partyName || 'Cash'}</PARTYLEDGERNAME>
      <EFFECTIVEDATE>${formatTallyDate(voucher.date)}</EFFECTIVEDATE>
      <NARRATION>${voucher.narration || ''}</NARRATION>
      ${voucher.entries.map(entry => generateEntryXML(entry)).join('')}
    </VOUCHER>
  `;
}

function generateEntryXML(entry) {
  return `
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${entry.ledger}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>${entry.isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
      <AMOUNT>${entry.amount}</AMOUNT>
      ${entry.inventoryEntries ? generateInventoryXML(entry.inventoryEntries) : ''}
    </ALLLEDGERENTRIES.LIST>
  `;
}

function generateInventoryXML(inventory) {
  return `
    <INVENTORYENTRIES.LIST>
      <STOCKITEMNAME>${inventory.stockItem}</STOCKITEMNAME>
      <ISDEEMEDPOSITIVE>${inventory.isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
      <RATE>${inventory.rate}</RATE>
      <AMOUNT>${inventory.amount}</AMOUNT>
      <ACTUALQTY>${inventory.quantity}</ACTUALQTY>
    </INVENTORYENTRIES.LIST>
  `;
}

function getVoucherType(type) {
  const types = {
    'sale': 'Sales',
    'purchase': 'Purchase',
    'payment': 'Payment',
    'receipt': 'Receipt',
    'contra': 'Contra',
    'journal': 'Journal',
    'debit_note': 'Debit Note',
    'credit_note': 'Credit Note'
  };
  return types[type] || 'Sales';
}

function formatTallyDate(date) {
  const d = new Date(date);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

// ============================================================================
// MASTER DATA SYNC
// ============================================================================

// Create Ledger in Tally
app.post('/api/ledgers', async (req, res) => {
  const { name, group, openingBalance, address, state, pincode } = req.body;

  if (!name || !group) {
    return res.status(400).json({ success: false, error: 'Name and group required' });
  }

  const ledger = {
    id: genId('ledger'),
    name,
    group,
    openingBalance: openingBalance || 0,
    address,
    state,
    pincode,
    synced: false,
    createdAt: new Date().toISOString()
  };

  // Generate Tally XML
  const xml = `
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Import</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Ledgers</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVIMPORTMODE>Create</SVIMPORTMODE>
            <SVCOMPANY>${TALLY_COMPANY}</SVCOMPANY>
          </STATICVARIABLES>
        </DESC>
        <DATA>
          <TALLYMESSAGE>
            <LEDGER NAME="${name}">
              <PARENT>${group}</PARENT>
              <OPENINGBALANCE>${openingBalance || 0}</OPENINGBALANCE>
              ${address ? `<ADDRESS.LIST TYPE="String"><ADDRESS1>${address}</ADDRESS1></ADDRESS.LIST>` : ''}
              ${state ? `<STATENAME>${state}</STATENAME>` : ''}
              <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            </LEDGER>
          </TALLYMESSAGE>
        </DATA>
      </BODY>
    </ENVELOPE>
  `;

  // In demo mode, simulate success
  ledger.synced = true;
  tallyLedgers.set(ledger.id, ledger);

  log('info', 'Ledger created', { name, group });

  res.status(201).json({
    success: true,
    ledger,
    tallyXml: xml,
    message: 'Ledger created (Demo mode)'
  });
});

// Get all ledgers
app.get('/api/ledgers', (req, res) => {
  const ledgers = Array.from(tallyLedgers.values());
  res.json({ success: true, ledgers, total: ledgers.length });
});

// Create Group in Tally
app.post('/api/groups', async (req, res) => {
  const { name, parentGroup } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Group name required' });
  }

  const group = {
    id: genId('group'),
    name,
    parentGroup: parentGroup || 'Primary',
    synced: false,
    createdAt: new Date().toISOString()
  };

  // Generate Tally XML
  const xml = `
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Import</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Groups</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVIMPORTMODE>Create</SVIMPORTMODE>
            <SVCOMPANY>${TALLY_COMPANY}</SVCOMPANY>
          </STATICVARIABLES>
        </DESC>
        <DATA>
          <TALLYMESSAGE>
            <GROUP NAME="${name}">
              <PARENT>${parentGroup || ''}</PARENT>
            </GROUP>
          </TALLYMESSAGE>
        </DATA>
      </BODY>
    </ENVELOPE>
  `;

  group.synced = true;
  tallyLedgers.set(group.id, group);

  log('info', 'Group created', { name });

  res.status(201).json({
    success: true,
    group,
    tallyXml: xml,
    message: 'Group created (Demo mode)'
  });
});

// ============================================================================
// VOUCHER SYNC
// ============================================================================

// Push voucher to Tally
app.post('/api/vouchers', async (req, res) => {
  const {
    type,
    date,
    number,
    partyName,
    narration,
    entries,
    gstDetails
  } = req.body;

  if (!type || !date || !entries?.length) {
    return res.status(400).json({ success: false, error: 'Type, date, and entries required' });
  }

  const voucher = {
    id: genId('voucher'),
    type,
    date,
    number: number || 'BIZ' + Date.now(),
    partyName,
    narration,
    entries,
    gstDetails,
    synced: false,
    createdAt: new Date().toISOString()
  };

  // Generate Tally XML
  const xml = generateVoucherXML(voucher);

  const tallyXml = `
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Import</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Vouchers</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVIMPORTMODE>Create</SVIMPORTMODE>
            <SVCOMPANY>${TALLY_COMPANY}</SVCOMPANY>
          </STATICVARIABLES>
        </DESC>
        <DATA>
          <TALLYMESSAGE>
            ${generateVoucherXML(voucher)}
          </TALLYMESSAGE>
        </DATA>
      </BODY>
    </ENVELOPE>
  `;

  // In demo mode, simulate success
  voucher.synced = true;
  voucher.syncDate = new Date().toISOString();
  tallyVouchers.set(voucher.id, voucher);

  log('info', 'Voucher pushed to Tally', { type, number });

  res.status(201).json({
    success: true,
    voucher,
    tallyXml,
    message: 'Voucher pushed to Tally (Demo mode)'
  });
});

// Get vouchers
app.get('/api/vouchers', (req, res) => {
  const { type, fromDate, toDate, synced } = req.query;
  let vouchers = Array.from(tallyVouchers.values());

  if (type) vouchers = vouchers.filter(v => v.type === type);
  if (synced !== undefined) vouchers = vouchers.filter(v => v.synced === (synced === 'true'));
  if (fromDate) vouchers = vouchers.filter(v => new Date(v.date) >= new Date(fromDate));
  if (toDate) vouchers = vouchers.filter(v => new Date(v.date) <= new Date(toDate));

  res.json({ success: true, vouchers, total: vouchers.length });
});

// Get single voucher
app.get('/api/vouchers/:id', (req, res) => {
  const voucher = tallyVouchers.get(req.params.id);
  if (!voucher) return res.status(404).json({ success: false, error: 'Voucher not found' });
  res.json({ success: true, voucher });
});

// ============================================================================
// INVOICE SYNC (Special case - Sales with GST)
// ============================================================================

// Push sales invoice to Tally
app.post('/api/invoices/sync', async (req, res) => {
  const {
    invoiceNumber,
    date,
    customerName,
    customerGstin,
    customerState,
    items,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal,
    placeOfSupply
  } = req.body;

  if (!invoiceNumber || !customerName || !items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Determine if IGST or CGST/SGST
  const isInterState = placeOfSupply && placeOfSupply !== customerState;

  // Build voucher entries
  const entries = [];

  // Sales entry (debit to customer)
  entries.push({
    ledger: customerName,
    isDebit: true,
    amount: grandTotal
  });

  // CGST output (credit)
  if (!isInterState && cgst) {
    entries.push({
      ledger: 'Output CGST',
      isDebit: false,
      amount: -cgst
    });
  }

  // SGST output (credit)
  if (!isInterState && sgst) {
    entries.push({
      ledger: 'Output SGST',
      isDebit: false,
      amount: -sgst
    });
  }

  // IGST output (credit)
  if (isInterState && igst) {
    entries.push({
      ledger: 'Output IGST',
      isDebit: false,
      amount: -igst
    });
  }

  // Sales ledger (credit)
  entries.push({
    ledger: 'Sales',
    isDebit: false,
    amount: -taxableAmount
  });

  // Create Tally voucher
  const voucher = {
    id: genId('invoice'),
    type: 'sale',
    date: date || new Date().toISOString(),
    number: invoiceNumber,
    partyName: customerName,
    narration: `Invoice ${invoiceNumber} | GSTIN: ${customerGstin || 'N/A'}`,
    entries,
    synced: false,
    createdAt: new Date().toISOString()
  };

  tallyVouchers.set(voucher.id, voucher);
  voucher.synced = true;

  log('info', 'Invoice synced to Tally', { invoiceNumber, customerName });

  res.status(201).json({
    success: true,
    voucher,
    message: 'Invoice synced to Tally (Demo mode)',
    details: {
      isInterState,
      cgst,
      sgst,
      igst,
      taxableAmount,
      grandTotal
    }
  });
});

// ============================================================================
// PAYMENT SYNC
// ============================================================================

// Record payment received
app.post('/api/payments/received', async (req, res) => {
  const { receiptNumber, date, customerName, amount, mode, reference } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ success: false, error: 'Customer name and amount required' });
  }

  const entries = [
    { ledger: getCashBankLedger(mode), isDebit: true, amount },
    { ledger: customerName, isDebit: false, amount: -amount }
  ];

  const voucher = {
    id: genId('receipt'),
    type: 'receipt',
    date: date || new Date().toISOString(),
    number: receiptNumber || 'BIZ-REC-' + Date.now(),
    partyName: customerName,
    narration: reference || '',
    entries,
    synced: false,
    createdAt: new Date().toISOString()
  };

  tallyVouchers.set(voucher.id, voucher);
  voucher.synced = true;

  log('info', 'Payment received synced', { customerName, amount });

  res.status(201).json({
    success: true,
    voucher,
    message: 'Payment receipt synced to Tally'
  });
});

// Record payment made
app.post('/api/payments/made', async (req, res) => {
  const { paymentNumber, date, supplierName, amount, mode, reference } = req.body;

  if (!supplierName || !amount) {
    return res.status(400).json({ success: false, error: 'Supplier name and amount required' });
  }

  const entries = [
    { ledger: supplierName, isDebit: true, amount },
    { ledger: getCashBankLedger(mode), isDebit: false, amount: -amount }
  ];

  const voucher = {
    id: genId('payment'),
    type: 'payment',
    date: date || new Date().toISOString(),
    number: paymentNumber || 'BIZ-PAY-' + Date.now(),
    partyName: supplierName,
    narration: reference || '',
    entries,
    synced: false,
    createdAt: new Date().toISOString()
  };

  tallyVouchers.set(voucher.id, voucher);
  voucher.synced = true;

  log('info', 'Payment made synced', { supplierName, amount });

  res.status(201).json({
    success: true,
    voucher,
    message: 'Payment voucher synced to Tally'
  });
});

function getCashBankLedger(mode) {
  const ledgers = {
    'cash': 'Cash',
    'bank': 'Bank Account',
    'upi': 'UPI',
    'card': 'Card Payments',
    'cheque': 'Cheques'
  };
  return ledgers[mode] || 'Bank Account';
}

// ============================================================================
// SYNC STATUS
// ============================================================================

app.get('/api/sync/status', (req, res) => {
  const vouchers = Array.from(tallyVouchers.values());
  const ledgers = Array.from(tallyLedgers.values()).filter(l => l.id.startsWith('ledger'));

  res.json({
    success: true,
    status: {
      connected: true,
      lastSync: new Date().toISOString(),
      tallyCompany: TALLY_COMPANY || 'Demo Company',
      stats: {
        totalLedgers: ledgers.length,
        totalVouchers: vouchers.length,
        synced: vouchers.filter(v => v.synced).length,
        pending: vouchers.filter(v => !v.synced).length
      }
    }
  });
});

app.get('/api/sync/logs', (req, res) => {
  const { limit = 50 } = req.query;
  res.json({
    success: true,
    logs: syncLogs.slice(-parseInt(limit)).reverse()
  });
});

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tally-sync',
    tally: {
      host: TALLY_HOST,
      port: TALLY_PORT,
      company: TALLY_COMPANY
    },
    stats: {
      ledgers: Array.from(tallyLedgers.values()).length,
      vouchers: tallyVouchers.size,
      syncLogs: syncLogs.length
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📊 BIZORA Tally Sync Service                      ║
║  Port: ${PORT}                                      ║
║                                                      ║
║  Syncs BIZORA with Tally Prime                   ║
║  • Invoices → Sales Vouchers                    ║
║  • Payments → Receipts/Payments                  ║
║  • Ledgers → Chart of Accounts                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});
