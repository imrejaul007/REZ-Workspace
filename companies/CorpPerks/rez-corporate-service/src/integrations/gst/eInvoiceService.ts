import axios from 'axios';
import { randomUUID } from 'crypto';
import { GSTInvoice, GSTR2BMatch, Company } from '../../models';
import { InvoiceStatus } from '../../types';
import { logger } from '../../config/logger';

export interface EInvoicePayload {
  Version: string;
  TranDtls: {
    TaxSch: string;
    SupTyp: string;
    RegRev: string;
    EcmGstin: string;
    IgstOnIntra: string;
  };
  DocDtls: {
    Typ: string;
    No: string;
    Dt: string;
  };
  SellerDtls: {
    Gstin: string;
    Nm: string;
    Addr1: string;
    Loc: string;
    Pin: string;
    State: string;
  };
  BuyerDtls: {
    Gstin: string;
    Nm: string;
    Addr1: string;
    Loc: string;
    Pin: string;
    State: string;
  };
  ItemList: Array<{
    SlNo: string;
    PrdDesc: string;
    HsnCd: string;
    Qty: string;
    Unit: string;
    UnitPrice: string;
    TotAmt: string;
    AssAmt: string;
    GstRt: string;
    IgstAmt: string;
   CgstAmt: string;
    SgstAmt: string;
    CesRt: string;
    CesAmt: string;
    TotalVal: string;
  }>;
  ValDtls: {
    AssVal: string;
    CgstVal: string;
    SgstVal: string;
    IgstVal: string;
    CesVal: string;
    Discount: string;
    RndOffAmt: string;
    TotInvVal: string;
  };
}

export interface IRNResponse {
  Irn: string;
  AckNo: number;
  AckDt: string;
  SignedInvoice: string;
  QRCodeImage: string;
  EinvoicePdfUrl: string;
  EwbNo?: string;
  EwbDt?: string;
}

