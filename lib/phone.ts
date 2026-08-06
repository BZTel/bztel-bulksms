/**
 * Utility functions for E.164 Phone Number Normalization and Validation
 * Specifically handles West African (Nigeria, Ghana) & Global international phone formats.
 */

export interface PhoneParseResult {
  normalized: string;
  original: string;
  isValid: boolean;
  country: string;
  error?: string;
}

/**
 * Converts a raw recipient phone number into a clean E.164 format without leading '+'
 * e.g., '07017193890' -> '2347017193890'
 * e.g., '+2348123456789' -> '2348123456789'
 * e.g., '0202225187' -> '233202225187'
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountry: 'NG' | 'GH' | 'US' = 'NG'): PhoneParseResult {
  const original = rawPhone ? rawPhone.trim() : '';
  if (!original) {
    return { normalized: '', original, isValid: false, country: 'UNKNOWN', error: 'Phone number is empty' };
  }

  // Strip all non-numeric characters except leading '+' if present
  let digits = original.replace(/[^0-9]/g, '');

  if (!digits) {
    return { normalized: '', original, isValid: false, country: 'UNKNOWN', error: 'No numeric digits found' };
  }

  let country = 'UNKNOWN';
  let normalized = digits;

  // 1. Check if already starts with a known Country Code
  if (digits.startsWith('234')) {
    country = 'NG';
    normalized = digits;
  } else if (digits.startsWith('233')) {
    country = 'GH';
    normalized = digits;
  } else if (digits.startsWith('1') && digits.length === 11) {
    country = 'US/CA';
    normalized = digits;
  } else if (digits.startsWith('44') && digits.length >= 11) {
    country = 'UK';
    normalized = digits;
  }
  // 2. Handle Local National Formats starting with '0'
  else if (digits.startsWith('0')) {
    const withoutZero = digits.slice(1);

    // Nigerian 11-digit local (e.g. 070..., 080..., 081..., 090..., 091...)
    if (digits.length === 11 && /^(70|80|81|90|91|70|80|81|90|91)/.test(withoutZero)) {
      country = 'NG';
      normalized = '234' + withoutZero;
    }
    // Ghanaian 10-digit local (e.g. 020..., 024..., 054..., 055...)
    else if (digits.length === 10 && /^(20|23|24|26|27|28|50|54|55|56|57|59)/.test(withoutZero)) {
      country = 'GH';
      normalized = '233' + withoutZero;
    }
    // UK 11-digit local (e.g. 07...)
    else if (digits.length === 11 && withoutZero.startsWith('7')) {
      country = 'UK';
      normalized = '44' + withoutZero;
    }
    // Default fallback for 11-digit local numbers starting with 0 -> Nigeria (234)
    else if (digits.length === 11) {
      country = defaultCountry;
      normalized = (defaultCountry === 'GH' ? '233' : '234') + withoutZero;
    }
    // Fallback for 10-digit local numbers starting with 0 -> Nigeria if default, else Ghana
    else if (digits.length === 10) {
      if (defaultCountry === 'GH') {
        country = 'GH';
        normalized = '233' + withoutZero;
      } else {
        country = 'NG';
        normalized = '234' + withoutZero;
      }
    }
  }
  // 3. Handle 10-digit local numbers missing leading zero (e.g., 7017193890 or 8031234567)
  else if (digits.length === 10 && /^[789]/.test(digits)) {
    country = 'NG';
    normalized = '234' + digits;
  }

  // Final Validation Check: Only Nigerian phone numbers (234) are supported at this time
  const isLengthValid = normalized.length >= 10 && normalized.length <= 15;
  const isValid = isLengthValid && country === 'NG' && normalized.length === 13;

  return {
    normalized,
    original,
    isValid,
    country,
    error: !isLengthValid
      ? `Invalid phone number length (${normalized.length} digits)`
      : (country !== 'NG' ? 'Only Nigerian phone numbers (+234) are allowed' : undefined)
  };
}

/**
 * Batch normalizes a array or comma-separated list of recipient phone numbers
 */
export function normalizeRecipientsList(recipients: string[] | string): { valid: string[]; invalid: string[]; details: PhoneParseResult[] } {
  let list: string[] = [];
  if (Array.isArray(recipients)) {
    list = recipients;
  } else if (typeof recipients === 'string') {
    list = recipients.split(',').map(r => r.trim()).filter(Boolean);
  }

  const valid: string[] = [];
  const invalid: string[] = [];
  const details: PhoneParseResult[] = [];

  for (const item of list) {
    const result = normalizePhoneNumber(item);
    details.push(result);
    if (result.isValid) {
      valid.push(result.normalized);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid, details };
}
