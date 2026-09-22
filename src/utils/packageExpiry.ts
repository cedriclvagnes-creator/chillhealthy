import { MemberAccount, MealPlan } from '../types';

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in local time.
 */
export function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Maps a plan ID or days count to standard validity workdays (Monday–Friday).
 * Starter: 14 weekdays (Mon-Fri)
 * 10-Day Kickstart: 20 weekdays (Mon-Fri)
 * 20-Day Transformation: 30 weekdays (Mon-Fri)
 * Others / Bulk Plans: 30 weekdays (Mon-Fri)
 */
export function getPlanValidityDays(planOrId?: MealPlan | string | number): number {
  if (typeof planOrId === 'number') return planOrId;
  if (!planOrId) return 30;

  if (typeof planOrId === 'object' && planOrId.validityDays) {
    return planOrId.validityDays;
  }

  const id = typeof planOrId === 'string' ? planOrId.toLowerCase() : planOrId.id.toLowerCase();
  if (id.includes('5-day') || id.includes('starter') || id.includes('p1')) return 14;
  if (id.includes('10-day') || id.includes('kickstart') || id.includes('p2')) return 20;
  return 30; // Default 30 Mon-Fri weekdays
}

/**
 * Calculates package expiry date based on Monday to Friday.
 * If admin suspends any weekday (public holiday or kitchen off-day), it extends by an extra day.
 *
 * @param startDateStr 'YYYY-MM-DD' - First day of meal ordering
 * @param validityDays number - e.g. 14, 20, 30 Mon-Fri weekdays
 * @param suspendedDates string[] - list of suspended dates ('YYYY-MM-DD')
 * @returns string 'YYYY-MM-DD' - the final valid weekday (inclusive)
 */
