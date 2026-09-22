import { MemberAccount, Language } from '../types';

/**
 * Returns or generates a clean, memorable referral code for a member.
 * e.g., 'CHILL-AGNES9919'
 */
export function getMemberReferralCode(member: Partial<MemberAccount>): string {
  if (member.referralCode && member.referralCode.trim()) {
    return member.referralCode.trim().toUpperCase();
  }
  const cleanPhone = (member.phone || member.memberNumber || member.id || '').replace(/\D/g, '');
  const phoneSuffix = cleanPhone.slice(-4) || '8888';
  const cleanName = (member.name || 'VIP').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'VIP';
  return `CHILL-${cleanName}${phoneSuffix}`;
}

/**
 * Finds an existing member matching a referral code or phone number.
 */
export function findMemberByReferralCode(
  members: MemberAccount[],
  inputCode: string
): MemberAccount | undefined {
  if (!inputCode) return undefined;
  const clean = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const cleanNumeric = inputCode.replace(/\D/g, '');

  return members.find((m) => {
    const directCode = (m.referralCode || '').trim().toUpperCase();
    const generated = getMemberReferralCode(m).toUpperCase();
    const mPhone = (m.phone || '').replace(/\D/g, '');
    const mNum = (m.memberNumber || '').replace(/\D/g, '');

    if (directCode && clean === directCode) return true;
    if (clean === generated) return true;
    if (cleanNumeric && cleanNumeric.length >= 8 && (cleanNumeric === mPhone || cleanNumeric === mNum)) {
      return true;
    }
    return false;
  });
}

/**
 * Builds a shareable web link with referral query parameter.
 */
export function buildReferralShareUrl(referralCode: string): string {
  if (typeof window === 'undefined') return `https://chill-healthy.com/?ref=${referralCode}`;
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Generates a pre-composed WhatsApp invitation message for friends.
 */
export function buildReferralWhatsAppMessage(
  memberName: string,
  referralCode: string,
  language: Language
): string {
  const shareLink = buildReferralShareUrl(referralCode);

  if (language === 'en') {
    return encodeURIComponent(
      `Hi! 👋 I've been enjoying fresh, chef-cooked healthy meal boxes from *CHILL Healthy* (chill-healthy.com) in Klang Valley! 🍱🥗\n\n` +
      `Order any meal plan using my personal Referral Code: *${referralCode}*\n\n` +
      `🔗 Order here: ${shareLink}\n\n` +
      `Enjoy fresh, nutritious weekday meals delivered right to your desk or home!`
    );
  }

  return encodeURIComponent(
    `哈喽！👋 我正在订购 *CHILL Healthy 潮轻食* 的营养健康餐盒（chill-healthy.com）！🍱🥗\n\n` +
    `工作日无需烦恼吃什么，大厨现做少油低卡热食，巴生谷免运费准时送达工位或家中。\n\n` +
    `订购任何健康餐配套时，输入我的专属推荐码：*${referralCode}*\n\n` +
    `🔗 立即订购：${shareLink}`
  );
}
