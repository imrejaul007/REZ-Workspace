// Input validation and sanitization utilities

export interface ValidationError {
  field: string;
  message: string;
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validatePostContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Post content is required' });
  }
  
  if (content.length > 2000) {
    errors.push({ field: 'content', message: 'Post content cannot exceed 2000 characters' });
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /data:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push({ field: 'content', message: 'Post contains invalid content' });
      break;
    }
  }
  
  return errors;
}

export function validateImageFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push({ field: 'image', message: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed' });
  }
  
  if (file.size > maxSize) {
    errors.push({ field: 'image', message: 'Image size cannot exceed 5MB' });
  }
  
  return errors;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// Rate limiting for client-side
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  getRemainingTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const timeToWait = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeToWait);
  }
}