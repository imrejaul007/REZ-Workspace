// Document Service Types
// Defines all interfaces for the document generation and e-signature service

// ==================== ENUMS ====================

export enum DocumentType {
  OFFER_LETTER = 'offer_letter',
  EXPERIENCE_LETTER = 'experience_letter',
  APPOINTMENT_LETTER = 'appointment_letter',
  PROMOTION_LETTER = 'promotion_letter',
  RELIEVING_LETTER = 'relieving_letter',
  SALARY_SLIP = 'salary_slip',
  NDA = 'nda',
  EMPLOYMENT_CONTRACT = 'employment_contract',
  CONFIDENTIALITY_AGREEMENT = 'confidentiality_agreement',
  BONUS_LETTER = 'bonus_letter',
  TRANSFER_LETTER = 'transfer_letter',
  RESIGNATION_ACCEPTANCE = 'resignation_acceptance',
  WARNING_LETTER = 'warning_letter',
  TERMINATION_LETTER = 'termination_letter',
  CUSTOM = 'custom',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  PARTIALLY_SIGNED = 'partially_signed',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ==================== DOCUMENT TEMPLATE ====================

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'array';
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Note: _id is managed by Mongoose and excluded from API responses
export interface DocumentTemplate {
  templateId: string;
  companyId: string;
  name: string;
  description?: string;
  type: DocumentType;
  content: string; // HTML/Handlebars template content
  variables: TemplateVariable[];
  category?: string;
  department?: string;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  previousVersionId?: string;
  createdById: string;
  createdByName: string;
  updatedById?: string;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== GENERATED DOCUMENT ====================

export interface DocumentVariableData {
  [key: string]: string | number | boolean | Date | string[] | number[];
}

// Note: _id is managed by Mongoose and excluded from API responses
export interface GeneratedDocument {
  documentId: string;
  templateId: string;
  templateName: string;
  templateType: DocumentType;
  employeeId: string;
  employeeName: string;
  companyId: string;
  title: string;
  data: DocumentVariableData;
  content: string; // Rendered HTML content
  status: DocumentStatus;
  pdfUrl?: string;
  signedAt?: Date;
  signedById?: string;
  expiresAt?: Date;
  metadata?: {
    department?: string;
    designation?: string;
    joiningDate?: string;
    salary?: number;
    managerName?: string;
  };
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== E-SIGNATURE ====================

export interface Signer {
  signerId: string;
  userId: string;
  name: string;
  email: string;
  role: string; // 'employee' | 'manager' | 'hr' | 'legal' | 'witness'
  order: number;
  status: SignatureStatus;
  signedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  rejectionReason?: string;
  signatureImageUrl?: string;
}

// Note: _id is managed by Mongoose and excluded from API responses
export interface ESignature {
  signatureId: string;
  documentId: string;
  documentTitle: string;
  companyId: string;
  signers: Signer[];
  status: SignatureStatus; // Overall status
  currentSignerOrder: number;
  signedDocumentUrl?: string;
  expiresAt: Date;
  reminderCount: number;
  lastReminderAt?: Date;
  signedAt?: Date;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: DocumentType;
  content: string;
  variables: TemplateVariable[];
  category?: string;
  department?: string;
  isDefault?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  content?: string;
  variables?: TemplateVariable[];
  category?: string;
  department?: string;
  isActive?: boolean;
}

export interface GenerateDocumentRequest {
  templateId: string;
  employeeId: string;
  employeeName: string;
  title?: string;
  data: DocumentVariableData;
  sendForSignature?: boolean;
  signers?: Omit<Signer, 'signerId' | 'status' | 'signedAt' | 'ipAddress' | 'userAgent'>[];
}

export interface RequestSignatureRequest {
  documentId: string;
  signers: Omit<Signer, 'signerId' | 'status' | 'signedAt' | 'ipAddress' | 'userAgent'>[];
  expiresInDays?: number; // Default 7 days
}

export interface SignDocumentRequest {
  signatureId: string;
  userId: string;
  signatureImageUrl?: string;
}

export interface RejectSignatureRequest {
  signatureId: string;
  userId: string;
  reason: string;
}

// ==================== QUERY TYPES ====================

export interface TemplateQuery {
  companyId?: string;
  type?: DocumentType;
  category?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentQuery {
  companyId?: string;
  templateId?: string;
  employeeId?: string;
  status?: DocumentStatus;
  type?: DocumentType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SignatureQuery {
  companyId?: string;
  documentId?: string;
  userId?: string;
  status?: SignatureStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

// ==================== DEFAULT TEMPLATES ====================

export interface DefaultTemplate {
  name: string;
  type: DocumentType;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Offer Letter',
    type: DocumentType.OFFER_LETTER,
    description: 'Standard offer letter template for new hires',
    category: 'Hiring',
    content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; }
    .date { text-align: right; margin-bottom: 20px; }
    .recipient { margin-bottom: 20px; }
    .subject { font-weight: bold; text-decoration: underline; }
    .content { margin-bottom: 20px; }
    .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .signature-block { margin-top: 50px; }
    .footer { margin-top: 50px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{companyName}}</div>
  </div>

  <div class="date">{{currentDate}}</div>

  <div class="recipient">
    <strong>To:</strong><br>
    {{employeeName}}<br>
    {{employeeEmail}}
  </div>

  <div class="subject">Subject: Offer of Employment - {{designation}}</div>

  <div class="content">
    <p>Dear {{employeeName}},</p>
    <p>We are pleased to offer you the position of <strong>{{designation}}</strong> at <strong>{{companyName}}</strong>, reporting to <strong>{{reportingManager}}</strong>.</p>

    <p><strong>Terms of Employment:</strong></p>
    <ul>
      <li><strong>Position:</strong> {{designation}}</li>
      <li><strong>Department:</strong> {{department}}</li>
      <li><strong>Grade:</strong> {{grade}}</li>
      <li><strong>Date of Joining:</strong> {{joiningDate}}</li>
      <li><strong>Location:</strong> {{workLocation}}</li>
      <li><strong>Employment Type:</strong> {{employmentType}}</li>
    </ul>

    <p><strong>Compensation:</strong></p>
    <p>Your fixed compensation will be <strong>{{currency}} {{annualSalary}} per annum</strong>, as detailed below:</p>

    <table class="salary-table">
      <tr><th>Component</th><th>Monthly (INR)</th><th>Annual (INR)</th></tr>
      <tr><td>Basic Salary</td><td>{{basicSalary}}</td><td>{{basicSalaryAnnual}}</td></tr>
      <tr><td>HRA</td><td>{{hra}}</td><td>{{hraAnnual}}</td></tr>
      <tr><td>Transport Allowance</td><td>{{transportAllowance}}</td><td>{{transportAllowanceAnnual}}</td></tr>
      <tr><td>Medical Allowance</td><td>{{medicalAllowance}}</td><td>{{medicalAllowanceAnnual}}</td></tr>
      <tr><td>Other Allowances</td><td>{{otherAllowances}}</td><td>{{otherAllowancesAnnual}}</td></tr>
      <tr><th>Total</th><th>{{monthlySalary}}</th><th>{{annualSalary}}</th></tr>
    </table>

    <p>This offer is contingent upon:</p>
    <ul>
      <li>Verification of your educational and professional credentials</li>
      <li>Completion of reference checks</li>
      <li>Submission of required documents</li>
      <li>Signing of the Employment Agreement</li>
    </ul>

    <p>Please confirm your acceptance by signing below and returning this letter by <strong>{{responseDeadline}}</strong>.</p>

    <div class="signature-block">
      <p>Yours sincerely,</p>
      <p><strong>{{companySignatoryName}}</strong><br>{{companySignatoryDesignation}}</p>
      <p>Date: _______________</p>
      <p><strong>Accepted by:</strong></p>
      <p>_________________________</p>
      <p>{{employeeName}}</p>
      <p>Date: _______________</p>
    </div>

    <div class="footer">
      This is a computer-generated document. Generated on {{currentDate}}.
    </div>
  </div>
</body>
</html>
    `,
    variables: [
      { name: 'companyName', type: 'string', required: true, description: 'Company name' },
      { name: 'employeeName', type: 'string', required: true, description: 'Employee full name' },
      { name: 'employeeEmail', type: 'string', required: true, description: 'Employee email' },
      { name: 'designation', type: 'string', required: true, description: 'Job title/position' },
      { name: 'department', type: 'string', required: true, description: 'Department name' },
      { name: 'grade', type: 'string', required: false, description: 'Employee grade' },
      { name: 'joiningDate', type: 'date', required: true, description: 'Date of joining' },
      { name: 'workLocation', type: 'string', required: true, description: 'Work location' },
      { name: 'employmentType', type: 'string', required: true, description: 'Full-time/Part-time/Contract' },
      { name: 'reportingManager', type: 'string', required: true, description: 'Reporting manager name' },
      { name: 'currency', type: 'string', required: true, defaultValue: 'INR', description: 'Currency code' },
      { name: 'annualSalary', type: 'currency', required: true, description: 'Annual salary amount' },
      { name: 'basicSalary', type: 'currency', required: true, description: 'Monthly basic salary' },
      { name: 'hra', type: 'currency', required: true, description: 'Monthly HRA' },
      { name: 'transportAllowance', type: 'currency', required: false, description: 'Monthly transport allowance' },
      { name: 'medicalAllowance', type: 'currency', required: false, description: 'Monthly medical allowance' },
      { name: 'otherAllowances', type: 'currency', required: false, description: 'Other monthly allowances' },
      { name: 'responseDeadline', type: 'date', required: true, description: 'Offer response deadline' },
      { name: 'companySignatoryName', type: 'string', required: true, description: 'Signing authority name' },
      { name: 'companySignatoryDesignation', type: 'string', required: true, description: 'Signing authority designation' },
    ],
  },
  {
    name: 'Experience Letter',
    type: DocumentType.EXPERIENCE_LETTER,
    description: 'Experience and service letter for departing employees',
    category: 'Separation',
    content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; }
    .date { text-align: right; margin-bottom: 20px; }
    .subject { font-weight: bold; margin-bottom: 20px; }
    .content { margin-bottom: 20px; }
    .signature-block { margin-top: 50px; }
    .footer { margin-top: 50px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{companyName}}</div>
  </div>

  <div class="date">{{currentDate}}</div>

  <div class="subject">TO WHOM IT MAY CONCERN</div>

  <div class="content">
    <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) was employed with <strong>{{companyName}}</strong> from <strong>{{startDate}}</strong> to <strong>{{endDate}}</strong>.</p>

    <p>During their tenure, they held the position of <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>

    <p>Key responsibilities included:</p>
    <ul>
      {{#each responsibilities}}
      <li>{{this}}</li>
      {{/each}}
    </ul>

    <p>We found {{employeeName}} to be a dedicated and responsible professional. Their conduct and performance were always satisfactory.</p>

    <p>We wish {{employeeName}} all the best in their future endeavors.</p>

    <div class="signature-block">
      <p>For <strong>{{companyName}}</strong>,</p>
      <p><br><br></p>
      <p><strong>{{signatoryName}}</strong><br>{{signatoryDesignation}}</p>
      <p>Date: {{currentDate}}</p>
    </div>

    <div class="footer">
      This is a computer-generated document. Generated on {{currentDate}}.
    </div>
  </div>
</body>
</html>
    `,
    variables: [
      { name: 'companyName', type: 'string', required: true, description: 'Company name' },
      { name: 'employeeName', type: 'string', required: true, description: 'Employee full name' },
      { name: 'employeeId', type: 'string', required: true, description: 'Employee ID' },
      { name: 'designation', type: 'string', required: true, description: 'Final designation' },
      { name: 'department', type: 'string', required: true, description: 'Department name' },
      { name: 'startDate', type: 'date', required: true, description: 'Employment start date' },
      { name: 'endDate', type: 'date', required: true, description: 'Employment end date' },
      { name: 'responsibilities', type: 'array', required: false, description: 'List of key responsibilities' },
      { name: 'signatoryName', type: 'string', required: true, description: 'Signing authority name' },
      { name: 'signatoryDesignation', type: 'string', required: true, description: 'Signing authority designation' },
    ],
  },
  {
    name: 'NDA Agreement',
    type: DocumentType.NDA,
    description: 'Non-Disclosure Agreement template',
    category: 'Legal',
    content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; }
    .header { text-align: center; margin-bottom: 30px; font-size: 18px; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; margin-bottom: 10px; }
    .signature-block { margin-top: 40px; }
    .signature-table { width: 100%; margin-top: 30px; }
    .signature-table td { width: 50%; vertical-align: top; padding: 10px; }
  </style>
</head>
<body>
  <div class="header">NON-DISCLOSURE AGREEMENT</div>

  <div class="section">
    <p>This Non-Disclosure Agreement ("Agreement") is entered into as of <strong>{{effectiveDate}}</strong> by and between:</p>
    <p><strong>{{companyName}}</strong> ("Company") and <strong>{{employeeName}}</strong> ("Receiving Party")</p>
  </div>

  <div class="section">
    <div class="section-title">1. DEFINITION OF CONFIDENTIAL INFORMATION</div>
    <p>"Confidential Information" means any and all non-public information, including but not limited to:</p>
    <ul>
      <li>Trade secrets, inventions, ideas, processes, formulas, source code</li>
      <li>Product specifications, designs, drawings, sketches</li>
      <li>Business plans, financial data, customer lists</li>
      <li>Marketing strategies, sales data, pricing information</li>
      <li>Employee information, organizational structure</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">2. OBLIGATIONS</div>
    <p>The Receiving Party agrees to:</p>
    <ul>
      <li>Maintain the confidentiality of all Confidential Information</li>
      <li>Not disclose Confidential Information to any third parties</li>
      <li>Not use Confidential Information for any purpose other than as authorized</li>
      <li>Protect Confidential Information with at least the same care as own confidential information</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">3. TERM</div>
    <p>This Agreement shall remain in effect for a period of <strong>{{termYears}} years</strong> from the Effective Date.</p>
  </div>

  <div class="section">
    <div class="section-title">4. RETURN OF MATERIALS</div>
    <p>Upon termination or request, the Receiving Party shall return or destroy all Confidential Information.</p>
  </div>

  <div class="section">
    <div class="section-title">5. REMEDIES</div>
    <p>The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm and the Company shall be entitled to seek injunctive relief.</p>
  </div>

  <table class="signature-table">
    <tr>
      <td>
        <strong>COMPANY:</strong><br><br>
        {{companyName}}<br><br>
        Signature: _________________________<br><br>
        Name: {{companySignatoryName}}<br>
        Designation: {{companySignatoryDesignation}}<br>
        Date: _______________
      </td>
      <td>
        <strong>RECEIVING PARTY:</strong><br><br>
        {{employeeName}}<br><br>
        Signature: _________________________<br><br>
        Employee ID: {{employeeId}}<br>
        Date: _______________
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: [
      { name: 'companyName', type: 'string', required: true, description: 'Company name' },
      { name: 'employeeName', type: 'string', required: true, description: 'Employee full name' },
      { name: 'employeeId', type: 'string', required: true, description: 'Employee ID' },
      { name: 'effectiveDate', type: 'date', required: true, description: 'Agreement effective date' },
      { name: 'termYears', type: 'number', required: true, defaultValue: 2, description: 'Agreement term in years' },
      { name: 'companySignatoryName', type: 'string', required: true, description: 'Company signing authority name' },
      { name: 'companySignatoryDesignation', type: 'string', required: true, description: 'Company signing authority designation' },
    ],
  },
  {
    name: 'Salary Slip',
    type: DocumentType.SALARY_SLIP,
    description: 'Monthly salary slip template',
    category: 'Payroll',
    content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .company-name { font-size: 20px; font-weight: bold; }
    .slip-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .info-box { width: 48%; }
    .info-box h4 { background: #f0f0f0; padding: 5px; margin: 0; }
    .info-box p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f0f0f0; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .net-pay { font-size: 18px; font-weight: bold; color: green; }
    .footer { margin-top: 30px; font-size: 11px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{companyName}}</div>
    <div>Salary Slip - {{month}} {{year}}</div>
  </div>

  <div class="slip-info">
    <div class="info-box">
      <h4>Employee Details</h4>
      <p><strong>Name:</strong> {{employeeName}}</p>
      <p><strong>Employee ID:</strong> {{employeeId}}</p>
      <p><strong>Department:</strong> {{department}}</p>
      <p><strong>Designation:</strong> {{designation}}</p>
    </div>
    <div class="info-box">
      <h4>Pay Period</h4>
      <p><strong>Month:</strong> {{month}} {{year}}</p>
      <p><strong>UAN:</strong> {{uanNumber}}</p>
      <p><strong>Bank Account:</strong> ****{{bankAccountLast4}}</p>
      <p><strong>Pay Date:</strong> {{payDate}}</p>
    </div>
  </div>

  <table>
    <tr><th colspan="2">EARNINGS</th><th>Amount (INR)</th></tr>
    <tr><td colspan="2">Basic Salary</td><td>{{basicSalary}}</td></tr>
    <tr><td colspan="2">HRA</td><td>{{hra}}</td></tr>
    <tr><td colspan="2">Transport Allowance</td><td>{{transportAllowance}}</td></tr>
    <tr><td colspan="2">Medical Allowance</td><td>{{medicalAllowance}}</td></tr>
    <tr><td colspan="2">Special Allowance</td><td>{{specialAllowance}}</td></tr>
    <tr><td colspan="2">Other Earnings</td><td>{{otherEarnings}}</td></tr>
    <tr class="total-row"><td colspan="2">Gross Earnings</td><td>{{grossEarnings}}</td></tr>
  </table>

  <table>
    <tr><th colspan="2">DEDUCTIONS</th><th>Amount (INR)</th></tr>
    <tr><td colspan="2">PF Contribution</td><td>{{pfDeduction}}</td></tr>
    <tr><td colspan="2">ESI Contribution</td><td>{{esiDeduction}}</td></tr>
    <tr><td colspan="2">TDS</td><td>{{tdsDeduction}}</td></tr>
    <tr><td colspan="2">Professional Tax</td><td>{{professionalTax}}</td></tr>
    <tr><td colspan="2">Other Deductions</td><td>{{otherDeductions}}</td></tr>
    <tr class="total-row"><td colspan="2">Total Deductions</td><td>{{totalDeductions}}</td></tr>
  </table>

  <table>
    <tr>
      <td><strong>Gross Salary:</strong> {{grossEarnings}}</td>
      <td><strong>Total Deductions:</strong> {{totalDeductions}}</td>
      <td class="net-pay"><strong>Net Pay: {{netSalary}}</strong></td>
    </tr>
  </table>

  <p><strong>Net Salary in Words:</strong> {{netSalaryInWords}}</p>

  <div class="footer">
    <p>This is a computer-generated document. Generated on {{currentDate}}.</p>
    <p>Please contact HR for any discrepancies within 3 working days.</p>
  </div>
</body>
</html>
    `,
    variables: [
      { name: 'companyName', type: 'string', required: true, description: 'Company name' },
      { name: 'employeeName', type: 'string', required: true, description: 'Employee full name' },
      { name: 'employeeId', type: 'string', required: true, description: 'Employee ID' },
      { name: 'department', type: 'string', required: true, description: 'Department name' },
      { name: 'designation', type: 'string', required: true, description: 'Designation' },
      { name: 'month', type: 'string', required: true, description: 'Pay month (e.g., May)' },
      { name: 'year', type: 'string', required: true, description: 'Pay year' },
      { name: 'uanNumber', type: 'string', required: false, description: 'UAN number' },
      { name: 'bankAccountLast4', type: 'string', required: true, description: 'Last 4 digits of bank account' },
      { name: 'payDate', type: 'date', required: true, description: 'Payment date' },
      { name: 'basicSalary', type: 'currency', required: true, description: 'Basic salary amount' },
      { name: 'hra', type: 'currency', required: true, description: 'HRA amount' },
      { name: 'transportAllowance', type: 'currency', required: false, description: 'Transport allowance' },
      { name: 'medicalAllowance', type: 'currency', required: false, description: 'Medical allowance' },
      { name: 'specialAllowance', type: 'currency', required: false, description: 'Special allowance' },
      { name: 'otherEarnings', type: 'currency', required: false, defaultValue: 0, description: 'Other earnings' },
      { name: 'grossEarnings', type: 'currency', required: true, description: 'Total gross earnings' },
      { name: 'pfDeduction', type: 'currency', required: true, description: 'PF deduction' },
      { name: 'esiDeduction', type: 'currency', required: false, description: 'ESI deduction' },
      { name: 'tdsDeduction', type: 'currency', required: false, description: 'TDS deduction' },
      { name: 'professionalTax', type: 'currency', required: false, description: 'Professional tax' },
      { name: 'otherDeductions', type: 'currency', required: false, defaultValue: 0, description: 'Other deductions' },
      { name: 'totalDeductions', type: 'currency', required: true, description: 'Total deductions' },
      { name: 'netSalary', type: 'currency', required: true, description: 'Net salary amount' },
      { name: 'netSalaryInWords', type: 'string', required: true, description: 'Net salary in words' },
    ],
  },
];
