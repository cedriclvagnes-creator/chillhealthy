import { MemberAccount, MealPlan, OfficialReceipt, SiteSettings } from '../types';
import { OFFICIAL_WA_DISPLAY } from './whatsapp';

export const COMPANY_NAME = 'CHILL HEALTHY SDN. BHD.';
export const COMPANY_REG_NO = '202401029841 (1568291-A)';
export const DEFAULT_KITCHEN_ADDRESS = '18, Jalan Astaka U8/88, Bukit Jelutong, 40150 Shah Alam, Selangor';

/**
 * Generates an official receipt number in the format:
 * CHILL-REC-YYYYMMDD-XXXX
 */
export function generateReceiptNumber(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CHILL-REC-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Builds a default OfficialReceipt object for a specific customer and meal plan.
 */
export function createDefaultOfficialReceipt(
  member: MemberAccount,
  selectedPlan: MealPlan | { id: string; title: string; titleZh?: string; mealsTotal: number; totalPrice: number },
  settings?: SiteSettings,
  paymentMethod: string = 'DuitNow QR / Instant Transfer',
  paymentRef?: string
): OfficialReceipt {
  const receiptNum = generateReceiptNumber();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const totalMeals = selectedPlan.mealsTotal || 20;
  const totalPrice = selectedPlan.totalPrice || 398;
  const unitPrice = totalMeals > 0 ? totalPrice / totalMeals : 19.9;

  return {
    id: receiptNum,
    receiptNumber: receiptNum,
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    memberEmail: member.email || '',
    memberAddress: member.address || '',
    memberArea: member.area || '',
    memberPostalCode: member.postalCode || '',
    memberAddress2: member.address2,
    memberArea2: member.area2,
    memberPostalCode2: member.postalCode2,
    planId: selectedPlan.id,
    planName: selectedPlan.title,
    planNameZh: (selectedPlan as any).titleZh || selectedPlan.title,
    totalMeals: totalMeals,
    bonusMeals: member.referralBonusMealsEarned || 0,
    unitPrice: Number(unitPrice.toFixed(2)),
    totalAmount: Number(totalPrice.toFixed(2)),
    paymentMethod,
    paymentReference: paymentRef || `DN-${Date.now().toString().slice(-8)}`,
    paymentConfirmed: true,
    paymentConfirmedAt: `${dateStr} ${timeStr}`,
    confirmedBy: 'CHILL Back Office Finance',
    issuedAt: `${dateStr} ${timeStr}`,
    notes: 'Payment confirmed & received via verified banking portal. Meal plan activated on member account.',
    companyName: COMPANY_NAME,
    companyRegNo: COMPANY_REG_NO,
    kitchenAddress: settings?.kitchenAddress || DEFAULT_KITCHEN_ADDRESS,
    kitchenContact: settings?.whatsappDisplay || OFFICIAL_WA_DISPLAY,
  };
}

/**
 * Generates an official WhatsApp formatted text for the receipt so it can be sent to the customer.
 */
export function buildReceiptWhatsAppMessage(receipt: OfficialReceipt): string {
  return (
    `*═══════════════════════════*%0A` +
    `🥗 *CHILL HEALTHY — OFFICIAL RECEIPT* 🥗%0A` +
    `*${receipt.companyName || COMPANY_NAME}*%0A` +
    `_Co. Reg: ${receipt.companyRegNo || COMPANY_REG_NO}_%0A` +
    `*═══════════════════════════*%0A%0A` +
    `*Receipt No:* ${receipt.receiptNumber}%0A` +
    `*Date & Time:* ${receipt.issuedAt}%0A` +
    `*Status:* 🟢 *PAYMENT CONFIRMED & RECEIVED (PAID)*%0A%0A` +
    `👤 *CUSTOMER DETAILS:*%0A` +
    `• *Name:* ${receipt.memberName}%0A` +
    `• *Account / Phone:* ${receipt.memberPhone}%0A` +
    `• *Delivery Address:* ${receipt.memberAddress}, ${receipt.memberArea} ${receipt.memberPostalCode}%0A` +
    (receipt.memberAddress2 ? `• *Secondary Address:* ${receipt.memberAddress2}, ${receipt.memberArea2 || ''} ${receipt.memberPostalCode2 || ''}%0A` : '') +
    `%0A📦 *PACKAGE ORDER DETAILS:*%0A` +
    `• *Subscribed Plan:* ${receipt.planName} ${receipt.planNameZh ? `(${receipt.planNameZh})` : ''}%0A` +
    `• *Total Meals Included:* ${receipt.totalMeals} Meals${receipt.bonusMeals && receipt.bonusMeals > 0 ? ` (+${receipt.bonusMeals} Bonus Free Meals)` : ''}%0A` +
    `• *Delivery:* Included (Free Mon–Fri Klang Valley lunch delivery)%0A%0A` +
    `💰 *PAYMENT BREAKDOWN:*%0A` +
    `• *Subtotal:* RM ${receipt.totalAmount.toFixed(2)}%0A` +
    `• *Delivery & Packaging:* RM 0.00 (COMPLIMENTARY)%0A` +
    `• *Grand Total Paid:* *RM ${receipt.totalAmount.toFixed(2)}*%0A` +
    `• *Payment Method:* ${receipt.paymentMethod}%0A` +
    `• *Bank Ref / Txn ID:* ${receipt.paymentReference || 'VERIFIED'}%0A` +
    `• *Confirmed By:* ${receipt.confirmedBy}%0A%0A` +
    `*═══════════════════════════*%0A` +
    `Thank you for subscribing to CHILL Healthy! Your meals are ready to be redeemed daily through our Member Portal.%0A` +
    `Kitchen Hotline: ${receipt.kitchenContact || OFFICIAL_WA_DISPLAY}`
  );
}
