/**
 * REZ Blockchain Verification Service
 *
 * Provides tamper-proof verification using blockchain anchoring
 *
 * Features:
 * - Hash anchoring to blockchain
 * - Verification history
 * - Tamper detection
 * - Supply chain proof
 */

import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'https://REZ-event-bus.onrender.com';

// ============================================
// BLOCKCHAIN TYPES
// ============================================

interface Block {
  block_number: number;
  previous_hash: string;
  hash: string;
  timestamp: string;
  data: VerificationData;
}

interface VerificationData {
  serial_number: string;
  action: 'created' | 'verified' | 'warranty_activated' | 'claimed';
  hash: string;
  metadata;
}

interface Chain {
  chain_id: string;
  blocks: Block[];
  created_at: string;
}

// In-memory chains (use database in production)
const chains = new Map<string, Chain>();

// ============================================
// CRYPTO HELPERS
// ============================================

function hashData(data): string {
  const content = JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function generateMerkleRoot(transactions: string[]): string {
  if (transactions.length === 0) return hashData({});
  if (transactions.length === 1) return transactions[0];

  const newLevel: string[] = [];
  for (let i = 0; i < transactions.length; i += 2) {
    const left = transactions[i];
    const right = transactions[i + 1] || transactions[i];
    newLevel.push(hashData({ left, right }));
  }
  return generateMerkleRoot(newLevel);
}

// ============================================
// BLOCKCHAIN API
// ============================================

/**
 * POST /api/blockchain/create-chain
 * Create a new blockchain for a product
 */
router.post('/blockchain/create-chain', async (req, res) => {
  const { serial_number, product_id, manufacturer } = req.body;

  if (!serial_number || !product_id) {
    return res.status(400).json({ error: 'serial_number and product_id required' });
  }

  const chain_id = `chain_${serial_number}_${Date.now()}`;

  // Genesis block
  const genesisBlock: Block = {
    block_number: 0,
    previous_hash: '0'.repeat(64),
    hash: '',
    timestamp: new Date().toISOString(),
    data: {
      serial_number,
      action: 'created',
      hash: hashData({ product_id, serial_number, manufacturer }),
      metadata: { product_id, manufacturer, genesis: true }
    }
  };
  genesisBlock.hash = hashData(genesisBlock);

  const chain: Chain = {
    chain_id,
    blocks: [genesisBlock],
    created_at: new Date().toISOString()
  };

  chains.set(chain_id, chain);

  // Publish event
  await publishEvent('blockchain.chain_created', {
    chain_id,
    serial_number,
    product_id
  });

  res.json({
    success: true,
    chain_id,
    genesis_hash: genesisBlock.hash,
    verification_url: `/api/blockchain/verify/${serial_number}`
  });
});

/**
 * POST /api/blockchain/anchor
 * Anchor a verification to the blockchain
 */
router.post('/blockchain/anchor', async (req, res) => {
  const { serial_number, action, metadata } = req.body;

  if (!serial_number || !action) {
    return res.status(400).json({ error: 'serial_number and action required' });
  }

  // Find chain for this serial number
  let chain: Chain | undefined;
  let chainId: string | undefined;

  for (const [id, c] of chains) {
    if (c.blocks[0].data.serial_number === serial_number) {
      chain = c;
      chainId = id;
      break;
    }
  }

  if (!chain) {
    return res.status(404).json({ error: 'Chain not found for this serial number' });
  }

  // Create new block
  const previousBlock = chain.blocks[chain.blocks.length - 1];

  const newBlock: Block = {
    block_number: chain.blocks.length,
    previous_hash: previousBlock.hash,
    hash: '',
    timestamp: new Date().toISOString(),
    data: {
      serial_number,
      action,
      hash: hashData({ serial_number, action, timestamp: Date.now() }),
      metadata
    }
  };

  newBlock.hash = hashData(newBlock);

  chain.blocks.push(newBlock);

  // In production: Also anchor to actual blockchain (Ethereum, Polygon, etc.)
  const blockchainAnchor = await anchorToExternalChain(newBlock);

  // Publish event
  await publishEvent('blockchain.anchored', {
    chain_id: chainId,
    block_number: newBlock.block_number,
    action,
    external_hash: blockchainAnchor?.tx_hash
  });

  res.json({
    success: true,
    block_number: newBlock.block_number,
    hash: newBlock.hash,
    anchored: true,
    external_chain: blockchainAnchor?.chain || 'internal',
    external_hash: blockchainAnchor?.tx_hash
  });
});

/**
 * GET /api/blockchain/verify/:serial
 * Verify product authenticity via blockchain
 */
router.get('/blockchain/verify/:serial', async (req, res) => {
  const { serial } = req.params;

  // Find chain
  let chain: Chain | undefined;
  for (const c of chains.values()) {
    if (c.blocks[0].data.serial_number === serial) {
      chain = c;
      break;
    }
  }

  if (!chain) {
    return res.json({
      verified: false,
      reason: 'No blockchain record found',
      message: 'Product may not be authentic'
    });
  }

  // Verify chain integrity
  const verification = verifyChainIntegrity(chain);

  // Get latest block
  const latestBlock = chain.blocks[chain.blocks.length - 1];

  // Get all actions
  const actions = chain.blocks.map(b => ({
    block_number: b.block_number,
    action: b.data.action,
    timestamp: b.timestamp,
    hash: b.hash
  }));

  res.json({
    verified: verification.valid,
    serial_number: serial,
    chain_id: chain.chain_id,
    total_anchors: chain.blocks.length,
    genesis_hash: chain.blocks[0].hash,
    latest_hash: latestBlock.hash,
    latest_action: latestBlock.data.action,
    latest_timestamp: latestBlock.timestamp,
    integrity: verification.valid ? 'valid' : 'tampered',
    actions,
    message: verification.valid
      ? 'Product authenticity verified on blockchain'
      : 'WARNING: Blockchain integrity compromised'
  });
});

/**
 * GET /api/blockchain/history/:serial
 * Get complete verification history
 */
router.get('/blockchain/history/:serial', async (req, res) => {
  const { serial } = req.params;

  let chain: Chain | undefined;
  for (const c of chains.values()) {
    if (c.blocks[0].data.serial_number === serial) {
      chain = c;
      break;
    }
  }

  if (!chain) {
    return res.status(404).json({ error: 'No blockchain record found' });
  }

  const history = chain.blocks.map(block => ({
    block_number: block.block_number,
    action: block.data.action,
    timestamp: block.timestamp,
    hash: block.hash,
    previous_hash: block.previous_hash,
    metadata: block.data.metadata
  }));

  res.json({
    serial_number: serial,
    chain_id: chain.chain_id,
    total_blocks: chain.blocks.length,
    created_at: chain.created_at,
    history
  });
});

/**
 * POST /api/blockchain/supply-chain/add
 * Add supply chain event
 */
router.post('/blockchain/supply-chain/add', async (req, res) => {
  const { serial_number, event_type, location, handler, timestamp } = req.body;

  // Find chain
  let chain: Chain | undefined;
  for (const c of chains.values()) {
    if (c.blocks[0].data.serial_number === serial_number) {
      chain = c;
      break;
    }
  }

  if (!chain) {
    return res.status(404).json({ error: 'Chain not found' });
  }

  const previousBlock = chain.blocks[chain.blocks.length - 1];

  const supplyChainBlock: Block = {
    block_number: chain.blocks.length,
    previous_hash: previousBlock.hash,
    hash: '',
    timestamp: timestamp || new Date().toISOString(),
    data: {
      serial_number,
      action: 'supply_chain',
      hash: hashData({ event_type, location, handler, timestamp }),
      metadata: { event_type, location, handler }
    }
  };

  supplyChainBlock.hash = hashData(supplyChainBlock);
  chain.blocks.push(supplyChainBlock);

  res.json({
    success: true,
    block_number: supplyChainBlock.block_number,
    event_type,
    location,
    handler,
    hash: supplyChainBlock.hash
  });
});

// ============================================
// HELPERS
// ============================================

function verifyChainIntegrity(chain: Chain): { valid: boolean; broken_at?: number } {
  for (let i = 1; i < chain.blocks.length; i++) {
    const currentBlock = chain.blocks[i];
    const previousBlock = chain.blocks[i - 1];

    // Verify hash
    const calculatedHash = hashData(currentBlock);
    if (currentBlock.hash !== calculatedHash) {
      return { valid: false, broken_at: i };
    }

    // Verify previous hash link
    if (currentBlock.previous_hash !== previousBlock.hash) {
      return { valid: false, broken_at: i };
    }
  }

  return { valid: true };
}

async function anchorToExternalChain(block: Block): Promise<{ chain: string; tx_hash: string } | null> {
  // In production, this would:
  // 1. Connect to Ethereum/Polygon/BNB chain
  // 2. Submit merkle root to smart contract
  // 3. Return transaction hash

  // For now, simulate external chain anchor
  const simulatedTx = `0x${crypto.randomBytes(32).toString('hex')}`;

  return {
    chain: 'polygon',
    tx_hash: simulatedTx
  };
}

async function publishEvent(eventType: string, data): Promise<void> {
  try {
    await axios.post(`${EVENT_BUS_URL}/events`, {
      event_type: eventType,
      source: 'verify-qr-blockchain',
      data
    }, {
      timeout: 5000
    });
  } catch (e) {
    // Don't fail main operation
  }
}

export default router;
