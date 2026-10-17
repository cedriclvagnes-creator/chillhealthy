import { MemberAccount, MealPlan, OfficialReceipt, SiteSettings } from '../types';
import { OFFICIAL_WA_DISPLAY } from './whatsapp';

export const COMPANY_NAME = 'Chill Healthy Trading';
export const COMPANY_REG_NO = '003786393-M';
export const COMPANY_FULL_NAME = 'Chill Healthy Trading (003786393-M)';
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
  const companyTitle =
    receipt.companyName && !receipt.companyName.includes('SDN. BHD.')
      ? receipt.companyName
      : COMPANY_NAME;
  const regNo =
    receipt.companyRegNo && !receipt.companyRegNo.includes('202401029841')
      ? receipt.companyRegNo
      : COMPANY_REG_NO;

  return (
    `*═══════════════════════════*\n` +
    `🥗 *CHILL HEALTHY — OFFICIAL RECEIPT* 🥗\n` +
    `*${companyTitle} (${regNo})*\n` +
    `_Co. Reg. No: ${regNo}_\n` +
    `*═══════════════════════════*\n\n` +
    `*Receipt No:* ${receipt.receiptNumber}\n` +
    `*Date & Time:* ${receipt.issuedAt}\n` +
    `*Status:* 🟢 *PAYMENT CONFIRMED & RECEIVED (PAID)*\n\n` +
    `👤 *CUSTOMER DETAILS:*\n` +
    `• *Name:* ${receipt.memberName}\n` +
    `• *Account / Phone:* ${receipt.memberPhone}\n` +
    `• *Delivery Address:* ${receipt.memberAddress}, ${receipt.memberArea} ${receipt.memberPostalCode}\n` +
    (receipt.memberAddress2 ? `• *Secondary Address:* ${receipt.memberAddress2}, ${receipt.memberArea2 || ''} ${receipt.memberPostalCode2 || ''}\n` : '') +
    `\n📦 *PACKAGE ORDER DETAILS:*\n` +
    `• *Subscribed Plan:* ${receipt.planName} ${receipt.planNameZh ? `(${receipt.planNameZh})` : ''}\n` +
    `• *Total Meals Included:* ${receipt.totalMeals} Meals${receipt.bonusMeals && receipt.bonusMeals > 0 ? ` (+${receipt.bonusMeals} Bonus Free Meals)` : ''}\n` +
    `• *Package Validity Standard:* ${receipt.totalMeals === 5 ? '8 Days (5 Meals)' : receipt.totalMeals === 10 ? '15 Days (10 Meals)' : '30 Days (20 Meals)'} (Mon–Fri only)\n` +
    `• *Klang Valley Holiday Rule:* Official public holidays automatically extend validity (+1 day)\n` +
    `• *Delivery:* Included (Free Mon–Fri Klang Valley lunch delivery)\n\n` +
    `💰 *PAYMENT BREAKDOWN:*\n` +
    `• *Subtotal:* RM ${receipt.totalAmount.toFixed(2)}\n` +
    `• *Delivery & Packaging:* RM 0.00 (COMPLIMENTARY)\n` +
    `• *Grand Total Paid:* *RM ${receipt.totalAmount.toFixed(2)}*\n` +
    `• *Payment Method:* ${receipt.paymentMethod}\n` +
    `• *Bank Ref / Txn ID:* ${receipt.paymentReference || 'VERIFIED'}\n` +
    `• *Confirmed By:* ${receipt.confirmedBy}\n\n` +
    `*═══════════════════════════*\n` +
    `Thank you for subscribing to CHILL Healthy! Your meals are ready to be redeemed daily through our Member Portal.\n` +
    `Kitchen Hotline: ${receipt.kitchenContact || OFFICIAL_WA_DISPLAY}`
  );
}
