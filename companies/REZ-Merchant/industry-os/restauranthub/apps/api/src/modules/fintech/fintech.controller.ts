/**
 * FintechController — working capital endpoints.
 *
 * All routes require a valid REZ merchant JWT.
 * Raw merchant financial data is never returned — only aggregated scores,
 * tiers, and eligibility decisions.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { FintechService } from './fintech.service';
import { CreditApplicationDto, SupplierPaymentDto } from './fintech.dto';
import { REZ_MERCHANT_STRATEGY } from '../auth/rez-bridge/rez-merchant.strategy';
import type { RezValidatedPrincipal } from '../auth/rez-bridge/rez-merchant.strategy';

function getMerchantId(req: Request): string {
  const principal = req.user as RezValidatedPrincipal;
  const id = principal?.rezMerchantId ?? principal?.rezUserId;
  if (!id) throw new BadRequestException('Merchant ID could not be resolved from token');
  return id;
}

@Controller('fintech')
@UseGuards(AuthGuard(REZ_MERCHANT_STRATEGY))
export class FintechController {
  constructor(private readonly fintechService: FintechService) {}

  /**
   * GET /fintech/credit-profile
   * Returns the merchant's REZ-derived credit score, tier, credit line,
   * and the factors that drove the score.
   */
  @Get('credit-profile')
  async getCreditProfile(@Req() req: Request) {
    const merchantId = getMerchantId(req);
    return this.fintechService.getMerchantCreditProfile(merchantId);
  }

  /**
   * POST /fintech/apply
   * Submits a working capital / supplier credit application.
   * Validates eligibility before forwarding to the NBFC partner.
   */
  @Post('apply')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async apply(@Body() dto: CreditApplicationDto, @Req() req: Request) {
    const merchantId = getMerchantId(req);
    return this.fintechService.applyForSupplierCredit(merchantId, dto);
  }

  /**
   * GET /fintech/application/:id
   * Returns the current status of a submitted credit application.
   */
  @Get('application/:id')
  async getApplicationStatus(@Param('id') applicationId: string) {
    if (!applicationId || !/^[a-zA-Z0-9_-]{1,64}$/.test(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }
    return this.fintechService.getApplicationStatus(applicationId);
  }

  /**
   * GET /fintech/credit-history
   * Returns the merchant's credit-type wallet transactions.
   */
  @Get('credit-history')
  async getCreditHistory(@Req() req: Request) {
    const merchantId = getMerchantId(req);
    return this.fintechService.getCreditHistory(merchantId);
  }

  /**
   * POST /fintech/supplier-payment
   * Pays a supplier invoice using the merchant's active credit line.
   * Currently a stub — NBFC disbursement will be wired when partner goes live.
   */
  @Post('supplier-payment')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async paySupplier(@Body() dto: SupplierPaymentDto, @Req() req: Request) {
    const merchantId = getMerchantId(req);
    return this.fintechService.paySupplierWithCredit(merchantId, dto);
  }
}
