import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getCreditBalance(userId: string): Promise<number> {
    const latestTransaction = await this.prisma.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return latestTransaction?.balance || 0;
  }

  async getCreditHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              totalAmount: true
            }
          }
        }
      }),
      this.prisma.creditTransaction.count({
        where: { userId }
      })
    ]);

    return {
      transactions,
      currentBalance: await this.getCreditBalance(userId),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    };
  }

  async addCredit(userId: string, amount: number, description: string): Promise<any> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    // FIX: Use serializable transaction to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Lock and get the latest transaction atomically
      const result = await tx.$queryRaw<Array<{ balance: number }>>`
        SELECT balance FROM "CreditTransaction"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
        FOR UPDATE
      `;

      const currentBalance = result[0]?.balance || 0;
      const newBalance = currentBalance + amount;

      return tx.creditTransaction.create({
        data: {
          userId,
          type: 'credit',
          amount,
          balance: newBalance,
          description
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  }

  async deductCredit(userId: string, amount: number, description: string, orderId?: string): Promise<any> {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    // FIX: Use serializable transaction with row-level locking to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Lock the latest row to serialize concurrent deductions
      const result = await tx.$queryRaw<Array<{ balance: number }>>`
        SELECT balance FROM "CreditTransaction"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
        FOR UPDATE
      `;

      const currentBalance = result[0]?.balance || 0;

      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient credit balance');
      }

      const newBalance = currentBalance - amount;

      return tx.creditTransaction.create({
        data: {
          userId,
          type: 'debit',
          amount,
          balance: newBalance,
          description,
          orderId
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  }

  async calculateCreditEligibility(userId: string): Promise<{
    eligible: boolean;
    maxCreditLimit: number;
    currentCredit: number;
    availableCredit: number;
    factors: string[];
  }> {
    // Get user's order history
    const orderHistory = await this.prisma.marketplaceOrder.findMany({
      where: { 
        userId,
        status: 'delivered'
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 orders
    });

    const totalOrderValue = orderHistory.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderCount = orderHistory.length;
    const avgOrderValue = orderCount > 0 ? totalOrderValue / orderCount : 0;

    // Get restaurant info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true
      }
    });

    // Calculate credit eligibility factors
    const factors: string[] = [];
    let maxCreditLimit = 0;

    // Base credit based on order history
    if (totalOrderValue > 50000) {
      maxCreditLimit += 5000;
      factors.push('High order volume (₹50k+)');
    } else if (totalOrderValue > 20000) {
      maxCreditLimit += 3000;
      factors.push('Medium order volume (₹20k+)');
    } else if (totalOrderValue > 5000) {
      maxCreditLimit += 1000;
      factors.push('Regular customer (₹5k+)');
    }

    // Verification bonus
    if (user?.restaurant?.isVerified) {
      maxCreditLimit += 2000;
      factors.push('Verified restaurant');
    }

    // GST registration bonus
    if (user?.restaurant?.gstNumber) {
      maxCreditLimit += 1500;
      factors.push('GST registered');
    }

    // Account age bonus (simplified - in real app would use actual account creation date)
    if (orderCount >= 10) {
      maxCreditLimit += 1000;
      factors.push('Long-term customer (10+ orders)');
    }

    const currentCredit = await this.getCreditBalance(userId);
    const availableCredit = Math.max(0, maxCreditLimit - currentCredit);

    return {
      eligible: maxCreditLimit > 0,
      maxCreditLimit,
      currentCredit,
      availableCredit,
      factors
    };
  }

  async requestCreditIncrease(userId: string, requestedAmount: number, reason: string) {
    const eligibility = await this.calculateCreditEligibility(userId);

    if (requestedAmount > eligibility.availableCredit) {
      throw new BadRequestException(
        `Requested amount (₹${requestedAmount}) exceeds available credit (₹${eligibility.availableCredit})`
      );
    }

    // In a real application, this would create a request for manual review
    // For now, we'll auto-approve small amounts
    if (requestedAmount <= 1000) {
      await this.addCredit(
        userId, 
        requestedAmount, 
        `Auto-approved credit increase: ${reason}`
      );

      return {
        approved: true,
        amount: requestedAmount,
        message: 'Credit increase auto-approved'
      };
    }

    return {
      approved: false,
      amount: requestedAmount,
      message: 'Credit increase request submitted for manual review',
      estimatedReviewTime: '1-2 business days'
    };
  }

  async processPaymentToCredit(userId: string, paymentAmount: number, paymentId: string) {
    // Verify payment (in real app, this would integrate with payment gateway)
    const conversionRate = 1; // 1:1 conversion for now
    const creditAmount = paymentAmount * conversionRate;

    const transaction = await this.addCredit(
      userId,
      creditAmount,
      `Credit purchased via payment ${paymentId}`
    );

    return {
      paymentId,
      creditAmount,
      conversionRate,
      transaction
    };
  }
}