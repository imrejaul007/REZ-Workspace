import { Router, Request, Response } from 'express';
import { Warranty, WarrantyClaim } from '../models/Warranty';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Warranties
router.get('/warranties', async (req: Request, res: Response) => {
  try {
    const { customerId, productId, status } = req.query;
    const query: Record<string, any> = {};
    if (customerId) query.customerId = customerId;
    if (productId) query.productId = productId;
    if (status) query.status = status;

    const warranties = await Warranty.find(query).sort({ warrantyEndDate: 1 });
    res.json({ success: true, data: warranties, count: warranties.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch warranties' } });
  }
});

router.get('/warranties/:id', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ success: false, error: { message: 'Warranty not found' } });
    res.json({ success: true, data: warranty });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch warranty' } });
  }
});

router.get('/warranties/verify/:serialNumber', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findOne({ serialNumber: req.params.serialNumber });
    if (!warranty) return res.status(404).json({ success: false, error: { message: 'Warranty not found' } });

    const now = new Date();
    const isActive = warranty.warrantyEndDate > now && warranty.status === 'active';

    res.json({
      success: true,
      data: {
        isActive,
        productName: warranty.productName,
        warrantyEndDate: warranty.warrantyEndDate,
        warrantyType: warranty.warrantyType,
        status: warranty.status,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to verify warranty' } });
  }
});

router.post('/warranties', async (req: Request, res: Response) => {
  try {
    const { productId, productName, productSku, customerId, customerName, customerPhone, customerEmail, serialNumber, purchaseDate, warrantyPeriod, warrantyType, purchasePrice, invoiceUrl } = req.body;

    const warrantyStartDate = new Date(purchaseDate);
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyPeriod);

    const warranty = await Warranty.create({
      productId, productName, productSku, customerId, customerName, customerPhone,
      customerEmail, serialNumber, purchaseDate, warrantyStartDate, warrantyEndDate,
      warrantyPeriod, warrantyType: warrantyType || 'manufacturer', purchasePrice,
      invoiceUrl, status: 'active', claims: [],
    });

    res.status(201).json({ success: true, data: warranty });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Claims
router.post('/claims', async (req: Request, res: Response) => {
  try {
    const { warrantyId, issue, description, customerPhone } = req.body;

    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) return res.status(404).json({ success: false, error: { message: 'Warranty not found' } });

    const now = new Date();
    if (warranty.warrantyEndDate < now || warranty.status !== 'active') {
      return res.status(400).json({ success: false, error: { message: 'Warranty is not active' } });
    }

    const claimId = 'CLM' + uuidv4().slice(0, 8).toUpperCase();

    const claim = await WarrantyClaim.create({
      warrantyId, claimId, issue, description, customerPhone, status: 'pending',
    });

    warranty.claims.push({
      claimId, claimDate: new Date(), issue, description,
      status: 'pending',
    });
    await warranty.save();

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await WarrantyClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch claim' } });
  }
});

router.patch('/claims/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, resolution } = req.body;

    const claim = await WarrantyClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });

    claim.status = status;
    if (resolution) claim.resolution = resolution;
    if (status === 'resolved') claim.resolvedAt = new Date();
    await claim.save();

    if (status === 'approved' || status === 'resolved') {
      await Warranty.updateOne(
        { _id: claim.warrantyId, 'claims.claimId': claim.claimId },
        { $set: { 'claims.$.status': status, 'claims.$.resolution': resolution, 'claims.$.resolutionDate': new Date() } }
      );
    }

    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/warranties/:id/claims', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ success: false, error: { message: 'Warranty not found' } });
    res.json({ success: true, data: warranty.claims });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch claims' } });
  }
});

// Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const [total, active, expired, claimed] = await Promise.all([
      Warranty.countDocuments(),
      Warranty.countDocuments({ status: 'active', warrantyEndDate: { $gt: now } }),
      Warranty.countDocuments({ warrantyEndDate: { $lt: now } }),
      Warranty.countDocuments({ status: 'claimed' }),
    ]);

    res.json({ success: true, data: { total, active, expired, claimed } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats' } });
  }
});

export default router;
