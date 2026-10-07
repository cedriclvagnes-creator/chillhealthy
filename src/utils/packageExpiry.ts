import { MemberAccount, MealPlan } from '../types';
import { getAllMalaysiaBankHolidays, MalaysiaBankHoliday } from './malaysiaHolidays';

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
 * Cache of all official Malaysia Klang Valley weekday bank public holidays.
 * Covers Kuala Lumpur and Selangor gazetted holidays including Section 3 replacement days.
 */
let cachedMalaysiaWeekdayHolidays: Map<string, MalaysiaBankHoliday> | null = null;

export function getMalaysiaKlangValleyWeekdayHolidaysMap(): Map<string, MalaysiaBankHoliday> {
  if (!cachedMalaysiaWeekdayHolidays) {
    const map = new Map<string, MalaysiaBankHoliday>();
    const all = getAllMalaysiaBankHolidays();
    for (const h of all) {
      if (h.isWeekday) {
        map.set(h.date, h);
      }
    }
    cachedMalaysiaWeekdayHolidays = map;
  }
  return cachedMalaysiaWeekdayHolidays;
}

/**
 * Maps a plan ID or days count to standard validity workdays (Monday–Friday).
 * Official Rules:
 * - 20 Meals / 20-Day: 30 Mon-Fri workdays validity
 * - 10 Meals / 10-Day: 15 Mon-Fri workdays validity
 * - 5 Meals / 5-Day: 8 Mon-Fri workdays validity
 * - Team / Multi-person plans (based on 20 delivery days): 30 Mon-Fri workdays validity
 */
export function getPlanValidityDays(planOrId?: MealPlan | string | number): number {
  if (typeof planOrId === 'number') {
    if (planOrId === 5) return 8;
    if (planOrId === 10) return 15;
    if (planOrId === 20 || planOrId === 40 || planOrId === 60 || planOrId === 80 || planOrId === 120) return 30;
    return planOrId > 0 ? planOrId : 30;
  }
  if (!planOrId) return 30;

  if (typeof planOrId === 'object') {
    if (planOrId.mealsTotal === 5 || planOrId.days === 5) return 8;
    if (planOrId.mealsTotal === 10 || planOrId.days === 10) return 15;
    if (planOrId.mealsTotal === 20 || planOrId.days === 20 || (planOrId.persons && planOrId.persons >= 2)) return 30;
    if (planOrId.validityDays) {
      return planOrId.validityDays;
    }
  }

  const str = String(planOrId).toLowerCase();
  // 5 Meals / 5 Days
  if (
    str.includes('5-day') ||
    str.includes('5-meal') ||
    str.includes('5 meal') ||
    str.includes('5天') ||
    str.includes('5餐') ||
    str.includes('starter') ||
    str.includes('p1') ||
    /\b5\s*(meal|day|餐|天)/i.test(str)
  ) {
    return 8;
  }
  // 10 Meals / 10 Days
  if (
    str.includes('10-day') ||
    str.includes('10-meal') ||
    str.includes('10 meal') ||
    str.includes('10天') ||
    str.includes('10餐') ||
    str.includes('kickstart') ||
    str.includes('p2') ||
    /\b10\s*(meal|day|餐|天)/i.test(str)
  ) {
    return 15;
  }
  // 20 Meals / 20 Days & All Other Plans default to 30 Days
  return 30;
}

/**
 * Calculates package expiry date based strictly on Monday to Friday.
 * Automatically synchronizes Malaysia Klang Valley public holidays:
 * Any gazetted public holiday (or custom kitchen suspended date) that falls on a Monday–Friday
 * automatically extends the package validity by +1 extra workday so customers never lose meal days.
 *
 * @param startDateStr 'YYYY-MM-DD' - First day of meal ordering
 * @param validityDays number - 30 days for 20 meals, 15 days for 10 meals, 8 days for 5 meals
 * @param customSuspendedDates string[] - optional additional suspended dates ('YYYY-MM-DD')
 * @returns string 'YYYY-MM-DD' - the final valid weekday (inclusive)
 */
