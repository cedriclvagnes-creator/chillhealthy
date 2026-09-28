/**
 * Malaysian Handphone (Mobile) Number Validation & Normalization Utility
 *
 * Rules for eligible Malaysian Mobile Handphone Numbers:
 * - Mobile prefixes strictly start with 01 (e.g. 010, 011, 012, 013, 014, 015, 016, 017, 018, 019).
 * - Prefix 011 is followed by 8 digits (total 11 digits, e.g. 011-1234 5678).
 * - Prefixes 010, 012, 013, 014, 015, 016, 017, 018, 019 are followed by 7 or 8 digits (total 10 to 11 digits, e.g. 012-618 9919).
 * - Landlines (03 KL/Selangor, 04 Penang, 05 Perak, 06 Melaka, 07 Johor, 08 Sabah/Sarawak, 09 East Coast)
 *   are NOT eligible as mobile/WhatsApp login IDs.
 */

export function normalizeMalaysianPhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('60')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('0')) {
    // already starts with 0
  } else if (digits.startsWith('1')) {
    // e.g. 126189919 -> 0126189919
    digits = '0' + digits;
  }

  return digits;
}

/**
 * Validates whether an input string is an eligible Malaysian handphone number.
 */
export function isValidMalaysianHandphone(input: string): boolean {
  if (!input) return false;
  const normalized = normalizeMalaysianPhone(input);

  // Must match 011 + 8 digits OR 01[0,2-9] + 7 to 8 digits
  return /^01(1[0-9]{8}|[02-9][0-9]{7,8})$/.test(normalized);
}

/**
 * Formats normalized or raw phone for clean display:
 * 01112345678 -> 011-1234 5678
 * 0126189919  -> 012-618 9919
 */
export function formatMalaysianPhone(input: string): string {
  const norm = normalizeMalaysianPhone(input);
  if (!norm) return input;

  if (norm.startsWith('011') && norm.length === 11) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 7)} ${norm.slice(7)}`;
  }

  if (norm.length === 10) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 6)} ${norm.slice(6)}`;
  }

  if (norm.length === 11) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 7)} ${norm.slice(7)}`;
  }

  return norm;
}

/**
 * Converts Malaysian phone to international format without + (e.g. 60126189919)
 * for WhatsApp links.
 */
export function toWhatsAppNumber(input: string): string {
  const norm = normalizeMalaysianPhone(input);
  if (norm.startsWith('0')) {
    return '60' + norm.slice(1);
  }
  return norm;
}

/**
 * Returns human-friendly validation error message or null if valid.
 */
export function getMalaysianPhoneError(
  input: string,
  language: 'en' | 'zh'
): string | null {
  if (!input || !input.trim()) {
    return language === 'en'
      ? 'Please enter your Malaysian handphone number.'
      : '请填写您的马来西亚手机号码。';
  }

  const normalized = normalizeMalaysianPhone(input);

  if (!normalized.startsWith('01')) {
    return language === 'en'
      ? 'Must be an eligible Malaysian mobile handphone number starting with 01 (e.g. 012, 011, 016, 019). Landlines are not supported.'
      : '必须是以 01 开头的有效马来西亚手机号码（如 012、011、016、019 等），暂不支持固定电话。';
  }

  if (normalized.length < 10) {
    return language === 'en'
      ? `Phone number too short (${normalized.length} digits). Malaysian mobile numbers have 10–11 digits.`
      : `号码位数不足（当前 ${normalized.length} 位）。马来西亚手机号应为 10–11 位。`;
  }

  if (normalized.length > 11) {
    return language === 'en'
      ? `Phone number too long (${normalized.length} digits). Malaysian mobile numbers have 10–11 digits.`
      : `号码位数超出（当前 ${normalized.length} 位）。马来西亚手机号应为 10–11 位。`;
  }

  if (!isValidMalaysianHandphone(input)) {
    return language === 'en'
      ? 'Invalid Malaysian mobile format. Example: 012-618 9919 or 011-1234 5678.'
      : '马来西亚手机号码格式无效。参考示例：012-618 9919 或 011-1234 5678。';
  }

  return null;
}
