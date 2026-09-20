/**
 * Centralized WhatsApp utilities for CHILL Healthy
 * Official WhatsApp Number: +60126189919
 */

export const OFFICIAL_WA_DIGITS = '126189919';
export const OFFICIAL_WA_INTERNATIONAL = '60126189919';
export const OFFICIAL_WA_DISPLAY = '+60126189919';

/**
 * Normalizes any phone string (e.g. "+6012-618 9919", "0126189919", "60126189919")
 * into the 9-digit local suffix (e.g. "126189919").
 */
export function normalizePhoneDigits(phone?: string): string {
  if (!phone) return OFFICIAL_WA_DIGITS;
  const digits = phone.replace(/\D/g, '');
  // Strip leading 60 or 0
  const clean = digits.replace(/^(60|0)/, '');
  return clean || OFFICIAL_WA_DIGITS;
}

/**
 * Generates an accurate, click-ready WhatsApp URL:
 * https://wa.me/60126189919 (Guaranteed to always start with https://wa.me/60 and never duplicate country codes)
 */
export function buildWhatsAppUrl(phone?: string, message?: string): string {
  const digits = normalizePhoneDigits(phone);
  const baseUrl = `https://wa.me/60${digits}`;
  if (message && message.trim().length > 0) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}
