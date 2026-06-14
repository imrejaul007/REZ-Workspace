import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { MerchantLoan, LoanPurpose } from '../models/MerchantLoan';

const router = Router();

// Interest rates by risk rating
const INTEREST_RATES = {
  low: 12,
  medium: 15,
  high: 21,
  very_high: 27
};

// Maximum loan by business type
const MAX_LOAN_MULTIPLES = {
  inventory: 3,
  equipment: 5,
  marketing: 2,
  expansion: 4,
  payroll: 2,
  emergency: 1
};

// Validation schemas
const applySchema = z.object({
  merchantId: z.string().min(1),
  loanAmount: z.number().min(10000).max(5000000),
  purpose: z.enum(['inventory', 'equipment', 'marketing', 'expansion', 'payroll', 'emergency']),
  tenure: z.number().min(1).max(36),
  repaymentCycle: z.enum(['daily', 'weekly', 'monthly']).optional(),
  businessType: z.string().min(1),
  monthlyRevenue: z.number().min(0),
  yearsInBusiness: z.number().min(0),
  employees: z.number().min(1).optional(),
  bankAccount: z.object({
    accountNumber: z.string().min(9).max(18),
    ifsc: z.string().min(8).max(11),
    bankName: z.string().min(1),
    accountHolder: z.string().min(1)
  }),
  documents: z.array(z.object({
    type: z.enum(['gst', 'pan', 'bank_statement', 'shop_license', 'address_proof']),
    url: z.string().url()
  })).min(1)
});

// Calculate eligibility score
async function calculateEligibility(
  monthlyRevenue: number,
  yearsInBusiness: number,
  existingLoans: number,
  missedPayments: number
): Promise<{ score: number; maxLoan: number; riskRating: 'low' | 'medium' | 'high' | 'very_high' }> {

  let score = 50;

  // Revenue factor (up to +20)
  if (monthlyRevenue > 500000) score += 20;
  else if (monthlyRevenue > 200000) score += 15;
  else if (monthlyRevenue > 100000) score += 10;
  else if (monthlyRevenue > 50000) score += 5;

  // Business tenure (up to +15)
  if (yearsInBusiness >= 5) score += 15;
  else if (yearsInBusiness >= 3) score += 10;
  else if (yearsInBusiness >= 1) score += 5;

  // Existing loan penalty (up to -20)
  score -= Math.min(existingLoans * 5, 20);

  // Missed payment penalty (up to -30)
  score -= Math.min(missedPayments * 10, 30);

  // Calculate max loan amount
  const maxLoan = Math.min(
    monthlyRevenue * MAX_LOAN_MULTIPLES.inventory * 6,
    5000000
  );

  // Determine risk rating
  let riskRating: 'low' | 'medium' | 'high' | 'very_high' = 'medium';
  if (score >= 70) riskRating = 'low';
  else if (score >= 50) riskRating = 'medium';
  else if (score >= 30) riskRating = 'high';
  else riskRating = 'very_high';

  return { score: Math.max(0, Math.min(100, score)), maxLoan, riskRating };
}