export class GSTService {
  private baseUrl: string;
  private einvoiceToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.GST_EINVOICE_URL || 'https://einvoice.gst.gov.in';
  }

  async authenticate(company: any): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/Invoice/generateAuthToken`, {
        username: company.gstCredentials.username,
        password: company.gstCredentials.password,
        client_id: company.gstCredentials.clientId,
        client_secret: company.gstCredentials.clientSecret
      });

      this.einvoiceToken = response.data.access_token;
      logger.info('GST e-Invoice authentication successful');
    } catch (error: any) {
      logger.error('GST authentication failed', { error: error.message });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async generateIRN(invoice: any): Promise<IRNResponse> {
    const company = await Company.findById(invoice.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    if (!this.einvoiceToken) {
      await this.authenticate(company);
    }

    try {
      const payload = this.buildInvoicePayload(invoice);

      const response = await axios.post(
        `${this.baseUrl}/Invoice/v1.03/IRN`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.einvoiceToken}`,
            'Content-Type': 'application/json',
            'requestid': this.generateRequestId()
          }
        }
      );

      const result = response.data;

      // Update invoice with IRN
      await GSTInvoice.updateOne(
        { _id: invoice._id },
        {
          $set: {
            irn: result.Irn,
            einvoiceDate: new Date(result.AckDt),
            acknowledgmentNumber: result.AckNo.toString(),
            status: InvoiceStatus.SUBMITTED,
            qrCodeUrl: result.QRCodeImage,
            einvoicePdfUrl: result.EinvoicePdfUrl
          }
        }
      );

      logger.info('IRN generated', {
        invoiceId: invoice._id,
        irn: result.Irn,
        ackNo: result.AckNo
      });

      return {
        Irn: result.Irn,
        AckNo: result.AckNo,
        AckDt: result.AckDt,
        SignedInvoice: result.SignedInvoice,
        QRCodeImage: result.QRCodeImage,
        EinvoicePdfUrl: result.EinvoicePdfUrl,
        EwbNo: result.EwbNo,
        EwbDt: result.EwbDt
      };
    } catch (error: any) {
      logger.error('IRN generation failed', {
        error: error.message,
        invoiceId: invoice._id
      });

      await GSTInvoice.updateOne(
        { _id: invoice._id },
        { $set: { status: InvoiceStatus.REJECTED } }
      );

      throw new Error(`IRN generation failed: ${error.message}`);
    }
  }

  async cancelIRN(invoiceId: string, reason: string): Promise<void> {
    const invoice = await GSTInvoice.findById(invoiceId);
    if (!invoice || !invoice.irn) {
      throw new Error('Invoice not found or IRN not generated');
    }

    if (!this.einvoiceToken) {
      const company = await Company.findById(invoice.companyId);
      if (company) await this.authenticate(company);
    }

    try {
      await axios.post(
        `${this.baseUrl}/Invoice/v1.03/IRN/Cancel`,
        {
          Irn: invoice.irn,
          CnlRsn: reason,
          CnlRem: 'Duplicate invoice / Other'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.einvoiceToken}`,
            'Content-Type': 'application/json',
            'requestid': this.generateRequestId()
          }
        }
      );

      await GSTInvoice.updateOne(
        { _id: invoiceId },
        {
          $set: {
            status: InvoiceStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: reason
          }
        }
      );

      logger.info('IRN cancelled', { invoiceId, reason });
    } catch (error: any) {
      logger.error('IRN cancellation failed', { error: error.message });
      throw new Error(`IRN cancellation failed: ${error.message}`);
    }
  }

  async generateEwayBill(params: {
    invoiceId: string;
    distance: number;
    transporterId?: string;
    vehicleNumber?: string;
  }): Promise<string> {
    const invoice = await GSTInvoice.findById(params.invoiceId);
    if (!invoice || !invoice.irn) {
      throw new Error('Invoice not found or IRN not generated');
    }

    if (!this.einvoiceToken) {
      const company = await Company.findById(invoice.companyId);
      if (company) await this.authenticate(company);
    }

    try {
      const payload = {
        Irn: invoice.irn,
        Distance: params.distance,
        TransId: params.transporterId,
        TransName: '',
        TransType: '-road',
        VehicleNo: params.vehicleNumber,
        VehicleType: 'R'
      };

      const response = await axios.post(
        `${this.baseUrl}/Invoice/v1.03/Ewaybill`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.einvoiceToken}`,
            'Content-Type': 'application/json',
            'requestid': this.generateRequestId()
          }
        }
      );

      await GSTInvoice.updateOne(
        { _id: params.invoiceId },
        {
          $set: {
            ewayBillNumber: response.data.EwbNo,
            ewayBillDate: new Date()
          }
        }
      );

      logger.info('E-way bill generated', {
        invoiceId: params.invoiceId,
        ewayBillNo: response.data.EwbNo
      });

      return response.data.EwbNo;
    } catch (error: any) {
      logger.error('E-way bill generation failed', { error: error.message });
      throw new Error(`E-way bill generation failed: ${error.message}`);
    }
  }

  async reconcileGSTR2B(companyId: string, period: string): Promise<{
    matched: number;
    unmatched: number;
    totalITC: number;
  }> {
    // Fetch GSTR-2B data from GST portal
    const gstr2bData = await this.fetchGSTR2B(companyId, period);

    // Get our recorded purchases
    const purchases = await GSTInvoice.find({
      companyId,
      status: InvoiceStatus.SUBMITTED,
      'buyer.gstin': { $exists: true }
    });

    let matched = 0;
    let unmatched = 0;
    let totalITC = 0;

    for (const gstr2bItem of gstr2bData) {
      const match = purchases.find(p =>
        p.buyer.gstin === gstr2bItem.gstin &&
        p.items.some(item => {
          const itemTotal = item.rate * item.quantity;
          return Math.abs(itemTotal - gstr2bItem.taxableValue) < 1;
        })
      );

      const itcAmount = gstr2bItem.igst + gstr2bItem.cgst + gstr2bItem.sgst;

      if (match) {
        matched++;
        totalITC += itcAmount;

        await GSTR2BMatch.create({
          companyId,
          period,
          invoiceNumber: gstr2bItem.invoiceNumber,
          vendorGstin: gstr2bItem.gstin,
          taxableValue: gstr2bItem.taxableValue,
          igst: gstr2bItem.igst,
          cgst: gstr2bItem.cgst,
          sgst: gstr2bItem.sgst,
          itcClaimed: itcAmount,
          matchedPurchaseId: match._id,
          matchedAt: new Date(),
          status: 'matched'
        });
      } else {
        unmatched++;

        await GSTR2BMatch.create({
          companyId,
          period,
          invoiceNumber: gstr2bItem.invoiceNumber,
          vendorGstin: gstr2bItem.gstin,
          taxableValue: gstr2bItem.taxableValue,
          igst: gstr2bItem.igst,
          cgst: gstr2bItem.cgst,
          sgst: gstr2bItem.sgst,
          itcClaimed: itcAmount,
          status: 'unmatched'
        });
      }
    }

    logger.info('GSTR-2B reconciliation completed', {
      companyId,
      period,
      matched,
      unmatched,
      totalITC
    });

    return { matched, unmatched, totalITC };
  }

  private async fetchGSTR2B(companyId: string, period: string): Promise<any[]> {
    // In production, this would call the GST portal API
    // For now, return empty array as we need real credentials
    logger.warn('GSTR-2B fetch not implemented - needs real API');
    return [];
  }

  private buildInvoicePayload(invoice: any): EInvoicePayload {
    const firstItem = invoice.items[0];

    return {
      Version: '1.03',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: invoice.reverseCharge ? 'RCM' : 'B2B',
        RegRev: invoice.reverseCharge ? 'Y' : 'N',
        EcmGstin: '',
        IgstOnIntra: 'N'
      },
      DocDtls: {
        Typ: 'INV',
        No: invoice.invoiceNumber,
        Dt: new Date(invoice.createdAt).toISOString().split('T')[0]
      },
      SellerDtls: {
        Gstin: invoice.seller.gstin,
        Nm: invoice.seller.name,
        Addr1: invoice.seller.address,
        Loc: invoice.seller.city,
        Pin: invoice.seller.pincode,
        State: invoice.seller.state
      },
      BuyerDtls: {
        Gstin: invoice.buyer.gstin || '',
        Nm: invoice.buyer.name,
        Addr1: invoice.buyer.address,
        Loc: invoice.buyer.city,
        Pin: invoice.buyer.pincode,
        State: invoice.buyer.state
      },
      ItemList: invoice.items.map((item: any, index: number) => ({
        SlNo: (index + 1).toString(),
        PrdDesc: item.description,
        HsnCd: item.hsnCode,
        Qty: item.quantity.toString(),
        Unit: item.unit,
        UnitPrice: item.rate.toString(),
        TotAmt: item.total.toString(),
        AssAmt: item.taxableValue.toString(),
        GstRt: ((item.cgstRate + item.sgstRate + item.igstRate) / 2).toString(),
        IgstAmt: item.igstAmount.toString(),
        CgstAmt: item.cgstAmount.toString(),
        SgstAmt: item.sgstAmount.toString(),
        CesRt: '0',
        CesAmt: '0',
        TotalVal: item.total.toString()
      })),
      ValDtls: {
        AssVal: invoice.totalTaxableValue.toString(),
        CgstVal: invoice.totalCgst.toString(),
        SgstVal: invoice.totalSgst.toString(),
        IgstVal: invoice.totalIgst.toString(),
        CesVal: '0',
        Discount: '0',
        RndOffAmt: '0',
        TotInvVal: invoice.grandTotal.toString()
      }
    };
  }

  private generateRequestId(): string {
    return `REQ${Date.now()}${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  }

  async createInvoice(params: {
    companyId: string;
    invoiceNumber: string;
    seller: {
      gstin: string;
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    buyer: {
      gstin?: string;
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    items: Array<{
      description: string;
      hsnCode: string;
      quantity: number;
      unit?: string;
      rate: number;
      taxableValue: number;
      cgstRate?: number;
      sgstRate?: number;
      igstRate?: number;
    }>;
    reverseCharge?: boolean;
  }): Promise<any> {
    // Calculate totals
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const processedItems = params.items.map(item => {
      const cgstAmount = item.cgstRate ? (item.taxableValue * item.cgstRate / 100) : 0;
      const sgstAmount = item.sgstRate ? (item.taxableValue * item.sgstRate / 100) : 0;
      const igstAmount = item.igstRate ? (item.taxableValue * item.igstRate / 100) : 0;
      const itemTotal = item.taxableValue + cgstAmount + sgstAmount + igstAmount;

      totalTaxableValue += item.taxableValue;
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;
      totalIgst += igstAmount;
      totalTax += cgstAmount + sgstAmount + igstAmount;
      grandTotal += itemTotal;

      return {
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit || 'NOS',
        rate: item.rate,
        taxableValue: item.taxableValue,
        cgstRate: item.cgstRate || 0,
        cgstAmount: cgstAmount,
        sgstRate: item.sgstRate || 0,
        sgstAmount: sgstAmount,
        igstRate: item.igstRate || 0,
        igstAmount: igstAmount,
        total: itemTotal
      };
    });

    const invoice = new GSTInvoice({
      companyId: params.companyId,
      invoiceNumber: params.invoiceNumber,
      status: InvoiceStatus.DRAFT,
      seller: params.seller,
      buyer: params.buyer,
      items: processedItems,
      totalTaxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      grandTotal,
      placeOfSupply: params.seller.state,
      reverseCharge: params.reverseCharge || false
    });

    await invoice.save();

    logger.info('Invoice created', {
      invoiceId: invoice._id,
      invoiceNumber: params.invoiceNumber
    });

    return invoice;
  }
}

export const gstService = new GSTService();
