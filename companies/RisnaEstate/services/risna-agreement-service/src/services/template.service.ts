import { IAgreement } from '../models/agreement.model.js';
import { AgreementType } from '../schemas/agreement.schema.js';
import { logger } from '../config/logger.js';

export interface TemplateInfo {
  type: AgreementType;
  name: string;
  description: string;
  applicableTypes: string[];
}

export interface TemplateData {
  agreement: IAgreement;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  generatedAt: Date;
}

export class TemplateService {
  private readonly templates: Map<AgreementType, TemplateInfo>;

  constructor() {
    this.templates = new Map([
      ['sale_agreement', {
        type: 'sale_agreement',
        name: 'Sale Agreement',
        description: 'Full property sale contract with all terms and conditions',
        applicableTypes: ['apartment', 'villa', 'plot', 'commercial', 'land']
      }],
      ['noc', {
        type: 'noc',
        name: 'No Objection Certificate',
        description: 'Certificate confirming no objection to property transaction',
        applicableTypes: ['apartment', 'villa', 'plot', 'commercial', 'land']
      }],
      ['mou', {
        type: 'mou',
        name: 'Memorandum of Understanding',
        description: 'Preliminary agreement indicating intent to purchase',
        applicableTypes: ['apartment', 'villa', 'plot', 'commercial', 'land']
      }],
      ['租约', {
        type: '租约',
        name: 'Lease Agreement',
        description: 'Commercial or residential lease agreement',
        applicableTypes: ['apartment', 'villa', 'commercial']
      }],
      ['leave_license', {
        type: 'leave_license',
        name: 'Leave and License Agreement',
        description: 'Temporary occupation rights agreement',
        applicableTypes: ['apartment', 'villa', 'commercial']
      }],
      ['租让协议', {
        type: '租让协议',
        name: 'Tenancy Agreement',
        description: 'Standard landlord-tenant agreement',
        applicableTypes: ['apartment', 'villa', 'commercial']
      }]
    ]);
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateInfo[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by type
   */
  getTemplate(type: AgreementType): TemplateInfo | undefined {
    return this.templates.get(type);
  }

  /**
   * Get templates for property type
   */
  getTemplatesForPropertyType(propertyType: string): TemplateInfo[] {
    return Array.from(this.templates.values()).filter(
      template => template.applicableTypes.includes(propertyType)
    );
  }

  /**
   * Render template data
   */
  renderTemplateData(agreement: IAgreement): TemplateData {
    return {
      agreement,
      company: {
        name: process.env.COMPANY_NAME || 'RisnaEstate',
        address: process.env.COMPANY_ADDRESS || 'India',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.COMPANY_EMAIL || '',
        website: process.env.COMPANY_WEBSITE || ''
      },
      generatedAt: new Date()
    };
  }

  /**
   * Generate HTML preview
   */
  generateHtmlPreview(agreement: IAgreement): string {
    const data = this.renderTemplateData(agreement);
    const templateInfo = this.getTemplate(agreement.type);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateInfo?.name || 'Agreement'} - ${agreement.agreementId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
 }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24pt;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 10pt;
      color: #666;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin: 30px 0;
      text-decoration: underline;
    }
    .section {
      margin: 20px 0;
    }
    .section h2 {
      font-size: 14pt;
      text-decoration: underline;
      margin-bottom: 10px;
    }
    .section p, .section li {
      text-align: justify;
      margin: 8px 0;
    }
    .section ul {
      margin-left: 30px;
    }
    .property-details {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .price-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .price-table th, .price-table td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    .price-table th {
      background: #f0f0f0;
    }
    .signature-block {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin: 40px 0;
    }
    .signature-box {
      width: 45%;
    }
    .signature-box .name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      height: 60px;
      margin-bottom: 5px;
    }
    .signature-box .date {
      font-size: 10pt;
      color: #666;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 9pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.company.name}</h1>
    <p>${data.company.address}</p>
    <p>Phone: ${data.company.phone} | Email: ${data.company.email}</p>
  </div>

  <div class="title">
    ${templateInfo?.name?.toUpperCase() || 'AGREEMENT'}
  </div>

  <p style="text-align: center; margin-bottom: 30px;">
    Agreement ID:<strong>${agreement.agreementId}</strong><br>
    Date: ${new Date(agreement.agreementDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}
  </p>

  <div class="section">
    <h2>PROPERTY DETAILS</h2>
    <div class="property-details">
      <p><strong>Property Type:</strong> ${agreement.propertyType.charAt(0).toUpperCase() + agreement.propertyType.slice(1)}</p>
      <p><strong>Address:</strong> ${agreement.propertyAddress}</p>
      <p><strong>Area:</strong> ${agreement.propertyArea} ${agreement.propertyAreaUnit.toUpperCase()}</p>
    </div>
  </div>

  <div class="section">
    <h2>PARTIES TO THIS AGREEMENT</h2>
    <p><strong>BUYER:</strong> ${agreement.buyerId}</p>
    <p><strong>SELLER:</strong> ${agreement.sellerId}</p>
    <p><strong>BROKER:</strong> ${agreement.brokerId}</p>
  </div>

  <div class="section">
    <h2>PRICE AND PAYMENT DETAILS</h2>
    <table class="price-table">
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
      <tr>
        <td>Total Sale Consideration</td>
        <td>Rs. ${agreement.saleConsideration.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Total Price</td>
        <td>Rs. ${agreement.totalPrice.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Token Amount</td>
        <td>Rs. ${agreement.tokenAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Stamp Duty</td>
        <td>Rs. ${agreement.stampDuty.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>GST</td>
        <td>Rs. ${agreement.gst.toLocaleString('en-IN')}</td>
      </tr>
<tr>
        <td>Registration Amount</td>
        <td>Rs. ${agreement.registrationAmount.toLocaleString('en-IN')}</td>
      </tr>
      ${agreement.parkingIncluded ? `
      <tr>
        <td>Parking Price</td>
        <td>Rs. ${agreement.parkingPrice.toLocaleString('en-IN')}</td>
      </tr>
      ` : ''}
    </table>
    <p><strong>Expected Possession Date:</strong> ${new Date(agreement.possessionDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}</p>
  </div>

  <div class="section">
    <h2>TERMS AND CONDITIONS</h2>
    <div style="white-space: pre-wrap;">${agreement.terms || 'Terms and conditions as per standard agreement format.'}</div>
  </div>

  ${agreement.specialConditions ? `
  <div class="section">
    <h2>SPECIAL CONDITIONS</h2>
    <div style="white-space: pre-wrap;">${agreement.specialConditions}</div>
  </div>
  ` : ''}

  ${agreement.paymentSchedule && agreement.paymentSchedule.length > 0 ? `
  <div class="section">
    <h2>PAYMENT SCHEDULE</h2>
    <table class="price-table">
      <tr>
        <th>Milestone</th>
        <th>Amount</th>
        <th>Due Date</th>
        <th>Status</th>
      </tr>
      ${agreement.paymentSchedule.map(p => `
      <tr>
        <td>${p.milestone}</td>
        <td>Rs. ${p.amount.toLocaleString('en-IN')}</td>
        <td>${new Date(p.dueDate).toLocaleDateString('en-IN')}</td>
        <td>${p.status.toUpperCase()}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}

  <div class="signature-block">
    <h2>SIGNATURES</h2>
    <div class="signature-row">
      <div class="signature-box">
        <div class="name">BUYER</div>
        <div class="signature-line">
          ${agreement.buyerSignature ? '<img src="' + agreement.buyerSignature + '" style="max-width: 100%; height: auto;" />' : ''}
        </div>
        <div class="date">${agreement.buyerSignedAt ? 'Signed on: ' + new Date(agreement.buyerSignedAt).toLocaleString('en-IN') : 'Pending'}</div>
      </div>
      <div class="signature-box">
        <div class="name">SELLER</div>
        <div class="signature-line">
          ${agreement.sellerSignature ? '<img src="' + agreement.sellerSignature + '" style="max-width: 100%; height: auto;" />' : ''}
        </div>
        <div class="date">${agreement.sellerSignedAt ? 'Signed on: ' + new Date(agreement.sellerSignedAt).toLocaleString('en-IN') : 'Pending'}</div>
      </div>
    </div>
    <div class="signature-row">
      <div class="signature-box">
        <div class="name">WITNESS 1</div>
        <div class="signature-line">
          ${agreement.witness1Signature ? '<img src="' + agreement.witness1Signature + '" style="max-width: 100%; height: auto;" />' : ''}
        </div>
        <div class="date">${agreement.witness1SignedAt ? 'Signed on: ' + new Date(agreement.witness1SignedAt).toLocaleString('en-IN') : 'Pending'}</div>
      </div>
      <div class="signature-box">
        <div class="name">WITNESS 2</div>
        <div class="signature-line">
          ${agreement.witness2Signature ? '<img src="' + agreement.witness2Signature + '" style="max-width: 100%; height: auto;" />' : ''}
        </div>
        <div class="date">${agreement.witness2SignedAt ? 'Signed on: ' + new Date(agreement.witness2SignedAt).toLocaleString('en-IN') : 'Pending'}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Generated by ${data.company.name} Agreement Service | ${data.generatedAt.toISOString()}</p>
    <p>This is a preview document. The actual agreement may vary.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get default terms for agreement type
   */
  getDefaultTerms(type: AgreementType): string {
    const defaultTerms: Record<AgreementType, string> = {
      'sale_agreement': `1. The Seller agrees to sell and the Buyer agrees to purchase the property described herein at the consideration mentioned in this Agreement.

2. The Buyer shall pay the total sale consideration as per the payment schedule attached to this Agreement.

3. The Seller confirms that the property is free from all encumbrances, liens, charges, and disputes of any nature.

4. The Buyer shall pay all applicable stamp duty and registration charges for the transfer of this property.

5. The possession of the property shall be delivered to the Buyer on the date specified in this Agreement, subject to receipt of full payment.

6. Both parties agree to execute all necessary documents and appear before the concerned authorities for registration of this Agreement.

7. The Seller shall provide all original documents related to the property at the time of registration.

8. If either party defaults, the other party shall have the right to take legal action as per the terms herein.

9. This Agreement shall be binding on the heirs, successors, legal representatives, and assigns of both parties.

10. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts in the concerned city.`,

      'noc': `1. This No Objection Certificate is issued to confirm that we have no objection to the transaction/procedure mentioned herein.

2. We confirm that all outstanding dues, if any, related to the property have been cleared.

3. We agree to cooperate fully in the completion of the transaction/procedure.

4. This NOC is valid for a period of 90 days from the date of issue.

5. We understand that this NOC does not absolve any legal obligations we may have.`,

      'mou': `1. This Memorandum of Understanding sets forth the preliminary understanding between the parties regarding the proposed transaction.

2. The terms and conditions of the final binding agreement shall be negotiated and finalized within 30 days from the date of this MoU.

3. Both parties agree to act in good faith and with mutual cooperation during the negotiation process.

4. This MoU indicates a serious intent to enter into a formal agreement but is not legally binding in itself.

5. The parties agree to maintain confidentiality regarding all information exchanged during this process.

6. If the final agreement is not reached within the specified period, this MoU shall automatically expire.`,

      '租约': `1. This Lease Agreement is entered into between the Landlord and Tenant for the property described herein.

2. The property shall be used only for the purpose specified in this Agreement and for no other purpose.

3. The Tenant agrees to pay the monthly rent on or before the specified date each month.

4. The Tenant shall maintain the property in good condition and shall not make any alterations without prior written consent.

5. The security deposit shall be deposited with the Landlord and shall be refundable at the end of the lease term, subject to deductions for damages.

6. Either party can terminate this Agreement by giving notice as specified herein.

7. The Tenant agrees not to sublet or transfer the premises to any third party.

8. The Landlord agrees to provide and maintain essential services and facilities.`,

      'leave_license': `1. This Leave and License Agreement grants temporary occupation rights to the Licensee.

2. The Licensee shall use the premises solely for the purpose mentioned herein.

3. The Licensor retains ownership of the property and all rights therein.

4. This Agreement does not create any tenancy rights or interest in the property for the Licensee.

5. The Licensee shall vacate the premises on or before the expiry of this Agreement.

6. Either party can terminate this Agreement by giving notice as specified herein.`,

      '租让协议': `1. This Tenancy Agreement establishes a landlord-tenant relationship between the parties.

2. The Tenant agrees to pay rent by the specified date each month without fail.

3. The property shall be maintained in its original condition, subject to fair wear and tear.

4. The Tenant shall not sublet or assign the premises without written consent.

5. The Landlord agrees to provide essential services and carry out necessary repairs.

6. Either party can terminate this Agreement by giving notice as per the terms specified.

7. The security deposit shall be refundable at the end of the tenancy term.`
    };

    return defaultTerms[type] || defaultTerms['sale_agreement'];
  }
}

export const templateService = new TemplateService();
export default templateService;