// Apply for loan
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const data = applySchema.parse(req.body);

    // Check existing loans
    const existingLoans = await MerchantLoan.countDocuments({
      merchantId: data.merchantId,
      status: { $in: ['active', 'disbursed'] }
    });

    const existingMissed = await MerchantLoan.aggregate([
      { $match: { merchantId: data.merchantId } },
      { $group: { _id: null, total: { $sum: '$missedPayments' } }
    ]);

    const missedPayments = existingMissed[0]?.total || 0;

    // Calculate eligibility
    const { score, maxLoan, riskRating } = await calculateEligibility(
      data.monthlyRevenue,
      data.yearsInBusiness,
      existingLoans,
      missedPayments
    );

    // Check if eligible
    if (data.loanAmount > maxLoan) {
      return res.status(400).json({
        error: `Loan amount exceeds eligibility. Max: ₹${maxLoan.toLocaleString()}`
      });
    }

    // Calculate interest rate
    const interestRate = INTEREST_RATES[riskRating];

    // Processing fee (1-2%)
    const processingFee = Math.ceil(data.loanAmount * (riskRating === 'low' ? 0.01 : 0.02));

    // Generate repayment schedule
    const repayments = [];
    const interestRateMonthly = interestRate / 12 / 100;
    const emiAmount = Math.ceil(
      (data.loanAmount * interestRateMonthly * Math.pow(1 + interestRateMonthly, data.tenure)) /
      (Math.pow(1 + interestRateMonthly, data.tenure) - 1)
    );

    let outstandingAmount = data.loanAmount;

    for (let i = 1; i <= data.tenure; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      // Daily repayment
      if (data.repaymentCycle === 'daily') {
        dueDate.setDate(dueDate.getDate() + (i * 30));
      }
      // Weekly repayment
      else if (data.repaymentCycle === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7));
      }

      const interestPortion = Math.ceil(outstandingAmount * interestRateMonthly);
      const principalPortion = data.repaymentCycle === 'daily'
        ? Math.ceil(emiAmount / 30)
        : data.repaymentCycle === 'weekly'
        ? Math.ceil(emiAmount / 4)
        : emiAmount;

      repayments.push({
        dueDate,
        amount: data.repaymentCycle === 'daily'
          ? Math.ceil(emiAmount / 30)
          : data.repaymentCycle === 'weekly'
          ? Math.ceil(emiAmount / 4)
          : emiAmount,
        principal: principalPortion,
        interest: interestPortion,
        status: 'pending'
      });

      outstandingAmount -= principalPortion;
    }

    const loan = new MerchantLoan({
      ...data,
      repaymentCycle: data.repaymentCycle || 'monthly',
      riskScore: score,
      riskRating,
      interestRate,
      processingFee,
      eligibilityScore: score,
      maxEligibility: maxLoan,
      repayments
    });

    await loan.save();

    res.status(201).json({
      loanId: loan._id,
      status: 'pending',
      eligibilityScore: score,
      riskRating,
      interestRate,
      processingFee,
      maxLoan,
      repaymentSchedule: repayments.length,
      firstRepaymentDate: repayments[0]?.dueDate,
      message: 'Application submitted successfully'
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get loan status
router.get('/:loanId', async (req: Request, res: Response) => {
  try {
    const loan = await MerchantLoan.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({
      loanId: loan._id,
      status: loan.status,
      loanAmount: loan.loanAmount,
      approvedAmount: loan.approvedAmount,
      disbursedAmount: loan.disbursedAmount,
      interestRate: loan.interestRate,
      tenure: loan.tenure,
      repaymentCycle: loan.repaymentCycle,
      outstandingAmount: loan.outstandingAmount,
      nextRepaymentDate: loan.nextRepaymentDate,
      missedPayments: loan.missedPayments,
      repayments: loan.repayments.map(r => ({
        dueDate: r.dueDate,
        amount: r.amount,
        status: r.status,
        paidAt: r.paidAt
      }))
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get merchant loans
router.get('/merchant/:merchantId', async (req: Request, res: Response) => {
  try {
    const loans = await MerchantLoan.find({ merchantId: req.params.merchantId })
      .sort({ createdAt: -1 });

    res.json({
      loans: loans.map(loan => ({
        loanId: loan._id,
        status: loan.status,
        loanAmount: loan.loanAmount,
        purpose: loan.purpose,
        interestRate: loan.interestRate,
        outstandingAmount: loan.outstandingAmount,
        missedPayments: loan.missedPayments,
        appliedAt: loan.appliedAt
      }))
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Make repayment
router.post('/:loanId/repay', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const loan = await MerchantLoan.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'active' && loan.status !== 'disbursed') {
      return res.status(400).json({ error: 'Loan not active' });
    }

    // Find next pending repayment
    const nextRepayment = loan.repayments.find(r => r.status === 'pending');

    if (!nextRepayment) {
      loan.status = 'repaid';
      loan.completedAt = new Date();
      await loan.save();

      return res.json({
        success: true,
        status: 'repaid',
        message: 'Loan fully repaid!'
      });
    }

    // Process payment
    nextRepayment.status = 'paid';
    nextRepayment.paidAt = new Date();
    nextRepayment.transactionId = `LOAN_REP_${Date.now()}`;
    nextRepayment.amountPaid = amount || nextRepayment.amount;

    loan.outstandingAmount -= nextRepayment.amountPaid;

    // Update next repayment date
    const upcomingRepayment = loan.repayments.find(r => r.status === 'pending');
    loan.nextRepaymentDate = upcomingRepayment?.dueDate;

    await loan.save();

    res.json({
      success: true,
      repaymentId: nextRepayment.transactionId,
      amountPaid: nextRepayment.amountPaid,
      outstandingAmount: loan.outstandingAmount,
      nextRepaymentDate: loan.nextRepaymentDate
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
