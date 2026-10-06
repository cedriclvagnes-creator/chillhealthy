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

/**
 * Generates a clean, unique, tracking-friendly order number.
 * Format: CH-YYMMDD-XXXX (e.g. CH-261006-8492)
 */
export function generateUniqueOrderNumber(prefix: string = 'CH'): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yy}${mm}${dd}-${rand}`;
}

export interface OrderConfirmationAutoReplyData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: string;
  deliveryDate: string;
  deliverySlot: string;
  deliveryAddress: string;
  totalAmount?: number | string;
  paymentMethod?: string;
  dietaryNotes?: string;
  orderType?: string;
  quotaRemaining?: number;
}

/**
 * Builds the official automated confirmation reply dispatched to the customer's
 * registered WhatsApp number once an order or daily meal booking is completed.
 */
export function buildOrderConfirmationAutoReply(data: OrderConfirmationAutoReplyData): string {
  const amountStr =
    typeof data.totalAmount === 'number'
      ? `RM ${data.totalAmount.toFixed(2)}`
      : data.totalAmount || 'Paid via Package Credit / 免扣已扣餐券';

  const paymentStr =
    data.paymentMethod === 'duitnow'
      ? 'DuitNow QR Instant Pay (已通过 QR 付款)'
      : data.paymentMethod === 'whatsapp'
      ? 'WhatsApp Direct Pay (转账待对账)'
      : data.paymentMethod || 'Member Package Credit (会员套餐抵扣)';

  return (
    `🥗 *CHILL Healthy 潮轻食 · 订餐确认回执*\n` +
    `*Order Booking Confirmation Auto-Reply*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `尊敬的 *${data.customerName}*，您的订餐已成功确认！\n` +
    `Thank you! Your meal order has been securely scheduled with our kitchen team.\n\n` +
    `📋 *专属订单编号 / Order No:* #${data.orderNumber}\n` +
    `🍱 *预订餐品 / Items:*\n${data.items}\n` +
    `📅 *送餐日期 / Delivery Date:* ${data.deliveryDate}\n` +
    `⏰ *送餐时段 / Delivery Slot:* ${data.deliverySlot}\n` +
    `📍 *送达地址 / Delivery Address:* ${data.deliveryAddress}\n` +
    `💰 *总计金额 / Total Amount:* ${amountStr}\n` +
    `💳 *付款状态 / Payment Mode:* ${paymentStr}\n` +
    (data.dietaryNotes ? `⚠️ *忌口备注 / Dietary Notes:* ${data.dietaryNotes}\n` : '') +
    (typeof data.quotaRemaining === 'number' ? `🎟️ *套餐剩余餐券 / Remaining Balance:* ${data.quotaRemaining} 餐\n` : '') +
    `\n📦 *订单状态 / Current Status:* 后厨已接单安排备餐 (Kitchen Prepping)\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🌿 *潮轻食品质保证：*\n` +
    `坚持每日清晨 65°C 低温慢煮现做，0%味精添加，准时送达。\n` +
    `如需修改地址或日期，请在送餐前一天 5:00 PM 前联系客服。\n\n` +
    `📞 官方客服 WhatsApp: ${OFFICIAL_WA_DISPLAY}\n` +
    `🌐 官网追踪: www.chill-healthy.com\n` +
    `祝您健康美味每一天！❤️`
  );
}

/**
 * Builds the direct WhatsApp click URL for sending confirmation auto-reply
 * directly to the customer's registered Malaysian WhatsApp number.
 */
export function buildCustomerWhatsAppAutoReplyUrl(
  customerPhone: string,
  data: OrderConfirmationAutoReplyData
): string {
  const replyMessage = buildOrderConfirmationAutoReply(data);
  return buildWhatsAppUrl(customerPhone, replyMessage);
}

