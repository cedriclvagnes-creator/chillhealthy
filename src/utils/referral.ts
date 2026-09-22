import { MemberAccount, Language } from '../types';

export const MIN_REFERRAL_PLAN_PRICE = 398;

export interface ReferralEligibilityResult {
  eligible: boolean;
  reason?: 'existing_account' | 'below_min_price' | 'self_referral' | 'not_found';
  messageEn: string;
  messageZh: string;
}

/**
 * Validates if an order is eligible for the referral free meal credit:
 * - Must be a new account sign up (not existing member renewing)
 * - Must purchase a meal plan of RM398 and above (e.g. 20-Day Plan, 2-Person Plan, etc.)
 */
export function checkReferralRewardEligibility(params: {
  planPrice: number;
  isNewAccount: boolean;
  isSelfReferral?: boolean;
}): ReferralEligibilityResult {
  if (params.isSelfReferral) {
    return {
      eligible: false,
      reason: 'self_referral',
      messageEn: 'You cannot use your own referral code.',
      messageZh: '不能使用您自己的推荐码。',
    };
  }

  if (!params.isNewAccount) {
    return {
      eligible: false,
      reason: 'existing_account',
      messageEn:
        'Referral free meal bonus is exclusively available for new account first-time sign-ups.',
      messageZh: '推荐免费餐券仅限新用户首次注册新账户时生效。',
    };
  }

  if (params.planPrice < MIN_REFERRAL_PLAN_PRICE) {
    return {
      eligible: false,
      reason: 'below_min_price',
      messageEn: `Referral free meal requires subscribing to a plan of RM${MIN_REFERRAL_PLAN_PRICE} and above (20-Day Transformation or Multi-Person Plans). Current plan is RM${params.planPrice.toFixed(0)}.`,
      messageZh: `推荐免费餐券仅适用于订购 RM${MIN_REFERRAL_PLAN_PRICE} 及以上的餐食配套（20天月度计划或多人配套）。当前配套为 RM${params.planPrice.toFixed(0)}。`,
    };
  }

  return {
    eligible: true,
    messageEn: `Eligible! Your referrer will receive +1 Free Meal Credit upon confirmation of your new account (RM${params.planPrice.toFixed(0)} plan).`,
    messageZh: `符合资格！订单确认后，您的推荐人将获得 +1 份免费餐券（新账户首次订购 RM${params.planPrice.toFixed(0)} 配套奖励）。`,
  };
}

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
      `Sign up for a new account with any meal plan of *RM398 and above* (like the 20-Day Lifestyle Plan or Multi-Person Plans) using my Referral Code: *${referralCode}*\n\n` +
      `🔗 Order here: ${shareLink}\n\n` +
      `Enjoy delicious calorie-controlled, high-protein weekday meals delivered right to your desk or doorstep!`
    );
  }

  return encodeURIComponent(
    `哈喽！👋 我正在订购 *CHILL Healthy 潮轻食* 的营养健康餐盒（chill-healthy.com）！🍱🥗\n\n` +
    `大厨每日现做低卡高蛋白热食，巴生谷免运费送达工位或家中。\n\n` +
    `新用户注册并订购 *RM398 及以上* 餐食配套（如20天月度计划或多人套餐）时，输入我的专属推荐码：*${referralCode}*\n\n` +
    `🔗 立即订购开启健康饮食：${shareLink}`
  );
}
