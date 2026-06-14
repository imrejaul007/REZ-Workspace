import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { RFQ, IRFQ } from '../models/RFQ';
import { Quote, IQuote, IQuoteItem } from '../models/Quote';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RFQFilters {
  status?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  storeId?: string;
  isPublic?: boolean;
}

export interface QuoteFilters {
  rfqId?: string;
  supplierId?: string;
  status?: string;
}

export interface QuoteComparison {
  quoteId: string;
  quoteNumber: string;
  supplierId: string;
  supplierName: string;
  items: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isLowest: boolean;
  }[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  deliveryDays: number;
  paymentTerms?: string;
  validUntil?: Date;
  status: string;
  isLowestTotal: boolean;
  rank: number;
}

export interface MerchantRFQStats {
  totalRFQs: number;
  openRFQs: number;
  closedRFQs: number;
  awardedRFQs: number;
  totalQuotesReceived: number;
  avgQuotesPerRFQ: number;
  byCategory: {
    category: string;
    count: number;
  }[];
}

// ── RFQ Number Generation ───────────────────────────────────────────────────────

/**
 * Generate the next RFQ number in format RFQ-YYYYMMDD-XXXX
 */
export async function generateRFQNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RFQ-${dateStr}-`;

  const lastRFQ = await RFQ.findOne({ rfqNumber: { $regex: `^${prefix}` } })
    .sort({ rfqNumber: -1 })
    .lean()
    .exec();

  let nextSeq = 1;
  if (lastRFQ) {
    const lastSeq = parseInt(lastRFQ.rfqNumber.slice(prefix.length), 10);
    nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ── Quote Number Generation ─────────────────────────────────────────────────────

/**
 * Generate the next quote number in format QT-YYYYMMDD-XXXX
 */
export async function generateQuoteNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `QT-${dateStr}-`;

  const lastQuote = await Quote.findOne({ quoteNumber: { $regex: `^${prefix}` } })
    .sort({ quoteNumber: -1 })
    .lean()
    .exec();

  let nextSeq = 1;
  if (lastQuote) {
    const lastSeq = parseInt(lastQuote.quoteNumber.slice(prefix.length), 10);
    nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ── RFQ CRUD Operations ────────────────────────────────────────────────────────

/**
 * Create a new RFQ
 */
export async function createRFQ(
  merchantId: string,
  data: {
    title: string;
    description?: string;
    category: string;
    items: Array<{
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      specifications?: Record<string, unknown>;
    }>;
    requiredByDate?: Date;
    storeId?: string;
    isPublic?: boolean;
    invitedSuppliers?: string[];
    notes?: string;
  },
): Promise<IRFQ> {
  const rfqNumber = await generateRFQNumber();

  const rfq = new RFQ({
    rfqNumber,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    storeId: data.storeId ? new mongoose.Types.ObjectId(data.storeId) : undefined,
    title: data.title,
    description: data.description,
    category: data.category,
    items: data.items,
    requiredByDate: data.requiredByDate,
    isPublic: data.isPublic ?? false,
    invitedSuppliers: data.invitedSuppliers?.map((id) => new mongoose.Types.ObjectId(id)) ?? [],
    notes: data.notes,
    status: 'draft',
    quotesReceived: 0,
  });

  await rfq.save();
  logger.info('[rfqService] RFQ created', { rfqId: rfq._id, rfqNumber, merchantId });

  return rfq;
}

/**
 * Update an RFQ (only allowed when draft)
 */
export async function updateRFQ(
  rfqId: string,
  merchantId: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    items: Array<{
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      specifications?: Record<string, unknown>;
    }>;
    requiredByDate: Date;
    isPublic: boolean;
    invitedSuppliers: string[];
    notes: string;
  }>,
): Promise<IRFQ | null> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: 'draft',
  });

  if (!rfq) {
    return null;
  }

  // Update allowed fields
  if (data.title !== undefined) rfq.title = data.title;
  if (data.description !== undefined) rfq.description = data.description;
  if (data.category !== undefined) rfq.category = data.category as IRFQ['category'];
  if (data.items !== undefined) rfq.items = data.items;
  if (data.requiredByDate !== undefined) rfq.requiredByDate = data.requiredByDate;
  if (data.isPublic !== undefined) rfq.isPublic = data.isPublic;
  if (data.invitedSuppliers !== undefined) {
    rfq.invitedSuppliers = data.invitedSuppliers.map((id) => new mongoose.Types.ObjectId(id));
  }
  if (data.notes !== undefined) rfq.notes = data.notes;

  await rfq.save();
  logger.info('[rfqService] RFQ updated', { rfqId, merchantId });

  return rfq;
}

/**
 * Soft delete an RFQ (only allowed when draft)
 */
export async function deleteRFQ(rfqId: string, merchantId: string): Promise<boolean> {
  const rfq = await RFQ.findOneAndUpdate(
    {
      _id: rfqId,
      merchantId: new mongoose.Types.ObjectId(merchantId),
      status: 'draft',
    },
    { $set: { deletedAt: new Date() } },
    { new: true },
  ).lean();

  if (!rfq) {
    return false;
  }

  logger.info('[rfqService] RFQ soft deleted', { rfqId, merchantId });
  return true;
}

/**
 * Get RFQ by ID with quotes count
 */
export async function getRFQById(
  rfqId: string,
  merchantId: string,
): Promise<(IRFQ & { quotesCount: number }) | null> {
  const [rfq, quotesCount] = await Promise.all([
    RFQ.findOne({
      _id: rfqId,
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }).lean(),
    Quote.countDocuments({
      rfqId: new mongoose.Types.ObjectId(rfqId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }),
  ]);

  if (!rfq) {
    return null;
  }

  return { ...rfq, quotesCount } as IRFQ & { quotesCount: number };
}

/**
 * List RFQs with filters and pagination
 */
export async function listRFQs(
  merchantId: string,
  filters: RFQFilters,
  page: number = 1,
  limit: number = 20,
): Promise<{ items: IRFQ[]; total: number; page: number; limit: number; totalPages: number }> {
  const query: FilterQuery<IRFQ> = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    deletedAt: { $exists: false },
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      (query.createdAt as Record<string, Date>).$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (query.createdAt as Record<string, Date>).$lte = filters.dateTo;
    }
  }

  if (filters.storeId) {
    query.storeId = new mongoose.Types.ObjectId(filters.storeId);
  }

  if (filters.isPublic !== undefined) {
    query.isPublic = filters.isPublic;
  }

  const [items, total] = await Promise.all([
    RFQ.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    RFQ.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ── RFQ Status Transitions ────────────────────────────────────────────────────

/**
 * Open an RFQ for quotes (draft -> open)
 */
export async function openRFQ(rfqId: string, merchantId: string): Promise<IRFQ | null> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: 'draft',
  });

  if (!rfq) {
    return null;
  }

  if (!rfq.canOpen()) {
    throw new Error('RFQ cannot be opened: must have at least one item');
  }

  rfq.status = 'open';
  await rfq.save();

  logger.info('[rfqService] RFQ opened', { rfqId, merchantId });
  return rfq;
}

/**
 * Close an RFQ (open -> closed)
 */
export async function closeRFQ(rfqId: string, merchantId: string): Promise<IRFQ | null> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: 'open',
  });

  if (!rfq) {
    return null;
  }

  rfq.status = 'closed';
  await rfq.save();

  logger.info('[rfqService] RFQ closed', { rfqId, merchantId });
  return rfq;
}

/**
 * Cancel an RFQ
 */
export async function cancelRFQ(rfqId: string, merchantId: string): Promise<IRFQ | null> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $nin: ['awarded', 'cancelled'] },
  });

  if (!rfq) {
    return null;
  }

  if (!rfq.canCancel()) {
    throw new Error('RFQ cannot be cancelled');
  }

  rfq.status = 'cancelled';
  await rfq.save();

  logger.info('[rfqService] RFQ cancelled', { rfqId, merchantId });
  return rfq;
}

// ── Supplier Invitation ────────────────────────────────────────────────────────

/**
 * Invite suppliers to an RFQ
 */
export async function inviteSuppliers(
  rfqId: string,
  merchantId: string,
  supplierIds: string[],
): Promise<{ added: number; alreadyInvited: number; invalid: number }> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
  });

  if (!rfq) {
    throw new Error('RFQ not found');
  }

  if (rfq.status !== 'draft' && rfq.status !== 'open') {
    throw new Error('Cannot invite suppliers to closed, awarded, or cancelled RFQ');
  }

  // Validate suppliers exist
  const validSuppliers = await Supplier.find({
    _id: { $in: supplierIds.map((id) => new mongoose.Types.ObjectId(id)) },
    isDeleted: false,
  }).lean();

  const validSupplierIds = new Set(validSuppliers.map((s) => s._id.toString()));

  // Get currently invited suppliers
  const currentInvitedIds = new Set(rfq.invitedSuppliers.map((id) => id.toString()));

  // Categorize suppliers
  let added = 0;
  let alreadyInvited = 0;
  let invalid = 0;

  const newInvitations: mongoose.Types.ObjectId[] = [];

  for (const supplierId of supplierIds) {
    if (!validSupplierIds.has(supplierId)) {
      invalid++;
      continue;
    }
    if (currentInvitedIds.has(supplierId)) {
      alreadyInvited++;
      continue;
    }
    newInvitations.push(new mongoose.Types.ObjectId(supplierId));
    added++;
  }

  if (newInvitations.length > 0) {
    rfq.invitedSuppliers.push(...newInvitations);
    await rfq.save();
  }

  logger.info('[rfqService] Suppliers invited to RFQ', {
    rfqId,
    added,
    alreadyInvited,
    invalid,
  });

  return { added, alreadyInvited, invalid };
}

// ── Quote Operations ──────────────────────────────────────────────────────────

/**
 * Submit a quote (supplier-facing)
 */
export async function submitQuote(
  rfqId: string,
  supplierId: string,
  data: {
    items: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      tax?: number;
      notes?: string;
    }>;
    validUntil?: Date;
    deliveryDays: number;
    paymentTerms?: string;
    notes?: string;
  },
): Promise<IQuote> {
  // Find the RFQ
  const rfq = await RFQ.findById(rfqId).lean();
  if (!rfq) {
    throw new Error('RFQ not found');
  }

  // Validate supplier can quote
  const supplierOid = new mongoose.Types.ObjectId(supplierId);
  if (!rfq.canSupplierQuote(supplierOid)) {
    if (rfq.status !== 'open') {
      throw new Error('RFQ is not open for quotes');
    }
    if (!rfq.isPublic && !rfq.invitedSuppliers.some((id) => id.equals(supplierOid))) {
      throw new Error('Supplier is not invited to this RFQ');
    }
  }

  // Check if supplier already submitted a quote
  const existingQuote = await Quote.findOne({
    rfqId: new mongoose.Types.ObjectId(rfqId),
    supplierId: supplierOid,
  });

  if (existingQuote) {
    throw new Error('Supplier has already submitted a quote for this RFQ');
  }

  // Calculate totals
  const { items, subtotal, discount, taxAmount, totalAmount } = Quote.calculateTotals(data.items);

  // Generate quote number
  const quoteNumber = await generateQuoteNumber();

  // Create the quote
  const quote = new Quote({
    quoteNumber,
    rfqId: new mongoose.Types.ObjectId(rfqId),
    supplierId: supplierOid,
    merchantId: rfq.merchantId,
    status: 'submitted',
    items,
    subtotal,
    discount,
    taxAmount,
    totalAmount,
    validUntil: data.validUntil,
    deliveryDays: data.deliveryDays,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    submittedAt: new Date(),
  });

  await quote.save();

  // Update RFQ quotes received count
  await RFQ.findByIdAndUpdate(rfqId, { $inc: { quotesReceived: 1 } });

  logger.info('[rfqService] Quote submitted', {
    quoteId: quote._id,
    quoteNumber,
    rfqId,
    supplierId,
  });

  return quote;
}

/**
 * List quotes for an RFQ
 */
export async function getRFQQuotes(
  rfqId: string,
  merchantId: string,
  filters: QuoteFilters = {},
): Promise<IQuote[]> {
  const query: FilterQuery<IQuote> = {
    rfqId: new mongoose.Types.ObjectId(rfqId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.supplierId) {
    query.supplierId = new mongoose.Types.ObjectId(filters.supplierId);
  }

  const quotes = await Quote.find(query).sort({ totalAmount: 1 }).lean();

  // Attach supplier names
  const supplierIds = [...new Set(quotes.map((q) => q.supplierId.toString()))];
  const suppliers = await Supplier.find({
    _id: { $in: supplierIds },
  }).lean();

  const supplierMap = new Map(suppliers.map((s) => [s._id.toString(), s]));

  return quotes.map((q) => ({
    ...q,
    supplierName: supplierMap.get(q.supplierId.toString())?.name || 'Unknown',
  })) as IQuote[];
}

/**
 * Get quote by ID
 */
export async function getQuoteById(
  quoteId: string,
  merchantId: string,
): Promise<IQuote | null> {
  return Quote.findOne({
    _id: quoteId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
  }).lean();
}

/**
 * Revise a quote
 */
export async function reviseQuote(
  quoteId: string,
  supplierId: string,
  data: {
    items: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      tax?: number;
      notes?: string;
    }>;
    validUntil?: Date;
    deliveryDays: number;
    paymentTerms?: string;
    notes?: string;
    reason: string;
  },
): Promise<IQuote | null> {
  const quote = await Quote.findOne({
    _id: quoteId,
    supplierId: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['submitted', 'revised'] },
  });

  if (!quote) {
    return null;
  }

  if (!quote.canRevise()) {
    throw new Error('Quote cannot be revised in current status');
  }

  // Calculate new totals
  const { items, subtotal, discount, taxAmount, totalAmount } = Quote.calculateTotals(data.items);

  // Save to revision history
  quote.revisionHistory.push({
    revisedAt: new Date(),
    items: quote.items.map((item) => ({ ...item.toObject() } as IQuoteItem)),
    totalAmount: quote.totalAmount,
    reason: data.reason,
  });

  // Update quote
  quote.items = items;
  quote.subtotal = subtotal;
  quote.discount = discount;
  quote.taxAmount = taxAmount;
  quote.totalAmount = totalAmount;
  quote.validUntil = data.validUntil;
  quote.deliveryDays = data.deliveryDays;
  quote.paymentTerms = data.paymentTerms;
  quote.notes = data.notes;
  quote.status = 'revised';

  await quote.save();

  logger.info('[rfqService] Quote revised', { quoteId, supplierId });

  return quote;
}

/**
 * Withdraw a quote
 */
export async function withdrawQuote(
  quoteId: string,
  supplierId: string,
): Promise<IQuote | null> {
  const quote = await Quote.findOne({
    _id: quoteId,
    supplierId: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['submitted', 'revised'] },
  });

  if (!quote) {
    return null;
  }

  quote.status = 'withdrawn';
  quote.withdrawnAt = new Date();

  await quote.save();

  // Update RFQ quotes received count
  await RFQ.findByIdAndUpdate(quote.rfqId, { $inc: { quotesReceived: -1 } });

  logger.info('[rfqService] Quote withdrawn', { quoteId, supplierId });

  return quote;
}

/**
 * Accept a quote
 */
export async function acceptQuote(
  quoteId: string,
  merchantId: string,
): Promise<IQuote | null> {
  const quote = await Quote.findOne({
    _id: quoteId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['submitted', 'revised'] },
  });

  if (!quote) {
    return null;
  }

  if (!quote.canAccept()) {
    throw new Error('Quote cannot be accepted in current status');
  }

  quote.status = 'accepted';
  await quote.save();

  logger.info('[rfqService] Quote accepted', { quoteId, merchantId });

  return quote;
}

/**
 * Reject a quote
 */
export async function rejectQuote(
  quoteId: string,
  merchantId: string,
): Promise<IQuote | null> {
  const quote = await Quote.findOne({
    _id: quoteId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['submitted', 'revised'] },
  });

  if (!quote) {
    return null;
  }

  if (!quote.canReject()) {
    throw new Error('Quote cannot be rejected in current status');
  }

  quote.status = 'rejected';
  await quote.save();

  logger.info('[rfqService] Quote rejected', { quoteId, merchantId });

  return quote;
}

// ── Quote Comparison ────────────────────────────────────────────────────────────

/**
 * Get the best (lowest total) quote for an RFQ
 */
export async function getBestQuote(
  rfqId: string,
  merchantId: string,
): Promise<IQuote | null> {
  return Quote.findOne({
    rfqId: new mongoose.Types.ObjectId(rfqId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['submitted', 'revised', 'accepted'] },
  })
    .sort({ totalAmount: 1 })
    .lean();
}

/**
 * Compare all quotes for an RFQ side-by-side
 */
export async function compareQuotes(
  rfqId: string,
  merchantId: string,
): Promise<QuoteComparison[]> {
  const rfq = await RFQ.findById(rfqId).lean();
  if (!rfq) {
    throw new Error('RFQ not found');
  }

  const quotes = await Quote.find({
    rfqId: new mongoose.Types.ObjectId(rfqId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['submitted', 'revised', 'accepted'] },
  })
    .sort({ totalAmount: 1 })
    .lean();

  if (quotes.length === 0) {
    return [];
  }

  // Get supplier names
  const supplierIds = [...new Set(quotes.map((q) => q.supplierId.toString()))];
  const suppliers = await Supplier.find({
    _id: { $in: supplierIds },
  }).lean();
  const supplierMap = new Map(suppliers.map((s) => [s._id.toString(), s]));

  // Find lowest prices per item
  const itemNames = rfq.items.map((item) => item.itemName);
  const lowestPrices: Record<string, number> = {};

  for (const itemName of itemNames) {
    const matchingQuotes = quotes.filter((q) =>
      q.items.some((item) => item.itemName === itemName),
    );
    if (matchingQuotes.length > 0) {
      const prices = matchingQuotes.map((q) => {
        const item = q.items.find((i) => i.itemName === itemName);
        return item ? item.unitPrice : Infinity;
      });
      lowestPrices[itemName] = Math.min(...prices);
    }
  }

  // Build comparison matrix
  const lowestTotal = quotes[0].totalAmount;

  return quotes.map((quote, index) => {
    const supplier = supplierMap.get(quote.supplierId.toString());

    return {
      quoteId: quote._id.toString(),
      quoteNumber: quote.quoteNumber,
      supplierId: quote.supplierId.toString(),
      supplierName: supplier?.name || 'Unknown',
      items: quote.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        isLowest: lowestPrices[item.itemName] === item.unitPrice,
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      deliveryDays: quote.deliveryDays,
      paymentTerms: quote.paymentTerms,
      validUntil: quote.validUntil ?? undefined,
      status: quote.status,
      isLowestTotal: quote.totalAmount === lowestTotal,
      rank: index + 1,
    };
  });
}

// ── Award & PO Creation ────────────────────────────────────────────────────────

/**
 * Award RFQ to a supplier and create a draft purchase order
 */
export async function awardAndCreatePO(
  rfqId: string,
  quoteId: string,
  merchantId: string,
  session?: ClientSession,
): Promise<{ rfq: IRFQ; purchaseOrder: unknown }> {
  const rfq = await RFQ.findOne({
    _id: rfqId,
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['open', 'closed'] },
  });

  if (!rfq) {
    throw new Error('RFQ not found or cannot be awarded');
  }

  const quote = await Quote.findOne({
    _id: quoteId,
    rfqId: new mongoose.Types.ObjectId(rfqId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['submitted', 'revised', 'accepted'] },
  });

  if (!quote) {
    throw new Error('Quote not found or cannot be awarded');
  }

  // Get supplier info
  const supplier = await Supplier.findById(quote.supplierId).lean();
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Generate PO number
  const poPrefix = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-`;
  const lastPO = await PurchaseOrder.findOne({ poNumber: { $regex: `^${poPrefix}` } })
    .sort({ poNumber: -1 })
    .lean();
  let poSeq = 1;
  if (lastPO) {
    const lastSeq = parseInt(lastPO.poNumber.slice(poPrefix.length), 10);
    poSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }
  const poNumber = `${poPrefix}${String(poSeq).padStart(4, '0')}`;

  // Map quote items to PO items
  const poItems = quote.items.map((item) => ({
    name: item.itemName,
    description: item.notes || '',
    quantity: item.quantity,
    unit: '', // Quote items don't have unit field
    price: item.unitPrice,
    total: item.total,
  }));

  // Create draft purchase order
  const purchaseOrder = new PurchaseOrder({
    merchantId: rfq.merchantId,
    poNumber,
    supplier: {
      _id: supplier._id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      gstNumber: supplier.gstNumber,
    },
    items: poItems,
    status: 'draft',
    notes: `Created from RFQ ${rfq.rfqNumber} - Quote ${quote.quoteNumber}`,
    paymentTerms: quote.paymentTerms,
    expectedDeliveryDate: new Date(Date.now() + quote.deliveryDays * 24 * 60 * 60 * 1000),
    shippingAddress: supplier.address,
    reference: rfq.rfqNumber,
  });

  // Update RFQ and quote statuses
  rfq.status = 'awarded';
  rfq.awardedSupplierId = quote.supplierId;
  rfq.awardedQuoteId = quote._id;

  quote.status = 'accepted';

  // Save all within transaction
  if (session) {
    await purchaseOrder.save({ session });
    await rfq.save({ session });
    await quote.save({ session });
  } else {
    await purchaseOrder.save();
    await rfq.save();
    await quote.save();
  }

  logger.info('[rfqService] RFQ awarded and PO created', {
    rfqId,
    rfqNumber: rfq.rfqNumber,
    quoteId,
    quoteNumber: quote.quoteNumber,
    poNumber,
    supplierId: quote.supplierId,
    merchantId,
  });

  return { rfq, purchaseOrder };
}

