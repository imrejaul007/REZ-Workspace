import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MerchantLoansService } from './merchant-loans.service';

/**
 * Submit loan application DTO
 */
class SubmitLoanDto {
  requestedAmount: number;
  purpose: string;
  tenorMonths: number;
}

/**
 * Merchant Loans Controller
 *
 * REST endpoints for merchant loans:
 * - Generate financial profiles
 * - Calculate credit scores
 * - Get loan recommendations
 * - Submit applications to RidZa
 */
@Controller('merchant-loans')
@UseGuards(JwtAuthGuard)
export class MerchantLoansController {
  constructor(private readonly merchantLoansService: MerchantLoansService) {}

  // ==========================================
  // FINANCIAL PROFILE
  // ==========================================

  /**
   * Generate financial profile from POS data
   */
  @Get('profile/:restaurantId')
  async getFinancialProfile(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    const profile = await this.merchantLoansService.generateFinancialProfile(restaurantId, period);
    return {
      success: true,
      profile,
    };
  }

  // ==========================================
  // CREDIT SCORE
  // ==========================================

  /**
   * Get credit score (derived from profile)
   */
  @Post('credit-score')
  @HttpCode(HttpStatus.OK)
  async getCreditScore(
    @Body()
    body: {
      restaurantId: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const period = body.startDate && body.endDate ? {
      start: new Date(body.startDate),
      end: new Date(body.endDate),
    } : undefined;

    const profile = await this.merchantLoansService.generateFinancialProfile(
      body.restaurantId,
      period
    );

    return {
      success: true,
      creditScore: profile.creditScore,
      creditTier: profile.creditTier,
      factors: profile.factors,
    };
  }

  // ==========================================
  // LOAN RECOMMENDATIONS
  // ==========================================

  /**
   * Get loan recommendation
   */
  @Get('recommendation/:restaurantId')
  async getLoanRecommendation(
    @Param('restaurantId') restaurantId: string,
    @Query('requestedAmount') requestedAmount?: string,
    @Query('purpose') purpose?: string
  ) {
    const recommendation = await this.merchantLoansService.getLoanRecommendation(
      restaurantId,
      requestedAmount ? parseFloat(requestedAmount) : undefined,
      purpose
    );

    return {
      success: true,
      recommendation,
    };
  }

  // ==========================================
  // LOAN APPLICATION
  // ==========================================

  /**
   * Submit loan application to RidZa
   */
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  async submitLoanApplication(@Body() dto: SubmitLoanDto & { restaurantId: string }) {
    const result = await this.merchantLoansService.submitLoanApplication(dto.restaurantId, {
      requestedAmount: dto.requestedAmount,
      purpose: dto.purpose,
      tenorMonths: dto.tenorMonths,
    });

    return result;
  }

  // ==========================================
  // REPORTS
  // ==========================================

  /**
   * Export financial report
   */
  @Get('report/:restaurantId')
  async exportFinancialReport(
    @Param('restaurantId') restaurantId: string,
    @Query('format') format?: 'json' | 'pdf'
  ) {
    const report = await this.merchantLoansService.exportFinancialReport(
      restaurantId,
      format || 'json'
    );

    return {
      success: true,
      ...report,
    };
  }
}
