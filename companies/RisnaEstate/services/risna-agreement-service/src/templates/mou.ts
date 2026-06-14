import { IAgreement } from '../models/agreement.model.js';
import { config } from '../config/index.js';

export interface MOUData {
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
  tokenAmountFormatted: string;
}

export const mouTemplate = {
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
  prepareData: (agreement: IAgreement): MOUData => {
    return {
      agreement,
      company: {
        name: config.company.name,
        address: config.company.address,
        phone: config.company.phone,
        email: config.company.email,
        website: config.company.website
      },
      agreementDateFormatted: mouTemplate.formatDate(agreement.agreementDate),
      possessionDateFormatted: mouTemplate.formatDate(agreement.possessionDate),
      totalPriceFormatted: mouTemplate.formatCurrency(agreement.totalPrice),
      tokenAmountFormatted: mouTemplate.formatCurrency(agreement.tokenAmount)
    };
  },

  /**
   * Get default terms for MoU
   */
  getDefaultTerms: (): string[] => {
    return [
      'This Memorandum of Understanding sets forth the preliminary understanding between the parties regarding the proposed transaction.',
      'The terms and conditions of the final binding agreement shall be negotiated and finalized within 30 days from the date of this MoU.',
      'Both parties agree to act in good faith and with mutual cooperation during the negotiation process.',
      'This MoU indicates a serious intent to enter into a formal agreement but is not legally binding in itself.',
      'The parties agree to maintain confidentiality regarding all information exchanged during this process.',
      'If the final agreement is not reached within the specified period, this MoU shall automatically expire.',
      'The token amount of Rs. [Amount] deposited by the Buyer shall be adjusted against the final sale consideration.',
      'If the Seller withdraws from the transaction, the token amount shall be refunded to the Buyer.',
      'If the Buyer withdraws from the transaction, the token amount shall be forfeited by the Seller.'
    ];
  },

  /**
   * Generate MoU text
   */
  generateText: (data: MOUData): string => {
    const { agreement } = data;

    let text = `
${data.company.name.toUpperCase()}
${data.company.address}
Phone: ${data.company.phone} | Email: ${data.company.email}

================================================================================
        MEMORANDUM OF UNDERSTANDING (MoU)
================================================================================

MoU ID: ${agreement.agreementId}
Date: ${data.agreementDateFormatted}

================================================================================

This Memorandum of Understanding ("MoU") is entered into on ${data.agreementDateFormatted}
at ${data.company.address},

BETWEEN

PARTY A: ${agreement.buyerId}
(Hereafter referred to as "the Prospective Buyer")

AND

PARTY B: ${agreement.sellerId}
(Hereafter referred to as "the Prospective Seller")

AND

BROKER: ${agreement.brokerId}
(Hereafter referred to as "the Broker")

================================================================================
                              RECITALS
================================================================================

WHEREAS, the Prospective Seller is the owner/authorized person of the property
described herein and intends to sell the same;

AND WHEREAS, the Prospective Buyer is interested in purchasing the aforementioned
property;

AND WHEREAS, both parties wish to record their preliminary understanding through
this MoU;

================================================================================
 PROPERTY DETAILS
================================================================================

Property Type: ${agreement.propertyType.charAt(0).toUpperCase() + agreement.propertyType.slice(1)}
Property Address: ${agreement.propertyAddress}
Property Area: ${agreement.propertyArea} ${agreement.propertyAreaUnit.toUpperCase()}
Tentative Sale Price: ${data.totalPriceFormatted}
Token Amount Paid: ${data.tokenAmountFormatted}

================================================================================
                          TERMS AND CONDITIONS
================================================================================
`;

    const terms = agreement.terms
      ? agreement.terms.split('\n').filter(t => t.trim())
      : mouTemplate.getDefaultTerms();

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
                              NEXT STEPS
================================================================================

1. Both parties shall negotiate and finalize the Sale Agreement within 30 days.

2. The final Sale Agreement shall include all terms agreed upon in this MoU.

3. The token amount shall be adjusted against the final sale consideration.

4. All original property documents shall be verified before execution of Sale Agreement.

================================================================================
                              SIGNATURES
================================================================================

PROSPECTIVE BUYER:
Signature: ${agreement.buyerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.buyerSignedAt ? mouTemplate.formatDate(agreement.buyerSignedAt) : 'Pending'}

PROSPECTIVE SELLER:
Signature: ${agreement.sellerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.sellerSignedAt ? mouTemplate.formatDate(agreement.sellerSignedAt) : 'Pending'}

WITNESS 1:
Signature: ${agreement.witness1Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness1SignedAt ? mouTemplate.formatDate(agreement.witness1SignedAt) : 'Pending'}

WITNESS 2:
Signature: ${agreement.witness2Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness2SignedAt ? mouTemplate.formatDate(agreement.witness2SignedAt) : 'Pending'}

================================================================================
                    Generated by ${data.company.name} Agreement Service
================================================================================

NOTE: This is a preliminary document indicating intent. This MoU is not
legally binding but serves as a record of understanding between the parties.
================================================================================
`;

    return text;
  }
};

export default mouTemplate;