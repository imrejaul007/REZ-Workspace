/**
 * Billing AI Agent
 * NEIGHBORAI - Society Management AI Operating System
 * Port: 4920
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface MaintenanceBill {
  id: string;
  residentId: string;
  flatNo: string;
  wing: string;
  period: string;
  baseAmount: number;
  parkingCharges: number;
  utilityCharges: number;
  penalties: number;
  adjustments: number;
  totalAmount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  paidDate?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  residentId: string;
  billId?: string;
  amount: number;
  method: 'cash' | 'upi' | 'card' | 'bank';
  reference?: string;
  date: string;
  receiptNo: string;
}

class BillingAI {
  private bills: Map<string, MaintenanceBill> = new Map();
  private payments: Map<string, Payment> = new Map();

  async generateBill(data: {
    residentId: string;
    flatNo: string;
    wing: string;
    period: string;
    baseAmount: number;
    parkingCharges?: number;
    utilityCharges?: number;
  }): Promise<MaintenanceBill> {
    const parkingCharges = data.parkingCharges || 0;
    const utilityCharges = data.utilityCharges || 0;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const bill: MaintenanceBill = {
      id: uuidv4(),
      residentId: data.residentId,
      flatNo: data.flatNo,
      wing: data.wing,
      period: data.period,
      baseAmount: data.baseAmount,
      parkingCharges,
      utilityCharges,
      penalties: 0,
      adjustments: 0,
      totalAmount: data.baseAmount + parkingCharges + utilityCharges,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };

    this.bills.set(bill.id, bill);
    return bill;
  }

  async getBillById(id: string): Promise<MaintenanceBill | undefined> {
    return this.bills.get(id);
  }

  async getBillsByResident(residentId: string): Promise<MaintenanceBill[]> {
    return Array.from(this.bills.values())
      .filter(b => b.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async recordPayment(billId: string, amount: number, method: Payment['method'], reference?: string): Promise<MaintenanceBill | undefined> {
    const bill = this.bills.get(billId);
    if (!bill) return undefined;

    const payment: Payment = {
      id: uuidv4(),
      residentId: bill.residentId,
      billId,
      amount,
      method,
      reference,
      date: new Date().toISOString(),
      receiptNo: `RCP-${Date.now()}`,
    };

    this.payments.set(payment.id, payment);

    bill.paidAmount += amount;
    if (bill.paidAmount >= bill.totalAmount) {
      bill.status = 'paid';
      bill.paidDate = new Date().toISOString();
    } else {
      bill.status = 'partial';
    }

    this.bills.set(billId, bill);
    return bill;
  }

  async sendReminder(billId: string): Promise<{ recipient: string; message: string } | undefined> {
    const bill = this.bills.get(billId);
    if (!bill) return undefined;

    const outstanding = bill.totalAmount - bill.paidAmount;
    return {
      recipient: bill.flatNo,
      message: `Reminder: Maintenance bill of ₹${outstanding.toLocaleString()} is due by ${bill.dueDate}. Please pay at the earliest to avoid penalties.`,
    };
  }

  async applyPenalty(billId: string, daysOverdue: number): Promise<MaintenanceBill | undefined> {
    const bill = this.bills.get(billId);
    if (!bill || bill.status === 'paid') return bill;

    const penaltyRate = 0.02; // 2% per month
    const penalty = Math.round(bill.totalAmount * penaltyRate * (daysOverdue / 30));
    bill.penalties = penalty;
    bill.totalAmount = bill.baseAmount + bill.parkingCharges + bill.utilityCharges + bill.penalties - bill.adjustments;
    bill.status = 'overdue';

    this.bills.set(billId, bill);
    return bill;
  }

  async getOutstandingByWing(wing: string): Promise<{ flatNo: string; amount: number; daysOverdue: number }[]> {
    const outstanding: { flatNo: string; amount: number; daysOverdue: number }[] = [];

    for (const bill of this.bills.values()) {
      if (bill.wing === wing && bill.status !== 'paid') {
        const dueDate = new Date(bill.dueDate);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        outstanding.push({
          flatNo: bill.flatNo,
          amount: bill.totalAmount - bill.paidAmount,
          daysOverdue: Math.max(0, daysOverdue),
        });
      }
    }

    return outstanding.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  async getCollectionStats(period: string): Promise<{
    totalBilled: number;
    totalCollected: number;
    collectionRate: number;
    pendingBills: number;
    overdueAmount: number;
  }> {
    const periodBills = Array.from(this.bills.values()).filter(b => b.period === period);
    const totalBilled = periodBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCollected = periodBills.reduce((sum, b) => sum + b.paidAmount, 0);

    return {
      totalBilled,
      totalCollected,
      collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      pendingBills: periodBills.filter(b => b.status === 'pending' || b.status === 'partial').length,
      overdueAmount: periodBills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0),
    };
  }
}

const billingAI = new BillingAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'neighborai-billing-ai', port: 4920 });
});

app.post('/api/bills', async (req: Request, res: Response) => {
  try {
    const bill = await billingAI.generateBill(req.body);
    res.status(201).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate bill' });
  }
});

app.get('/api/bills/:id', async (req: Request, res: Response) => {
  try {
    const bill = await billingAI.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bill' });
  }
});

app.get('/api/bills/resident/:residentId', async (req: Request, res: Response) => {
  try {
    const bills = await billingAI.getBillsByResident(req.params.residentId);
    res.json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bills' });
  }
});

app.post('/api/bills/:id/payment', async (req: Request, res: Response) => {
  try {
    const { amount, method, reference } = req.body;
    const bill = await billingAI.recordPayment(req.params.id, amount, method, reference);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.get('/api/bills/:id/reminder', async (req: Request, res: Response) => {
  try {
    const reminder = await billingAI.sendReminder(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Bill not found' });
    res.json({ success: true, ...reminder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

app.get('/api/outstanding/:wing', async (req: Request, res: Response) => {
  try {
    const outstanding = await billingAI.getOutstandingByWing(req.params.wing);
    res.json({ success: true, outstanding });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get outstanding' });
  }
});

app.get('/api/stats/:period', async (req: Request, res: Response) => {
  try {
    const stats = await billingAI.getCollectionStats(req.params.period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

const PORT = 4920;
app.listen(PORT, () => {
  console.log(`💰 Billing AI running on port ${PORT}`);
  console.log(`🏢 NEIGHBORAI - Society Management AI`);
});

export default app;