import { Router, Request, Response, NextFunction } from 'express';
import { LoyaltyProgram, LoyaltyAccount, LoyaltyTransaction, Reward } from '../models/Loyalty';
import { logger } from '../utils/logger';

const router = Router();

// ==================== PROGRAMS ====================

router.get('/programs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = await LoyaltyProgram.find({ isActive: true });
    res.json({ success: true, data: programs });
  } catch (error) { next(error); }
});

router.post('/programs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = new LoyaltyProgram(req.body);
    await program.save();
    logger.info('Loyalty program created', { programId: program._id });
    res.status(201).json({ success: true, data: program });
  } catch (error) { next(error); }
});

// ==================== ACCOUNTS ====================

router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, programId } = req.query;
    const query: any = {};
    if (customerId) query.customerId = customerId;
    if (programId) query.programId = programId;

    const accounts = await LoyaltyAccount.find(query)
      .populate('customerId', 'name phone customerId')
      .populate('programId', 'name type');
    res.json({ success: true, data: accounts });
  } catch (error) { next(error); }
});

router.get('/accounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await LoyaltyAccount.findById(req.params.id)
      .populate('customerId', 'name phone customerId')
      .populate('programId', 'name type tiers');
    if (!account) { res.status(404).json({ success: false, error: 'Account not found' }); return; }
    res.json({ success: true, data: account });
  } catch (error) { next(error); }
});

router.get('/accounts/customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await LoyaltyAccount.findOne({ customerId: req.params.customerId })
      .populate('programId', 'name type tiers earningRules redemptionRules');
    if (!account) { res.status(404).json({ success: false, error: 'Account not found' }); return; }
    res.json({ success: true, data: account });
  } catch (error) { next(error); }
});

router.post('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await LoyaltyAccount.findOne({ customerId: req.body.customerId });
    if (existing) { res.status(409).json({ success: false, error: 'Account already exists' }); return; }

    const account = new LoyaltyAccount(req.body);
    await account.save();
    logger.info('Loyalty account created', { accountId: account._id });
    res.status(201).json({ success: true, data: account });
  } catch (error) { next(error); }
});

router.patch('/accounts/:id/points', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points, type, description, referenceId, referenceType } = req.body;
    const account = await LoyaltyAccount.findById(req.params.id);
    if (!account) { res.status(404).json({ success: false, error: 'Account not found' }); return; }

    const transaction = new LoyaltyTransaction({
      accountId: account._id,
      customerId: account.customerId,
      type,
      points,
      balance: type === 'earn' ? account.points + points : account.points - points,
      source: 'manual',
      description: description || '',
      referenceId,
      referenceType
    });

    if (type === 'earn') {
      account.points += points;
      account.lifetimePoints += points;
    } else if (type === 'redeem') {
      if (account.points < points) { res.status(400).json({ success: false, error: 'Insufficient points' }); return; }
      account.points -= points;
    }

    account.lastActivityAt = new Date();
    await Promise.all([account.save(), transaction.save()]);
    logger.info('Points updated', { accountId: account._id, type, points });

    res.json({ success: true, data: account, transaction });
  } catch (error) { next(error); }
});

// ==================== TRANSACTIONS ====================

router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, accountId, type } = req.query;
    const query: any = {};
    if (customerId) query.customerId = customerId;
    if (accountId) query.accountId = accountId;
    if (type) query.type = type;

    const transactions = await LoyaltyTransaction.find(query)
      .populate('accountId', 'points')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

router.get('/accounts/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await LoyaltyTransaction.find({ accountId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

// ==================== REWARDS ====================

router.get('/rewards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { programId } = req.query;
    const query: any = { isActive: true };
    if (programId) query.programId = programId;

    const rewards = await Reward.find(query)
      .populate('programId', 'name');
    res.json({ success: true, data: rewards });
  } catch (error) { next(error); }
});

router.post('/rewards/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, rewardId } = req.body;

    const [account, reward] = await Promise.all([
      LoyaltyAccount.findById(accountId),
      Reward.findById(rewardId)
    ]);

    if (!account) { res.status(404).json({ success: false, error: 'Account not found' }); return; }
    if (!reward) { res.status(404).json({ success: false, error: 'Reward not found' }); return; }
    if (account.points < reward.pointsCost) { res.status(400).json({ success: false, error: 'Insufficient points' }); return; }

    account.points -= reward.pointsCost;
    account.lastActivityAt = new Date();

    const transaction = new LoyaltyTransaction({
      accountId: account._id,
      customerId: account.customerId,
      type: 'redeem',
      points: -reward.pointsCost,
      balance: account.points,
      source: 'promotion',
      referenceId: reward._id,
      referenceType: 'reward',
      description: `Redeemed: ${reward.name}`
    });

    await Promise.all([account.save(), transaction.save()]);
    logger.info('Reward redeemed', { accountId: account._id, reward: reward.name });

    res.json({ success: true, data: { account, reward }, transaction });
  } catch (error) { next(error); }
});

export default router;