export function calculateMonFriExpiryDate(
  startDateStr: string,
  validityDays: number,
  suspendedDates: string[] = []
): string {
  if (!startDateStr || validityDays <= 0) return '';

  const suspendedSet = new Set(suspendedDates);
  const parts = startDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const cur = new Date(year, month, day, 12, 0, 0);

  let workdaysCounted = 0;
  let safetyLimit = 0;
  const maxIterations = validityDays * 4 + suspendedDates.length + 120;

  while (safetyLimit < maxIterations) {
    safetyLimit++;
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const curDateStr = `${yyyy}-${mm}-${dd}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSuspended = suspendedSet.has(curDateStr);

    if (!isWeekend && !isSuspended) {
      workdaysCounted++;
      if (workdaysCounted >= validityDays) {
        return curDateStr;
      }
    }

    // Move forward 1 calendar day
    cur.setDate(cur.getDate() + 1);
  }

  const yyyy = cur.getFullYear();
  const mm = String(cur.getMonth() + 1).padStart(2, '0');
  const dd = String(cur.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the effective expiry date for an active package.
 * Takes into account the first meal date, package validity workdays,
 * and any admin-suspended weekday off-days/holidays.
 */
export function getEffectivePackageExpiry(
  pkg: MemberAccount['activePackage'],
  suspendedDates: string[] = []
): {
  isActivated: boolean;
  effectiveExpiryDate: string;
  validityDays: number;
  remainingWorkdays: number;
  isExpired: boolean;
  statusLabelEn: string;
  statusLabelZh: string;
} {
  if (!pkg) {
    return {
      isActivated: false,
      effectiveExpiryDate: '',
      validityDays: 0,
      remainingWorkdays: 0,
      isExpired: false,
      statusLabelEn: 'No Active Package',
      statusLabelZh: '无有效套餐',
    };
  }

  const validityDays = pkg.validityDays || getPlanValidityDays(pkg.planId);
  const isActivated = Boolean(pkg.isActivated && pkg.firstRedeemedDate);

  // If not started yet, expiry countdown has not commenced
  if (!isActivated || !pkg.firstRedeemedDate) {
    return {
      isActivated: false,
      effectiveExpiryDate: 'Pending First Meal Order',
      validityDays,
      remainingWorkdays: validityDays,
      isExpired: false,
      statusLabelEn: `Pending 1st Meal Order (${validityDays} Mon–Fri weekdays)`,
      statusLabelZh: `等待首餐预订生效（共 ${validityDays} 个工作日）`,
    };
  }

  // Calculate dynamic expiry with holiday extension
  const effectiveExpiryDate = calculateMonFriExpiryDate(
    pkg.firstRedeemedDate,
    validityDays,
    suspendedDates
  );

  const todayStr = getTodayStr();
  const isExpired = todayStr > effectiveExpiryDate;
  const remainingWorkdays = countRemainingWorkdays(todayStr, effectiveExpiryDate, suspendedDates);

  let statusLabelEn = '';
  let statusLabelZh = '';

  if (isExpired) {
    statusLabelEn = `Expired on ${effectiveExpiryDate}`;
    statusLabelZh = `已于 ${effectiveExpiryDate} 到期`;
  } else if (remainingWorkdays === 0) {
    statusLabelEn = `Expires Today (${effectiveExpiryDate})`;
    statusLabelZh = `今天到期（${effectiveExpiryDate}）`;
  } else {
    statusLabelEn = `${remainingWorkdays} Mon–Fri weekdays left (until ${effectiveExpiryDate})`;
    statusLabelZh = `剩余 ${remainingWorkdays} 个工作日（有效期至 ${effectiveExpiryDate}）`;
  }

  return {
    isActivated: true,
    effectiveExpiryDate,
    validityDays,
    remainingWorkdays,
    isExpired,
    statusLabelEn,
    statusLabelZh,
  };
}

/**
 * Counts how many Mon-Fri workdays are between fromDateStr and toDateStr (inclusive),
 * excluding weekends and admin suspended dates.
 */
export function countRemainingWorkdays(
  fromDateStr: string,
  toDateStr: string,
  suspendedDates: string[] = []
): number {
  if (!fromDateStr || !toDateStr || fromDateStr > toDateStr) return 0;

  const suspendedSet = new Set(suspendedDates);
  const parts = fromDateStr.split('-');
  const cur = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    12,
    0,
    0
  );

  let count = 0;
  let safety = 0;

  while (safety < 300) {
    safety++;
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const curStr = `${yyyy}-${mm}-${dd}`;

    if (curStr > toDateStr) break;

    const dayOfWeek = cur.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSuspended = suspendedSet.has(curStr);

    if (!isWeekend && !isSuspended) {
      count++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return count;
}

/**
 * Checks if a member has unredeemed meals from an expired package that can be
 * auto-revived by re-subscribing to the same plan.
 */
export function checkPlanAutoReviveEligibility(
  member: MemberAccount | null | undefined,
  targetPlanId: string
): {
  canRevive: boolean;
  revivedMeals: number;
  planName: string;
  expiredAt: string;
} {
  if (!member) {
    return { canRevive: false, revivedMeals: 0, planName: '', expiredAt: '' };
  }

  // 1. Check lastExpiredPackage (saved after package expired/burned)
  if (
    member.lastExpiredPackage &&
    member.lastExpiredPackage.planId === targetPlanId &&
    !member.lastExpiredPackage.isRevived &&
    member.lastExpiredPackage.unredeemedMeals > 0
  ) {
    return {
      canRevive: true,
      revivedMeals: member.lastExpiredPackage.unredeemedMeals,
      planName: member.lastExpiredPackage.planName,
      expiredAt: member.lastExpiredPackage.expiredAt,
    };
  }

  // 2. Check current activePackage if it has expired and burned but not yet cleared
  if (
    member.activePackage &&
    member.activePackage.planId === targetPlanId &&
    member.activePackage.remainingMeals > 0
  ) {
    const today = getTodayStr();
    if (member.activePackage.expiryDate && today > member.activePackage.expiryDate) {
      return {
        canRevive: true,
        revivedMeals: member.activePackage.remainingMeals,
        planName: member.activePackage.planName,
        expiredAt: member.activePackage.expiryDate,
      };
    }
  }

  return { canRevive: false, revivedMeals: 0, planName: '', expiredAt: '' };
}

/**
 * Activates a package upon first meal ordering/redemption.
 * The package validity clock officially begins on the date of the first meal.
 */
export function activatePackageOnFirstOrder(
  pkg: NonNullable<MemberAccount['activePackage']>,
  firstMealDateStr: string,
  suspendedDates: string[] = []
): NonNullable<MemberAccount['activePackage']> {
  const validityDays = pkg.validityDays || getPlanValidityDays(pkg.planId);
  const calculatedExpiry = calculateMonFriExpiryDate(firstMealDateStr, validityDays, suspendedDates);

  return {
    ...pkg,
    isActivated: true,
    firstRedeemedDate: firstMealDateStr,
    validityDays,
    expiryDate: calculatedExpiry,
  };
}

/**
 * Checks a member's active package against today's date.
 * If expired and remaining meals > 0, marks package as burned and preserves
 * the unredeemed meals in `lastExpiredPackage` for auto-revive upon same plan re-subscription.
 */
export function evaluateMemberPackageExpiration(
  member: MemberAccount,
  suspendedDates: string[] = []
): {
  updatedMember: MemberAccount;
  didBurn: boolean;
  burnedMealsCount: number;
} {
  if (!member.activePackage) {
    return { updatedMember: member, didBurn: false, burnedMealsCount: 0 };
  }

  const pkg = member.activePackage;

  // If not activated yet, it never expires until the customer places their first meal order!
  if (!pkg.isActivated || !pkg.firstRedeemedDate) {
    return { updatedMember: member, didBurn: false, burnedMealsCount: 0 };
  }

  const effectiveInfo = getEffectivePackageExpiry(pkg, suspendedDates);
  const today = getTodayStr();

  // If expired and has remaining unredeemed meals
  if (effectiveInfo.isExpired && pkg.remainingMeals > 0) {
    const burnedCount = pkg.remainingMeals;
    const expiryStr = effectiveInfo.effectiveExpiryDate || pkg.expiryDate;

    const updatedMember: MemberAccount = {
      ...member,
      lastExpiredPackage: {
        planId: pkg.planId,
        planName: pkg.planName,
        planNameZh: pkg.planNameZh,
        unredeemedMeals: burnedCount,
        expiredAt: expiryStr,
        purchasedDate: pkg.purchasedDate,
        firstRedeemedDate: pkg.firstRedeemedDate,
        validityDays: pkg.validityDays,
        isRevived: false,
      },
      activePackage: {
        ...pkg,
        remainingMeals: 0,
        isBurned: true,
        expiryDate: expiryStr,
      },
      creditsHistory: [
        {
          id: `cr-burn-${Date.now()}`,
          date: today,
          type: 'burn',
          amount: -burnedCount,
          note: `🔥 Package expired on ${expiryStr}. ${burnedCount} unredeemed meal(s) burned. (Eligible for auto-revive on subscribing to the same plan)`,
        },
        ...member.creditsHistory,
      ],
    };

    return {
      updatedMember,
      didBurn: true,
      burnedMealsCount: burnedCount,
    };
  }

  return { updatedMember: member, didBurn: false, burnedMealsCount: 0 };
}
