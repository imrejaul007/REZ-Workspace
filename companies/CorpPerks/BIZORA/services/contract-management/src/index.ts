/**
 * BIZORA Contract Management Service
 * Digital contracts, signatures, approval workflows
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Contract {
  id: string;
  title: string;
  type: 'vendor' | 'employee' | 'lease' | 'service' | 'nda' | 'partnership';
  parties: Party[];
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  value?: number;
  startDate?: string;
  endDate?: string;
  terms: string;
  signatures: Signature[];
  approvals: Approval[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

interface Party {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'signer' | 'viewer' | 'approver';
}

interface Signature {
  partyId: string;
  signedAt?: string;
  method: 'otp' | 'esign' | 'manual';
  ip?: string;
}

interface Approval {
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

// Contract templates
const CONTRACT_TEMPLATES = {
  vendor_agreement: {
    name: 'Vendor Service Agreement',
    sections: ['Scope of Work', 'Payment Terms', 'Delivery Timeline', 'Termination', 'Confidentiality'],
  },
  employment: {
    name: 'Employment Contract',
    sections: ['Position', 'Compensation', 'Working Hours', 'Benefits', 'Confidentiality', 'Termination'],
  },
  nda: {
    name: 'Non-Disclosure Agreement',
    sections: ['Parties', 'Definition', 'Confidential Information', 'Obligations', 'Term', 'Remedies'],
  },
  service_agreement: {
    name: 'Service Level Agreement',
    sections: ['Services', 'SLAs', 'Support Hours', 'Escalation', 'Billing', 'Term'],
  },
  lease: {
    name: 'Lease Agreement',
    sections: ['Premises', 'Rent', 'Security Deposit', 'Maintenance', 'Term', 'Termination'],
  },
  partnership: {
    name: 'Partnership Agreement',
    sections: ['Parties', 'Business Purpose', 'Profit Sharing', 'Management', 'Liabilities', 'Termination'],
  },
};

// In-memory store
const contracts: Map<string, Contract> = new Map();

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'contract-management',
    contracts: contracts.size,
    templates: Object.keys(CONTRACT_TEMPLATES).length,
    timestamp: new Date().toISOString(),
  });
});

// List templates
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = Object.entries(CONTRACT_TEMPLATES).map(([id, template]) => ({
    id,
    ...template,
  }));
  res.json({ templates });
});

// Get template
app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = CONTRACT_TEMPLATES[req.params.id as keyof typeof CONTRACT_TEMPLATES];
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json({ id: req.params.id, ...template });
});

// Create contract from template
app.post('/api/contracts', (req: Request, res: Response) => {
  const { title, type, parties, terms, value, startDate, endDate } = req.body;

  const id = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const contract: Contract = {
    id,
    title,
    type,
    parties,
    status: 'draft',
    value,
    startDate,
    endDate,
    terms,
    signatures: parties.map((p: Party) => ({ partyId: p.id, signedAt: undefined, method: 'otp' })),
    approvals: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  contracts.set(id, contract);

  res.status(201).json({
    contractId: id,
    status: 'draft',
    message: 'Contract created as draft. Send for signature when ready.',
  });
});

// Get contract
app.get('/api/contracts/:id', (req: Request, res: Response) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  res.json(contract);
});

// List contracts
app.get('/api/contracts', (req: Request, res: Response) => {
  const { status, partyEmail, type } = req.query;

  let list = Array.from(contracts.values());

  if (status) list = list.filter(c => c.status === status);
  if (type) list = list.filter(c => c.type === type);
  if (partyEmail) {
    list = list.filter(c =>
      c.parties.some(p => p.email.includes(partyEmail as string))
    );
  }

  list.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ contracts: list, total: list.length });
});

// Send for signature
app.post('/api/contracts/:id/send', (req: Request, res: Response) => {
  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  contract.status = 'pending_signature';
  contract.updatedAt = new Date().toISOString();
  contracts.set(contract.id, contract);

  res.json({
    contractId: contract.id,
    status: 'pending_signature',
    message: `Contract sent to ${contract.parties.length} parties for signature`,
    nextStep: 'Awaiting signatures from all parties',
  });
});

// Sign contract (OTP verification)
app.post('/api/contracts/:id/sign', (req: Request, res: Response) => {
  const { partyId, otp } = req.body;

  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const signature = contract.signatures.find(s => s.partyId === partyId);
  if (!signature) return res.status(404).json({ error: 'Party not found' });

  // Verify OTP (mock)
  if (otp === '123456') {
    signature.signedAt = new Date().toISOString();
    signature.method = 'otp';
    signature.ip = req.ip;
    contract.updatedAt = new Date().toISOString();

    // Check if all signed
    const allSigned = contract.signatures.every(s => s.signedAt);
    if (allSigned) contract.status = 'active';

    contracts.set(contract.id, contract);

    res.json({
      contractId: contract.id,
      signed: true,
      status: contract.status,
      message: allSigned ? 'All parties signed. Contract is now active.' : 'Signature recorded. Waiting for other parties.',
    });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Add approval
app.post('/api/contracts/:id/approvals', (req: Request, res: Response) => {
  const { approverId, approverName, status, comments } = req.body;

  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  contract.approvals.push({
    approverId,
    approverName,
    status: status || 'pending',
    comments,
    timestamp: new Date().toISOString(),
  });

  contract.updatedAt = new Date().toISOString();
  contracts.set(contract.id, contract);

  res.json({
    approvalId: approverId,
    status: 'added',
    message: 'Approval recorded',
  });
});

// Upload attachment
app.post('/api/contracts/:id/attachments', (req: Request, res: Response) => {
  const { name, type, url } = req.body;

  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  contract.attachments.push({
    id: `att_${Date.now()}`,
    name,
    type,
    url,
  });

  contract.updatedAt = new Date().toISOString();
  contracts.set(contract.id, contract);

  res.status(201).json({
    attachmentId: contract.attachments[contract.attachments.length - 1].id,
    message: 'Attachment added',
  });
});

// Terminate contract
app.post('/api/contracts/:id/terminate', (req: Request, res: Response) => {
  const { reason } = req.body;

  const contract = contracts.get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  contract.status = 'terminated';
  contract.updatedAt = new Date().toISOString();
  contracts.set(contract.id, contract);

  res.json({
    contractId: contract.id,
    status: 'terminated',
    reason,
    message: 'Contract terminated',
  });
});

// Analytics
app.get('/api/analytics', (_req: Request, res: Response) => {
  const all = Array.from(contracts.values());

  res.json({
    total: all.length,
    byStatus: {
      draft: all.filter(c => c.status === 'draft').length,
      pending_signature: all.filter(c => c.status === 'pending_signature').length,
      active: all.filter(c => c.status === 'active').length,
      expired: all.filter(c => c.status === 'expired').length,
    },
    totalValue: all.reduce((sum, c) => sum + (c.value || 0), 0),
    upcomingExpirations: all.filter(c => {
      if (!c.endDate) return false;
      const daysUntil = (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil < 30;
    }).length,
  });
});

const PORT = process.env.PORT || 4058;
app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════╗
║  📝 Contract Management Service    ║
║  Digital signatures, approvals   ║
║  Port: ${PORT}                         ║
╚════════════════════════════════════╝
  `);
});
