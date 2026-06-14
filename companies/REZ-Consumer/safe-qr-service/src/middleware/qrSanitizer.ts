import validator from 'validator';

/**
 * QR Content Sanitizer
 * Validates and sanitizes QR code content to prevent XSS and injection attacks
 */

export interface SanitizedQRContent {
 content: string;
 type: 'text' | 'url' | 'phone' | 'email' | 'wifi' | 'vcard' | 'unknown';
 isValid: boolean;
 warnings: string[];
}

/**
 * Sanitize and validate QR code content
 * CRITICAL: Prevents XSS, injection, and other attacks from malicious QR codes
 */
export function sanitizeQRContent(rawContent: string): SanitizedQRContent {
 const warnings: string[] = [];
 let content = rawContent.trim();

 // Empty check
 if (!content || content.length === 0) {
   return {
     content: '',
     type: 'text',
     isValid: false,
     warnings: ['Empty QR content'],
   };
 }

 // Length validation
 if (content.length > 4096) {
   return {
     content: '',
     type: 'text',
     isValid: false,
     warnings: ['QR content exceeds maximum length (4096 chars)'],
   };
 }

 // Detect content type and validate
 let type: SanitizedQRContent['type'] = 'unknown';

 // URL detection
 if (content.match(/^https?:\/\//i)) {
   type = 'url';
   const urlValidation = validateURL(content);
   if (!urlValidation.valid) {
     warnings.push(urlValidation.reason || 'Invalid URL');
     return { content: '', type, isValid: false, warnings };
   }
   content = urlValidation.sanitized!;
 }

 // Phone number detection
 else if (content.match(/^tel:/i) || content.match(/^\+?[\d\s\-\(\)]{7,20}$/)) {
   type = 'phone';
   const phoneValidation = validatePhone(content);
   if (!phoneValidation.valid) {
     warnings.push(phoneValidation.reason || 'Invalid phone number');
     return { content: '', type, isValid: false, warnings };
   }
 }

 // Email detection
 else if (content.match(/^mailto:/i) || content.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
   type = 'email';
   const emailValidation = validateEmail(content);
   if (!emailValidation.valid) {
     warnings.push(emailValidation.reason || 'Invalid email');
     return { content: '', type, isValid: false, warnings };
   }
 }

 // WiFi configuration detection
 else if (content.match(/^WIFI:/i)) {
   type = 'wifi';
   // WiFi strings are generally safe, but validate format
   if (!content.match(/^WIFI:T:[^;]*;P:[^;]*;S:[^;]*;H:[^;]*;;$/i) &&
       !content.match(/^WIFI:T:[^;]*;P:[^;]*;S:[^;]*;;$/i)) {
     warnings.push('Non-standard WiFi format');
   }
 }

 // vCard detection
 else if (content.match(/^BEGIN:VCARD/i)) {
   type = 'vcard';
   // vCard should be validated but basic structure check
   if (!content.match(/END:VCARD/i)) {
     warnings.push('Incomplete vCard');
   }
 }

 // Default to text
 else {
   type = 'text';
 }

 // Apply general sanitization for text content
 content = generalSanitize(content);

 // Check for potentially dangerous patterns
 const dangerPatterns = checkDangerousPatterns(content);
 if (dangerPatterns.length > 0) {
   warnings.push(...dangerPatterns.map(p => `Warning: ${p.pattern} detected`));
   // Log for security monitoring
   console.warn('[QR Security] Potentially dangerous QR content detected', {
     patterns: dangerPatterns.map(p => p.pattern),
     content: content.substring(0, 100),
   });
 }

 return {
   content,
   type,
   isValid: true,
   warnings,
 };
}

/**
 * Validate URL in QR content
 */
function validateURL(url: string): { valid: boolean; sanitized?: string; reason?: string } {
 try {
   // Check for valid protocol
   const protocols = ['http:', 'https:'];
   const parsed = new URL(url);

   if (!protocols.includes(parsed.protocol)) {
     return { valid: false, reason: 'Invalid URL protocol' };
   }

   // Block dangerous protocols
   const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
   if (dangerousProtocols.some(p => url.toLowerCase().includes(p))) {
     return { valid: false, reason: 'Dangerous protocol blocked' };
   }

   // Block internal IP ranges (prevent SSRF)
   const hostname = parsed.hostname;
   if (isPrivateIP(hostname)) {
     return { valid: false, reason: 'Private IP addresses not allowed' };
   }

   // Sanitize URL
   const sanitized = validator.escape(url);

   return { valid: true, sanitized };
 } catch {
   return { valid: false, reason: 'Invalid URL format' };
 }
}

/**
 * Validate phone number
 */
function validatePhone(phone: string): { valid: boolean; reason?: string } {
 // Remove tel: prefix if present
 let cleaned = phone.replace(/^tel:/i, '').trim();

 // Basic phone validation - allows +, digits, spaces, dashes, parentheses
 if (!cleaned.match(/^\+?[\d\s\-\(\)]{7,20}$/)) {
   return { valid: false, reason: 'Invalid phone number format' };
 }

 return { valid: true };
}

/**
 * Validate email address
 */
function validateEmail(email: string): { valid: boolean; reason?: string } {
 // Remove mailto: prefix if present
 let cleaned = email.replace(/^mailto:/i, '').trim();

 if (!validator.isEmail(cleaned)) {
   return { valid: false, reason: 'Invalid email format' };
 }

 return { valid: true };
}

/**
 * General sanitization for text content
 * Removes or escapes potentially dangerous characters
 */
function generalSanitize(content: string): string {
 // Use validator to escape HTML entities
 let sanitized = validator.escape(content);

 // Remove null bytes
 sanitized = sanitized.replace(/\0/g, '');

 // Normalize line endings
 sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

 return sanitized;
}

/**
 * Check for dangerous patterns in content
 */
interface DangerPattern {
 pattern: string;
 severity: 'low' | 'medium' | 'high';
}

function checkDangerousPatterns(content: string): DangerPattern[] {
 const patterns: DangerPattern[] = [];

 // JavaScript URLs
 if (content.match(/javascript:/i)) {
   patterns.push({ pattern: 'javascript:', severity: 'high' });
 }

 // Data URLs with script
 if (content.match(/data:text\/html/i) || content.match(/data:[^;]+;base64,/i)) {
   patterns.push({ pattern: 'data URL', severity: 'high' });
 }

 // Script tags
 if (content.match(/<script/i) || content.match(/<\/script>/i)) {
   patterns.push({ pattern: 'script tags', severity: 'high' });
 }

 // Event handlers
 if (content.match(/on\w+\s*=/i)) {
   patterns.push({ pattern: 'event handlers', severity: 'high' });
 }

 // SQL keywords (potential injection)
 if (content.match(/\b(union|select|insert|update|delete|drop|create|alter)\b/i)) {
   patterns.push({ pattern: 'SQL keywords', severity: 'medium' });
 }

 // Command injection patterns
 if (content.match(/[;&|`$]/)) {
   patterns.push({ pattern: 'shell characters', severity: 'medium' });
 }

 // Path traversal
 if (content.match(/\.\.\/|\.\.\\/)) {
   patterns.push({ pattern: 'path traversal', severity: 'medium' });
 }

 return patterns;
}

/**
 * Check if hostname is a private/internal IP
 */
function isPrivateIP(hostname: string): boolean {
 // Check for localhost
 if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
   return true;
 }

 // Check for private IP ranges
 const privateRanges = [
   /^10\./,
   /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
   /^192\.168\./,
   /^169\.254\./, // Link-local
   /^fc00:/i,     // IPv6 private
   /^fe80:/i,     // IPv6 link-local
 ];

 for (const range of privateRanges) {
   if (range.test(hostname)) {
     return true;
   }
 }

 return false;
}

/**
 * Validate and sanitize QR content for database storage
 * Use this before saving QR scan results
 */
export function validateForStorage(rawContent: string): {
 valid: boolean;
 sanitized: string;
 type: string;
 error?: string;
} {
 const result = sanitizeQRContent(rawContent);

 if (!result.isValid) {
   return {
     valid: false,
     sanitized: '',
     type: result.type,
     error: result.warnings.join('; '),
   };
 }

 return {
   valid: true,
   sanitized: result.content,
   type: result.type,
 };
}
