/**
 * Security utilities for input sanitization and validation
 * Protects against XSS, injection attacks, and other common vulnerabilities
 */

import DOMPurify from 'dompurify';

// ============================================
// HTML/XSS Protection
// ============================================

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this when you MUST render user-generated HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML entities for safe text display
 * Use this for displaying user input as plain text
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return String(text).replace(/[&<>"'`=/]/g, (s) => map[s]);
}

// ============================================
// Input Validation & Sanitization
// ============================================

/**
 * Sanitize string input - removes control characters and trims
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  
  // Remove control characters and null bytes
  const cleaned = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
  
  return cleaned;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  
  const email = input.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email) || email.length > 255) {
    return null;
  }
  
  return email;
}

/**
 * Validate UUID format
 */
export function isValidUUID(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  
  // Keep only digits, spaces, +, -, ()
  const cleaned = input.replace(/[^0-9+\-\s()]/g, '').trim();
  
  if (cleaned.length < 6 || cleaned.length > 20) {
    return null;
  }
  
  return cleaned;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: unknown, min?: number, max?: number): number | null {
  const num = sanitizeNumber(input, min, max);
  if (num === null) return null;
  return Math.floor(num);
}

// ============================================
// URL Safety
// ============================================

/**
 * Validate and sanitize URL for safe redirect
 * Prevents open redirect vulnerabilities
 */
export function sanitizeRedirectUrl(url: unknown, allowedOrigins: string[]): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS (except localhost for dev)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return null;
    }
    
    // Check against allowed origins
    if (!allowedOrigins.some(origin => parsed.origin === origin)) {
      return null;
    }
    
    return parsed.href;
  } catch {
    // If it's a relative URL, it's safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return null;
  }
}

/**
 * Encode URL parameters safely
 */
export function safeEncodeURIComponent(str: string): string {
  return encodeURIComponent(sanitizeString(str, 500));
}

// ============================================
// Content Security
// ============================================

/**
 * Check if content contains suspicious patterns
 * Returns true if potentially malicious
 */
export function containsSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /expression\s*\(/i, // CSS expressions
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /&#x?[0-9a-f]+;/i, // HTML entities that could bypass filters
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
}

// ============================================
// Rate Limiting (Client-side tracking)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Client-side rate limiting helper
 * Note: This is NOT a security measure, just UX improvement
 * Real rate limiting must be server-side
 */
export function checkClientRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================
// Logging Security
// ============================================

/**
 * Redact sensitive data from objects before logging
 */
export function redactSensitiveData<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie', 'credit_card', 'ssn']
): T {
  const redacted = { ...obj };
  
  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      (redacted as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      (redacted as Record<string, unknown>)[key] = redactSensitiveData(
        redacted[key] as Record<string, unknown>,
        sensitiveKeys
      );
    }
  }
  
  return redacted;
}
