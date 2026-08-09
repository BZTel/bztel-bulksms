/**
 * Centralized Validation and Sanitization Module
 * Enforces strict input validation, XSS prevention, and parameter sanitization.
 */

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input.trim().slice(0, maxLength));
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Valid E.164 phone number format (+1234567890 or local numbers)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(phone.trim().replace(/[\s-]/g, ''));
}

export function isValidSenderId(senderId: string): boolean {
  if (!senderId || typeof senderId !== 'string') return false;
  const trimmed = senderId.trim();
  // Sender ID should be 3-11 alphanumeric characters or valid phone number
  const senderRegex = /^[a-zA-Z0-9]{3,11}$/;
  return senderRegex.test(trimmed) || isValidPhone(trimmed);
}
