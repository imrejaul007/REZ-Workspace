import { IAgreement } from '../models/agreement.model.js';
import { config } from '../config/index.js';

export interface LeaseData {
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
  monthlyRentFormatted: string;
  securityDepositFormatted: string;
}

export const leaseTemplate = {
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
  prepareData: (agreement: IAgreement): LeaseData => {
    return {
      agreement,
      company: {
        name: config.company.name,
        address: config.company.address,
        phone: config.company.phone,
        email: config.company.email,
        website: config.company.website
      },
      agreementDateFormatted: leaseTemplate.formatDate(agreement.agreementDate),
      possessionDateFormatted: leaseTemplate.formatDate(agreement.possessionDate),
      totalPriceFormatted: leaseTemplate.formatCurrency(agreement.totalPrice),
      monthlyRentFormatted: leaseTemplate.formatCurrency(agreement.totalPrice / 12),
      securityDepositFormatted: leaseTemplate.formatCurrency(agreement.registrationAmount)
    };
  },

  /**
   * Get default terms for lease agreement
   */
  getDefaultTerms: (): string[] => {
    return [
      'This Lease Agreement is entered into between the Landlord and Tenant for the property described herein.',
      'The property shall be used only for the purpose specified in this Agreement and for no other purpose.',
      'The Tenant agrees to pay the monthly rent on or before the specified date each month.',
      'The Tenant shall maintain the property in good condition and shall not make any alterations without prior written consent.',
      'The security deposit shall be deposited with the Landlord and shall be refundable at the end of the lease term, subject to deductions for damages.',
      'Either party can terminate this Agreement by giving notice as specified herein.',
      'The Tenant agrees not to sublet or transfer the premises to any third party.',
      'The Landlord agrees to provide and maintain essential services and facilities.',
      'The Tenant shall allow the Landlord or authorized personnel to inspect the property with prior notice.',
      'Any breach of these terms may result in termination of this Agreement.'
    ];
  },

  /**
   * Generate lease agreement text
   */
  generateText: (data: LeaseData): string => {
    const { agreement } = data;

    let text = `
${data.company.name.toUpperCase()}
${data.company.address}
Phone: ${data.company.phone} | Email: ${data.company.email}

================================================================================
                          LEASE AGREEMENT
================================================================================

Agreement ID: ${agreement.agreementId}
Date: ${data.agreementDateFormatted}

================================================================================

This Lease Agreement ("Agreement") is made and executed on ${data.agreementDateFormatted}
at ${data.company.address},

BETWEEN

LANDLORD: ${agreement.sellerId}
(Hereafter referred to as "the Landlord", which expression shall include his heirs,
successors, legal representatives, and assigns)

AND

TENANT: ${agreement.buyerId}
(Hereafter referred to as "the Tenant", which expression shall include his heirs,
successors, legal representatives, and assigns)

================================================================================
 PROPERTY DETAILS
================================================================================

Property Type: ${agreement.propertyType.charAt(0).toUpperCase() + agreement.propertyType.slice(1)}
Property Address: ${agreement.propertyAddress}
Property Area: ${agreement.propertyArea} ${agreement.propertyAreaUnit.toUpperCase()}

================================================================================
                          LEASE TERMS
================================================================================

Monthly Rent: ${data.monthlyRentFormatted}
Security Deposit: ${data.securityDepositFormatted}
Lease Period: 11 months ( renewable)
Move-in Date: ${data.possessionDateFormatted}

================================================================================
                          TERMS AND CONDITIONS
================================================================================
`;

    const terms = agreement.terms
      ? agreement.terms.split('\n').filter(t => t.trim())
      : leaseTemplate.getDefaultTerms();

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

LANDLORD:
Signature: ${agreement.sellerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.sellerSignedAt ? leaseTemplate.formatDate(agreement.sellerSignedAt) : 'Pending'}

TENANT:
Signature: ${agreement.buyerSignature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.buyerSignedAt ? leaseTemplate.formatDate(agreement.buyerSignedAt) : 'Pending'}

WITNESS 1:
Signature: ${agreement.witness1Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness1SignedAt ? leaseTemplate.formatDate(agreement.witness1SignedAt) : 'Pending'}

WITNESS 2:
Signature: ${agreement.witness2Signature ? '[Signature on file]' : '_____________________________'}
Date: ${agreement.witness2SignedAt ? leaseTemplate.formatDate(agreement.witness2SignedAt) : 'Pending'}

================================================================================
                    Generated by ${data.company.name} Agreement Service
================================================================================
`;

    return text;
  }
};

export default leaseTemplate;