export function calculateMonFriExpiryDate(
  startDateStr: string,
  validityDays: number,
  customSuspendedDates: string[] = []
): string {
  if (!startDateStr || validityDays <= 0) return '';

  const holidaysMap = getMalaysiaKlangValleyWeekdayHolidaysMap();
  const suspendedSet = new Set(customSuspendedDates);

  const parts = startDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const cur = new Date(year, month, day, 12, 0, 0);

  let workdaysCounted = 0;
  let safetyLimit = 0;
  const maxIterations = validityDays * 5 + holidaysMap.size + customSuspendedDates.length + 180;

  while (safetyLimit < maxIterations) {
    safetyLimit++;
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const curDateStr = `${yyyy}-${mm}-${dd}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaysMap.has(curDateStr);
    const isCustomSuspended = suspendedSet.has(curDateStr);

    // Deliveries are Monday to Friday only, excluding weekends & public holidays/suspended days
    if (!isWeekend && !isHoliday && !isCustomSuspended) {
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
 * Detailed package validity calculation result for customer reference.
 */
export interface PackageValidityCalculationResult {
  validityDays: number;
  startDate: string;
  expiryDate: string;
  totalCalendarDays: number;
  weekdaysCount: number;
  weekendDaysExcluded: number;
  holidaysEncountered: MalaysiaBankHoliday[];
  extendedHolidaysCount: number;
  descriptionEn: string;
  descriptionZh: string;
}

/**
 * Provides comprehensive validity date calculation and public holiday breakdown
 * for customer reference.
 */
export function getDetailedPackageValidity(
  startDateStr: string,
  planOrValidityDays: MealPlan | string | number,
  customSuspendedDates: string[] = []
): PackageValidityCalculationResult {
  const baseStart = startDateStr || getTodayStr();
  const validityDays = getPlanValidityDays(planOrValidityDays);
  const holidaysMap = getMalaysiaKlangValleyWeekdayHolidaysMap();
  const suspendedSet = new Set(customSuspendedDates);

  const parts = baseStart.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const cur = new Date(year, month, day, 12, 0, 0);

  let workdaysCounted = 0;
  let weekendDaysExcluded = 0;
  const holidaysEncountered: MalaysiaBankHoliday[] = [];
  let totalCalendarDays = 0;
  let safetyLimit = 0;
  let expiryDate = baseStart;

  while (safetyLimit < 500) {
    safetyLimit++;
    totalCalendarDays++;
    const dayOfWeek = cur.getDay();
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const curDateStr = `${yyyy}-${mm}-${dd}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hol = holidaysMap.get(curDateStr);
    const isCustomSuspended = suspendedSet.has(curDateStr);

    if (isWeekend) {
      weekendDaysExcluded++;
    } else if (hol) {
      holidaysEncountered.push(hol);
    } else if (isCustomSuspended) {
      holidaysEncountered.push({
        date: curDateStr,
        nameEn: 'Kitchen Suspended Day',
        nameZh: '厨房停送休息日',
        dayOfWeek,
        dayOfWeekName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        isWeekday: true,
      });
    } else {
      workdaysCounted++;
      if (workdaysCounted >= validityDays) {
        expiryDate = curDateStr;
        break;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  const extCount = holidaysEncountered.length;
  const descriptionEn = `${validityDays} Mon–Fri weekdays (${extCount > 0 ? `+${extCount} public holiday extension${extCount > 1 ? 's' : ''}` : 'Mon–Fri only'}) · Valid until ${expiryDate}`;
  const descriptionZh = `${validityDays}个工作日有效期（${extCount > 0 ? `遇巴生谷公假顺延+${extCount}天` : '仅限周一至五'}）· 有效期至 ${expiryDate}`;

  return {
    validityDays,
    startDate: baseStart,
    expiryDate,
    totalCalendarDays,
    weekdaysCount: workdaysCounted,
    weekendDaysExcluded,
    holidaysEncountered,
    extendedHolidaysCount: extCount,
    descriptionEn,
    descriptionZh,
  };
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
  const standardExpiryDate = calculateMonFriExpiryDate(
    pkg.firstRedeemedDate,
    validityDays,
    suspendedDates
  );

  // If admin has set a special case adjusted expiry date or manually set a future expiry date:
  const effectiveExpiryDate =
    pkg.specialCaseAdjustedExpiryDate ||
    (pkg.expiryDate && pkg.expiryDate > standardExpiryDate ? pkg.expiryDate : standardExpiryDate);

  const todayStr = getTodayStr();
  const isExpired = !pkg.specialCaseExtension && todayStr > effectiveExpiryDate;
  const remainingWorkdays = countRemainingWorkdays(todayStr, effectiveExpiryDate, suspendedDates);

  let statusLabelEn = '';
  let statusLabelZh = '';

  if (pkg.specialCaseExtension) {
    statusLabelEn = `Special Case Active (Extended until ${effectiveExpiryDate})`;
    statusLabelZh = `特批顺延生效中（有效期至 ${effectiveExpiryDate}）`;
  } else if (isExpired) {
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

  const holidaysMap = getMalaysiaKlangValleyWeekdayHolidaysMap();
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
    const isHoliday = holidaysMap.has(curStr);
    const isSuspended = suspendedSet.has(curStr);

    if (!isWeekend && !isHoliday && !isSuspended) {
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