// ── Supplier Dashboard ─────────────────────────────────────────────────────────

/**
 * Get all quotes for a supplier
 */
export async function getSupplierQuotes(
  supplierId: string,
  filters: { status?: string; dateFrom?: Date; dateTo?: Date } = {},
): Promise<IQuote[]> {
  const query: FilterQuery<IQuote> = {
    supplierId: new mongoose.Types.ObjectId(supplierId),
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.submittedAt = {};
    if (filters.dateFrom) {
      (query.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (query.submittedAt as Record<string, Date>).$lte = filters.dateTo;
    }
  }

  return Quote.find(query).sort({ submittedAt: -1 }).lean();
}

/**
 * Get merchant RFQ statistics for dashboard
 */
export async function getMerchantRFQStats(merchantId: string): Promise<MerchantRFQStats> {
  const merchantOid = new mongoose.Types.ObjectId(merchantId);

  const [stats, categoryStats] = await Promise.all([
    RFQ.aggregate([
      { $match: { merchantId: merchantOid, deletedAt: { $exists: false } } },
      {
        $group: {
          _id: null,
          totalRFQs: { $sum: 1 },
          openRFQs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          closedRFQs: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          awardedRFQs: { $sum: { $cond: [{ $eq: ['$status', 'awarded'] }, 1, 0] } },
          totalQuotesReceived: { $sum: '$quotesReceived' },
        },
      },
    ]),
    RFQ.aggregate([
      { $match: { merchantId: merchantOid, deletedAt: { $exists: false } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const data = stats[0] || {
    totalRFQs: 0,
    openRFQs: 0,
    closedRFQs: 0,
    awardedRFQs: 0,
    totalQuotesReceived: 0,
  };

  const totalRFQs = data.totalRFQs || 0;

  return {
    totalRFQs,
    openRFQs: data.openRFQs || 0,
    closedRFQs: data.closedRFQs || 0,
    awardedRFQs: data.awardedRFQs || 0,
    totalQuotesReceived: data.totalQuotesReceived || 0,
    avgQuotesPerRFQ: totalRFQs > 0 ? Math.round((data.totalQuotesReceived || 0) / totalRFQs * 10) / 10 : 0,
    byCategory: categoryStats.map((c) => ({
      category: c._id,
      count: c.count,
    })),
  };
}

// ── Public RFQ Browsing (for suppliers) ────────────────────────────────────────

/**
 * List public open RFQs (for supplier browsing)
 */
export async function listPublicRFQs(
  filters: { category?: string; dateFrom?: Date; dateTo?: Date } = {},
  page: number = 1,
  limit: number = 20,
): Promise<{ items: IRFQ[]; total: number; page: number; limit: number; totalPages: number }> {
  const query: FilterQuery<IRFQ> = {
    isPublic: true,
    status: 'open',
    deletedAt: { $exists: false },
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.requiredByDate = {};
    if (filters.dateFrom) {
      (query.requiredByDate as Record<string, Date>).$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (query.requiredByDate as Record<string, Date>).$lte = filters.dateTo;
    }
  }

  const [items, total] = await Promise.all([
    RFQ.find(query)
      .select('-invitedSuppliers -awardedSupplierId -awardedQuoteId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RFQ.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
