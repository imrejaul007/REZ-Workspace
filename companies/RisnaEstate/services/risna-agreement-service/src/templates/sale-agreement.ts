import { IAgreement } from '../models/agreement.model.js';
import { config } from '../config/index.js';

export interface SaleAgreementData {
  agreement: IAgreement;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  agreementDateFormatted: string;
  possessionDateFormatted: string;
  totalPriceFormatted: string;
  saleConsiderationFormatted: string;
  tokenAmountFormatted: string;
  stampDutyFormatted: string;
  gstFormatted: string;
  registrationAmountFormatted: string;
  parkingPriceFormatted: string;
}

export const saleAgreementTemplate = {
  /**
   * Format currency in Indian format
   */
  formatCurrency: (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  },

  /**
   * Format date in Indian format
   */
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  },

  /**
   * Prepare template data
   */
  prepareData: (agreement: IAgreement): SaleAgreementData => {
    return {
      agreement,
      company: {
        name: config.company.name,
        address: config.company.address,
        phone: config.company.phone,
        email: config.company.email,
        website: config.company.website
      },
      agreementDateFormatted: saleAgreementTemplate.formatDate(agreement.agreementDate),
      possessionDateFormatted: saleAgreementTemplate.formatDate(agreement.possessionDate),
      totalPriceFormatted: saleAgreementTemplate.formatCurrency(agreement.totalPrice),
      saleConsiderationFormatted: saleAgreementTemplate.formatCurrency(agreement.saleConsideration),
      tokenAmountFormatted: saleAgreementTemplate.formatCurrency(agreement.tokenAmount),
      stampDutyFormatted: saleAgreementTemplate.formatCurrency(agreement.stampDuty),
      gstFormatted: saleAgreementTemplate.formatCurrency(agreement.gst),
      registrationAmountFormatted: saleAgreementTemplate.formatCurrency(agreement.registrationAmount),
      parkingPriceFormatted: saleAgreementTemplate.formatCurrency(agreement.parkingPrice)
    };
  },

  /**
   * Get default terms for sale agreement
   */
  getDefaultTerms: (): string[] => {
    return [
      'The Seller agrees to sell and the Buyer agrees to purchase the property described herein at the consideration mentioned in this Agreement.',
      'The Buyer shall pay the total sale consideration as per the payment schedule attached to this Agreement.',
      'The Seller confirms that the property is free from all encumbrances, liens, charges, and disputes of any nature.',
      'The Buyer shall pay all applicable stamp duty and registration charges for the transfer of this property.',
      'The possession of the property shall be delivered to the Buyer on the date specified in this Agreement, subject to receipt of full payment.',
      'Both parties agree to execute all necessary documents and appear before the concerned authorities for registration of this Agreement.',
      'The Seller shall provide all original documents related to the property at the time of registration.',
      'If either party defaults, the other party shall have the right to take legal action as per the terms herein.',
      'This Agreement shall be binding on the heirs, successors, legal representatives, and assigns of both parties.',
      'Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts in the concerned city.'
    ];
  },

  /**
   * Get property type label
   */
  getPropertyTypeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      'apartment': 'Apartment',
      'villa': 'Villa/Bungalow',
      'plot': 'Plot/Land',
      'commercial': 'Commercial Property',
      'land': 'Land'
    };
    return labels[type] || type;
  },

  /**
   * Generate full agreement text
   */
  generateText: (data: SaleAgreementData): string => {
    const { agreement } = data;

    let text = `
${data.company.name.toUpperCase()}
${data.company.address}
Phone: ${data.company.phone} | Email: ${data.company.email}

================================================================================
 SALE AGREEMENT
================================================================================

Agreement ID: ${agreement.agreementId}
Date: ${data.agreementDateFormatted}

This Sale Agreement ("Agreement") is made and executed on ${data.agreementDateFormatted} at ${data.company.address},

BETWEEN

BUYER: ${agreement.buyerId}
(Hereafter referred to as "the Buyer", which expression shall include his heirs, successors, legal representatives, and assigns)

AND

SELLER: ${agreement.sellerId}
(Hereafter referred to as "the Seller", which expression shall include his heirs, successors, legal representatives, and assigns)

AND

BROKER: ${agreement.brokerId}
(Hereafter referred to as "the Broker")

================================================================================
 PROPERTY DETAILS
================================================================================

Property Type: ${saleAgreementTemplate.getPropertyTypeLabel(agreement.propertyType)}
Property Address: ${agreement.propertyAddress}
Property Area: ${agreement.propertyArea} ${agreement.propertyAreaUnit.toUpperCase()}

================================================================================
                          PRICE AND PAYMENT DETAILS
================================================================================

Total Sale Consideration: ${data.saleConsiderationFormatted}
Total Price (including all charges): ${data.totalPriceFormatted}

Breakdown:
- Token Amount: ${data.tokenAmountFormatted}
- Stamp Duty: ${data.stampDutyFormatted}
- GST: ${data.gstFormatted}
- Registration Amount: ${data.registrationAmountFormatted}
${agreement.parkingIncluded ? `- Parking Price: ${data.parkingPriceFormatted}` : ''}

Expected Possession Date: ${data.possessionDateFormatted}

================================================================================
                          TERMS AND CONDITIONS
================================================================================
`;

    const terms = agreement.terms
      ? agreement.terms.split('\n').filter(t => t.trim())
      : saleAgreementTemplate.getDefaultTerms();

    terms.forEach((term, index) => {
      text += `\n${index + 1}. ${term}`;
    });

    if (agreement.specialConditions) {
      text += `\n\n================================================================================
                          SPECIAL CONDITIONS
================================================================================\n`;

      const specialConditions = agreement.specialConditions.split('\n').filter(t => t.trim());
      specialConditions.forEach((condition, index) => {
        text += `\n${index + 1}. ${condition}`;
      });
    }

    text += `
================================================================================
                              SIGNATURES
================================================================================

BUYER:
Signature: ${agreement.buyerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.buyerSignedAt ? saleAgreementTemplate.formatDate(agreement.buyerSignedAt) : 'Pending'}

SELLER:
Signature: ${agreement.sellerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.sellerSignedAt ? saleAgreementTemplate.formatDate(agreement.sellerSignedAt) : 'Pending'}

WITNESS 1:
Signature: ${agreement.witness1Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness1SignedAt ? saleAgreementTemplate.formatDate(agreement.witness1SignedAt) : 'Pending'}

WITNESS 2:
Signature: ${agreement.witness2Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness2SignedAt ? saleAgreementTemplate.formatDate(agreement.witness2SignedAt) : 'Pending'}

================================================================================
                    Generated by ${data.company.name} Agreement Service
================================================================================
`;

    return text;
  }
};

export default saleAgreementTemplate;