/**
 * Malaysia Bank Public Holidays Data & Synchronization Utility
 *
 * Covers official Federal & National Public Holidays observed by Bank Negara Malaysia (BNM)
 * and commercial banks in Malaysia (specifically Kuala Lumpur & Selangor / Klang Valley).
 *
 * Key Banking Rule (Holidays Act 1951, Section 3):
 * When a gazetted public holiday falls on a weekend (Sunday), the following Monday is
 * officially observed by Malaysian banks as a replacement public holiday (Cuti Gantian).
 */

export interface MalaysiaBankHoliday {
  date: string; // 'YYYY-MM-DD'
  nameEn: string;
  nameZh: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayOfWeekName: string; // 'Monday', 'Tuesday', ...
  isWeekday: boolean; // Monday to Friday
  isReplacement?: boolean;
  originalHolidayName?: string;
  notes?: string;
}

// Raw gazetted holidays for Malaysia (Federal / Bank Negara Malaysia calendar)
interface RawHoliday {
  date: string;
  nameEn: string;
  nameZh: string;
  observance?: string;
}

const RAW_MALAYSIA_BANK_HOLIDAYS: RawHoliday[] = [
  // --- 2024 ---
  { date: '2024-01-01', nameEn: "New Year's Day", nameZh: '元旦新年' },
  { date: '2024-01-25', nameEn: 'Thaipusam', nameZh: '大宝森节' },
  { date: '2024-02-01', nameEn: 'Federal Territory Day', nameZh: '联邦直辖区日' },
  { date: '2024-02-10', nameEn: 'Chinese New Year (Day 1)', nameZh: '农历新年（初一）' },
  { date: '2024-02-11', nameEn: 'Chinese New Year (Day 2)', nameZh: '农历新年（初二）' },
  { date: '2024-03-28', nameEn: 'Nuzul Al-Quran', nameZh: '可兰经降世日' },
  { date: '2024-04-10', nameEn: 'Hari Raya Aidilfitri (Day 1)', nameZh: '开斋节（首日）' },
  { date: '2024-04-11', nameEn: 'Hari Raya Aidilfitri (Day 2)', nameZh: '开斋节（次日）' },
  { date: '2024-05-01', nameEn: 'Labour Day', nameZh: '劳动节' },
  { date: '2024-05-22', nameEn: 'Wesak Day', nameZh: '卫塞节' },
  { date: '2024-06-03', nameEn: "Yang di-Pertuan Agong's Birthday", nameZh: '国家元首诞辰' },
  { date: '2024-06-17', nameEn: 'Hari Raya Haji', nameZh: '哈芝节' },
  { date: '2024-07-07', nameEn: 'Awal Muharram', nameZh: '伊斯兰历新年' },
  { date: '2024-08-31', nameEn: 'National Day (Merdeka Day)', nameZh: '国庆日' },
  { date: '2024-09-16', nameEn: 'Malaysia Day', nameZh: '马来西亚日' },
  { date: '2024-09-16', nameEn: "Prophet Muhammad's Birthday", nameZh: '先知穆罕默德诞辰' },
  { date: '2024-10-31', nameEn: 'Deepavali', nameZh: '屠妖节' },
  { date: '2024-12-25', nameEn: 'Christmas Day', nameZh: '圣诞节' },

  // --- 2025 ---
  { date: '2025-01-01', nameEn: "New Year's Day", nameZh: '元旦新年' },
  { date: '2025-01-29', nameEn: 'Chinese New Year (Day 1)', nameZh: '农历新年（初一）' },
  { date: '2025-01-30', nameEn: 'Chinese New Year (Day 2)', nameZh: '农历新年（初二）' },
  { date: '2025-02-01', nameEn: 'Federal Territory Day', nameZh: '联邦直辖区日' },
  { date: '2025-02-11', nameEn: 'Thaipusam', nameZh: '大宝森节' },
  { date: '2025-03-18', nameEn: 'Nuzul Al-Quran', nameZh: '可兰经降世日' },
  { date: '2025-03-31', nameEn: 'Hari Raya Aidilfitri (Day 1)', nameZh: '开斋节（首日）' },
  { date: '2025-04-01', nameEn: 'Hari Raya Aidilfitri (Day 2)', nameZh: '开斋节（次日）' },
  { date: '2025-05-01', nameEn: 'Labour Day', nameZh: '劳动节' },
  { date: '2025-05-12', nameEn: 'Wesak Day', nameZh: '卫塞节' },
  { date: '2025-06-02', nameEn: "Yang di-Pertuan Agong's Birthday", nameZh: '国家元首诞辰' },
  { date: '2025-06-07', nameEn: 'Hari Raya Haji', nameZh: '哈芝节' },
  { date: '2025-06-27', nameEn: 'Awal Muharram', nameZh: '伊斯兰历新年' },
  { date: '2025-08-31', nameEn: 'National Day (Merdeka Day)', nameZh: '国庆日' },
  { date: '2025-09-05', nameEn: "Prophet Muhammad's Birthday", nameZh: '先知穆罕默德诞辰' },
  { date: '2025-09-16', nameEn: 'Malaysia Day', nameZh: '马来西亚日' },
  { date: '2025-10-20', nameEn: 'Deepavali', nameZh: '屠妖节' },
  { date: '2025-12-25', nameEn: 'Christmas Day', nameZh: '圣诞节' },

  // --- 2026 ---
  { date: '2026-01-01', nameEn: "New Year's Day", nameZh: '元旦新年' },
  { date: '2026-02-01', nameEn: 'Federal Territory Day & Thaipusam', nameZh: '联邦直辖区日与大宝森节' },
  { date: '2026-02-17', nameEn: 'Chinese New Year (Day 1)', nameZh: '农历新年（初一）' },
  { date: '2026-02-18', nameEn: 'Chinese New Year (Day 2)', nameZh: '农历新年（初二）' },
  { date: '2026-03-07', nameEn: 'Nuzul Al-Quran', nameZh: '可兰经降世日' },
  { date: '2026-03-21', nameEn: 'Hari Raya Aidilfitri (Day 1)', nameZh: '开斋节（首日）' },
  { date: '2026-03-22', nameEn: 'Hari Raya Aidilfitri (Day 2)', nameZh: '开斋节（次日）' },
  { date: '2026-05-01', nameEn: 'Labour Day', nameZh: '劳动节' },
  { date: '2026-05-27', nameEn: 'Hari Raya Haji', nameZh: '哈芝节' },
  { date: '2026-05-31', nameEn: 'Wesak Day', nameZh: '卫塞节' },
  { date: '2026-06-01', nameEn: "Yang di-Pertuan Agong's Birthday", nameZh: '国家元首诞辰' },
  { date: '2026-06-17', nameEn: 'Awal Muharram', nameZh: '伊斯兰历新年' },
  { date: '2026-08-25', nameEn: "Prophet Muhammad's Birthday", nameZh: '先知穆罕默德诞辰' },
  { date: '2026-08-31', nameEn: 'National Day (Merdeka Day)', nameZh: '国庆日' },
  { date: '2026-09-16', nameEn: 'Malaysia Day', nameZh: '马来西亚日' },
  { date: '2026-11-08', nameEn: 'Deepavali', nameZh: '屠妖节' },
  { date: '2026-12-25', nameEn: 'Christmas Day', nameZh: '圣诞节' },

  // --- 2027 ---
  { date: '2027-01-01', nameEn: "New Year's Day", nameZh: '元旦新年' },
  { date: '2027-01-22', nameEn: 'Thaipusam', nameZh: '大宝森节' },
  { date: '2027-02-01', nameEn: 'Federal Territory Day', nameZh: '联邦直辖区日' },
  { date: '2027-02-06', nameEn: 'Chinese New Year (Day 1)', nameZh: '农历新年（初一）' },
  { date: '2027-02-07', nameEn: 'Chinese New Year (Day 2)', nameZh: '农历新年（初二）' },
  { date: '2027-02-24', nameEn: 'Nuzul Al-Quran', nameZh: '可兰经降世日' },
  { date: '2027-03-10', nameEn: 'Hari Raya Aidilfitri (Day 1)', nameZh: '开斋节（首日）' },
  { date: '2027-03-11', nameEn: 'Hari Raya Aidilfitri (Day 2)', nameZh: '开斋节（次日）' },
  { date: '2027-05-01', nameEn: 'Labour Day', nameZh: '劳动节' },
  { date: '2027-05-17', nameEn: 'Hari Raya Haji', nameZh: '哈芝节' },
  { date: '2027-05-20', nameEn: 'Wesak Day', nameZh: '卫塞节' },
  { date: '2027-06-06', nameEn: 'Awal Muharram', nameZh: '伊斯兰历新年' },
  { date: '2027-06-07', nameEn: "Yang di-Pertuan Agong's Birthday", nameZh: '国家元首诞辰' },
  { date: '2027-08-15', nameEn: "Prophet Muhammad's Birthday", nameZh: '先知穆罕默德诞辰' },
  { date: '2027-08-31', nameEn: 'National Day (Merdeka Day)', nameZh: '国庆日' },
  { date: '2027-09-16', nameEn: 'Malaysia Day', nameZh: '马来西亚日' },
  { date: '2027-10-28', nameEn: 'Deepavali', nameZh: '屠妖节' },
  { date: '2027-12-25', nameEn: 'Christmas Day', nameZh: '圣诞节' },

  // --- 2028 ---
  { date: '2028-01-01', nameEn: "New Year's Day", nameZh: '元旦新年' },
  { date: '2028-01-26', nameEn: 'Chinese New Year (Day 1)', nameZh: '农历新年（初一）' },
  { date: '2028-01-27', nameEn: 'Chinese New Year (Day 2)', nameZh: '农历新年（初二）' },
  { date: '2028-02-01', nameEn: 'Federal Territory Day', nameZh: '联邦直辖区日' },
  { date: '2028-02-10', nameEn: 'Thaipusam', nameZh: '大宝森节' },
  { date: '2028-02-13', nameEn: 'Nuzul Al-Quran', nameZh: '可兰经降世日' },
  { date: '2028-02-28', nameEn: 'Hari Raya Aidilfitri (Day 1)', nameZh: '开斋节（首日）' },
  { date: '2028-02-29', nameEn: 'Hari Raya Aidilfitri (Day 2)', nameZh: '开斋节（次日）' },
  { date: '2028-05-01', nameEn: 'Labour Day', nameZh: '劳动节' },
  { date: '2028-05-05', nameEn: 'Hari Raya Haji', nameZh: '哈芝节' },
  { date: '2028-05-08', nameEn: 'Wesak Day', nameZh: '卫塞节' },
  { date: '2028-05-25', nameEn: 'Awal Muharram', nameZh: '伊斯兰历新年' },
  { date: '2028-06-05', nameEn: "Yang di-Pertuan Agong's Birthday", nameZh: '国家元首诞辰' },
  { date: '2028-08-04', nameEn: "Prophet Muhammad's Birthday", nameZh: '先知穆罕默德诞辰' },
  { date: '2028-08-31', nameEn: 'National Day (Merdeka Day)', nameZh: '国庆日' },
  { date: '2028-09-16', nameEn: 'Malaysia Day', nameZh: '马来西亚日' },
  { date: '2028-10-17', nameEn: 'Deepavali', nameZh: '屠妖节' },
  { date: '2028-12-25', nameEn: 'Christmas Day', nameZh: '圣诞节' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to add days to a date string YYYY-MM-DD
 */
function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}

/**
 * Build the full list of Malaysian bank public holidays including statutory replacement days.
 * When a holiday falls on a Sunday in Malaysia (KL/Selangor banks),
 * Section 3 of Holidays Act 1951 mandates that the next working day (Monday) is a bank holiday.
 * If Monday is already a public holiday, Tuesday becomes the replacement holiday.
 */
export function getAllMalaysiaBankHolidays(): MalaysiaBankHoliday[] {
  const holidaysMap = new Map<string, MalaysiaBankHoliday>();

  // 1. First, register all gazetted holidays
  for (const raw of RAW_MALAYSIA_BANK_HOLIDAYS) {
    const d = new Date(raw.date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const dayOfWeekName = DAY_NAMES[dayOfWeek];
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    holidaysMap.set(raw.date, {
      date: raw.date,
      nameEn: raw.nameEn,
      nameZh: raw.nameZh,
      dayOfWeek,
      dayOfWeekName,
      isWeekday,
      isReplacement: false,
    });
  }

  // 2. Compute replacements for Sunday (and weekend) holidays
  // If a holiday falls on Sunday (day 0), find the next available weekday (usually Monday)
  for (const raw of RAW_MALAYSIA_BANK_HOLIDAYS) {
    const d = new Date(raw.date + 'T00:00:00');
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 0) {
      // Sunday holiday -> Monday replacement
      let repDateStr = addDaysStr(raw.date, 1);
      // If Monday is already a holiday (e.g. Wesak on Sun, King's Birthday on Mon), move to Tuesday
      while (holidaysMap.has(repDateStr)) {
        repDateStr = addDaysStr(repDateStr, 1);
      }

      const repDate = new Date(repDateStr + 'T00:00:00');
      const repDayOfWeek = repDate.getDay();
      const repIsWeekday = repDayOfWeek >= 1 && repDayOfWeek <= 5;

      holidaysMap.set(repDateStr, {
        date: repDateStr,
        nameEn: `${raw.nameEn} (Replacement Holiday)`,
        nameZh: `${raw.nameZh}（补假）`,
        dayOfWeek: repDayOfWeek,
        dayOfWeekName: DAY_NAMES[repDayOfWeek],
        isWeekday: repIsWeekday,
        isReplacement: true,
        originalHolidayName: raw.nameEn,
        notes: `Bank replacement holiday because ${raw.nameEn} fell on a Sunday.`,
      });
    } else if (dayOfWeek === 6 && raw.nameEn.includes('Chinese New Year (Day 1)')) {
      // If CNY Day 1 is Saturday and CNY Day 2 is Sunday, Monday & Tuesday are replacements
      const nextDayStr = addDaysStr(raw.date, 1);
      const nextDayRaw = holidaysMap.get(nextDayStr);
      if (nextDayRaw && nextDayRaw.dayOfWeek === 0) {
        // Monday replacement
        const repMon = addDaysStr(raw.date, 2);
        if (!holidaysMap.has(repMon)) {
          const mDate = new Date(repMon + 'T00:00:00');
          holidaysMap.set(repMon, {
            date: repMon,
            nameEn: 'Chinese New Year (Replacement Holiday Day 1)',
            nameZh: '农历新年补假（第一天）',
            dayOfWeek: mDate.getDay(),
            dayOfWeekName: DAY_NAMES[mDate.getDay()],
            isWeekday: true,
            isReplacement: true,
            originalHolidayName: 'Chinese New Year',
          });
        }
        // Tuesday replacement
        const repTue = addDaysStr(raw.date, 3);
        if (!holidaysMap.has(repTue)) {
          const tDate = new Date(repTue + 'T00:00:00');
          holidaysMap.set(repTue, {
            date: repTue,
            nameEn: 'Chinese New Year (Replacement Holiday Day 2)',
            nameZh: '农历新年补假（第二天）',
            dayOfWeek: tDate.getDay(),
            dayOfWeekName: DAY_NAMES[tDate.getDay()],
            isWeekday: true,
            isReplacement: true,
            originalHolidayName: 'Chinese New Year',
          });
        }
      }
    }
  }

  // Convert to sorted array
  return Array.from(holidaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all Malaysia Bank Holidays in a specific date range
 */
export function getMalaysiaBankHolidaysInRange(
  startDateStr: string,
  endDateStr: string
): MalaysiaBankHoliday[] {
  const all = getAllMalaysiaBankHolidays();
  return all.filter((h) => h.date >= startDateStr && h.date <= endDateStr);
}

/**
 * Get upcoming Malaysia Bank Holidays from today up to 3 months ahead
 * Default: 3 months from today (or given reference date)
 */
export function getUpcomingMalaysiaBankHolidays(
  referenceDate?: Date | string,
  monthsAhead: number = 3
): MalaysiaBankHoliday[] {
  const ref = referenceDate
    ? typeof referenceDate === 'string'
      ? new Date(referenceDate + 'T00:00:00')
      : new Date(referenceDate)
    : new Date();

  const startDateStr = formatDateYMD(ref);

  const future = new Date(ref);
  future.setMonth(future.getMonth() + monthsAhead);
  const endDateStr = formatDateYMD(future);

  return getMalaysiaBankHolidaysInRange(startDateStr, endDateStr);
}

/**
 * Get upcoming Malaysia Bank Holidays that FALL ON A WEEKDAY (Monday to Friday)
 * up to 3 months ahead.
 *
 * This fulfills the user prompt:
 * "synchronize malaysia public holiday that implement by bank in malaysia that falls on weekday,
 * pls off the particular date and up to 3 months ahead of current date."
 */
export function getUpcomingMalaysiaWeekdayBankHolidays(
  referenceDate?: Date | string,
  monthsAhead: number = 3
): MalaysiaBankHoliday[] {
  const upcoming = getUpcomingMalaysiaBankHolidays(referenceDate, monthsAhead);
  // Weekday is Monday (1) through Friday (5)
  return upcoming.filter((h) => h.isWeekday);
}

/**
 * Find holiday info for a specific date if it is an official Malaysian Bank Holiday
 */
export function getMalaysiaHolidayInfo(dateStr: string): MalaysiaBankHoliday | null {
  const all = getAllMalaysiaBankHolidays();
  return all.find((h) => h.date === dateStr) || null;
}

/**
 * Check if a specific date is a Malaysian Bank Holiday that falls on a weekday
 */
export function isMalaysiaWeekdayBankHoliday(dateStr: string): boolean {
  const info = getMalaysiaHolidayInfo(dateStr);
  return !!info && info.isWeekday;
}

/**
 * Synchronize Malaysia weekday bank holidays into the app's disabled delivery dates list.
 *
 * It adds all weekday bank holidays falling within the next `monthsAhead` (default 3 months)
 * to `disabledDeliveryDates`, without removing any custom dates already turned off by the admin.
 */
export function synchronizeMalaysiaWeekdayBankHolidays(
  currentDisabledDates: string[] = [],
  referenceDate?: Date | string,
  monthsAhead: number = 3
): {
  updatedDisabledDates: string[];
  newlyAddedDates: string[];
  weekdayHolidays: MalaysiaBankHoliday[];
  alreadyOffDates: string[];
} {
  const weekdayHolidays = getUpcomingMalaysiaWeekdayBankHolidays(referenceDate, monthsAhead);
  const currentSet = new Set(currentDisabledDates);
  const newlyAddedDates: string[] = [];
  const alreadyOffDates: string[] = [];

  for (const hol of weekdayHolidays) {
    if (currentSet.has(hol.date)) {
      alreadyOffDates.push(hol.date);
    } else {
      newlyAddedDates.push(hol.date);
      currentSet.add(hol.date);
    }
  }

  const updatedDisabledDates = Array.from(currentSet).sort();

  return {
    updatedDisabledDates,
    newlyAddedDates,
    weekdayHolidays,
    alreadyOffDates,
  };
}
