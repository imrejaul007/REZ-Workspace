import Handlebars from 'handlebars';
import PDFDocument from 'pdfkit';
import { TemplateVariable } from '../types';

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
});

Handlebars.registerHelper('numberToWords', (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  return convert(Math.floor(num));
});

Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
Handlebars.registerHelper('capitalize', (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

// Template rendering
export function renderTemplate(
  templateContent: string,
  data: Record<string, unknown>
): string {
  // Add current date helper
  const enrichedData = {
    ...data,
    currentDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };

  const template = Handlebars.compile(templateContent);
  return template(enrichedData);
}

// Validate template data against variables
export function validateTemplateData(
  variables: TemplateVariable[],
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const variable of variables) {
    const value = data[variable.name];

    if (variable.required && (value === undefined || value === null || value === '')) {
      errors.push(`Missing required field: ${variable.name}`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      // Type validation
      switch (variable.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${variable.name} must be a string`);
          }
          break;
        case 'number':
        case 'currency':
          if (typeof value !== 'number') {
            errors.push(`${variable.name} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${variable.name} must be a boolean`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(String(value)))) {
            errors.push(`${variable.name} must be a valid date`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${variable.name} must be an array`);
          }
          break;
      }

      // Validation rules
      if (variable.validation) {
        if (variable.validation.min !== undefined && Number(value) < variable.validation.min) {
          errors.push(`${variable.name} must be at least ${variable.validation.min}`);
        }
        if (variable.validation.max !== undefined && Number(value) > variable.validation.max) {
          errors.push(`${variable.name} must be at most ${variable.validation.max}`);
        }
        if (variable.validation.pattern) {
          const regex = new RegExp(variable.validation.pattern);
          if (!regex.test(String(value))) {
            errors.push(`${variable.name} does not match required pattern`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Generate PDF from HTML content
export async function generatePDF(
  htmlContent: string,
  title: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add title
    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown();

    // Add a simple text representation of the content
    // In production, you'd use a proper HTML to PDF converter like puppeteer
    doc.fontSize(10).text('Document generated from template', { align: 'center' });
    doc.moveDown(2);

    // For actual HTML rendering, integrate with a service like:
    // - Puppeteer
    // - Playwright
    // - pdf-parse + html-pdf
    // This is a placeholder implementation

    doc.fontSize(8).fillColor('gray')
      .text('This is a preview version. For full HTML rendering,', { align: 'center' })
      .text('configure a proper HTML-to-PDF service.', { align: 'center' });

    doc.end();
  });
}

// File storage utilities
export async function saveFile(
  buffer: Buffer,
  filename: string,
  directory: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Ensure directory exists
  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, filename);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

export async function deleteFile(filePath: string): Promise<void> {
  const fs = await import('fs/promises');
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File may not exist
    logger.warn(`Failed to delete file: ${filePath}`, error);
  }
}

// Generate unique ID
export function generateId(prefix: string): string {
  const { v4: uuidv4 } = require('uuid');
  return `${prefix}_${uuidv4()}`;
}
