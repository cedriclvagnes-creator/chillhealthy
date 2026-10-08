import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  Sparkles,
  AlertCircle,
  History,
  LogOut,
  PackageCheck,
  Building,
  Home,
  MessageCircle,
  CalendarRange,
  ChevronRight,
  Shuffle,
  Shield,
  Phone,
  KeyRound,
  Lock,
  Check,
  Plus,
  Trash2,
  Store,
  ArrowLeft,
  Search,
  Filter,
  Gift,
  Send,
  RotateCcw,
  ShieldCheck,
  Copy,
  Share2,
  Users,
  AlertTriangle,
  FileText,
  Printer,
  Crown,
  UtensilsCrossed,
} from 'lucide-react';
import { Language, MemberAccount, MealItem, MealPlan, MealRedemption, SiteSettings, OfficialReceipt } from '../types';
import { getMalaysiaHolidayInfo } from '../utils/malaysiaHolidays';
import { ChillLogo } from './ChillLogo';
import { OfficialReceiptModal } from './OfficialReceiptModal';
import {
  getMemberReferralCode,
  buildReferralShareUrl,
  buildReferralWhatsAppMessage,
  MIN_REFERRAL_PLAN_PRICE,
} from '../utils/referral';
import {
  isValidMalaysianHandphone,
  normalizeMalaysianPhone,
  getMalaysianPhoneError,
  formatMalaysianPhone,
} from '../utils/malaysiaPhone';
import {
  generateUniqueOrderNumber,
  buildCustomerWhatsAppAutoReplyUrl,
  buildWhatsAppUrl,
} from '../utils/whatsapp';
import {
  getEffectivePackageExpiry,
  getPlanValidityDays,
  getDetailedPackageValidity,
  getTodayStr,
  getPackageDailyQuota,
  getMaxRedeemableMealsPerDay,
} from '../utils/packageExpiry';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentMember: MemberAccount | null;
  onLogin: (loginId: string, pass: string) => boolean;
  onLogout: () => void;
  onRegister: (newMember: Partial<MemberAccount>) => void;
  onRedeemMeal: (redemption: Omit<MealRedemption, 'id' | 'createdAt' | 'status'>) => boolean;
  onBatchRedeemMeals?: (redemptions: Array<Omit<MealRedemption, 'id' | 'createdAt' | 'status'>>) => boolean;
  onUpdateMemberAddresses?: (
    address1: { address: string; area: string; postalCode: string },
    address2?: { address2: string; area2: string; postalCode2: string }
  ) => void;
  onUpdateMemberPassword?: (newPassword: string) => boolean;
  onResetPasswordByPhone?: (phone: string, newPassword: string) => boolean;
  menuItems: MealItem[];
  packages: MealPlan[];
  allRedemptions: MealRedemption[];
  members?: MemberAccount[];
  siteSettings: SiteSettings;
  onSelectPackageToBuy: (pkg: MealPlan) => void;
  onOpenMenu?: () => void;
  onOpenPlans?: () => void;
  onOpenCalorie?: () => void;
}

// Utility: get next workday (Mon-Fri) string YYYY-MM-DD
function getNextWorkday(offsetDays = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // If Saturday (6), skip to Monday (+2)
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  // If Sunday (0), skip to Monday (+1)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Utility: get upcoming N workdays (Mon-Fri only)
function getUpcomingWorkdays(count = 5): string[] {
  const days: string[] = [];
  const current = new Date();
  current.setDate(current.getDate() + 1);

  while (days.length < count) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  language,
  currentMember,
  onLogin,
  onLogout,
  onRegister,
  onRedeemMeal,
  onBatchRedeemMeals,
  onUpdateMemberAddresses,
  onUpdateMemberPassword,
  onResetPasswordByPhone,
  menuItems,
  packages,
  allRedemptions,
  members = [],
  siteSettings,
  onSelectPackageToBuy,
  onOpenMenu,
  onOpenPlans,
  onOpenCalorie,
}) => {
  // Login / Register / Forgot Password state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot Password via WhatsApp TAC
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotTacInput, setForgotTacInput] = useState('');
  const [generatedTac, setGeneratedTac] = useState('');
  const [isTacSent, setIsTacSent] = useState(false);
  const [tacTimer, setTacTimer] = useState(0);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => {
    if (tacTimer > 0) {
      const interval = setInterval(() => setTacTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [tacTimer]);

  const handleSendWhatsAppTac = () => {
    setForgotError('');
    setForgotSuccess('');
    const raw = forgotPhone.replace(/\D/g, '');
    if (!raw || raw.length < 8) {
      setForgotError(language === 'en' ? 'Please enter a valid registered handphone number.' : '请输入有效的注册手机号码。');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedTac(code);
    setIsTacSent(true);
    setTacTimer(300);

    const msg = `Hi CHILL Healthy, I am requesting a password reset TAC for my member account (${forgotPhone}). My 6-digit WhatsApp TAC code is: *${code}*.`;
    const targetWa = siteSettings.whatsappNumber ? siteSettings.whatsappNumber.replace(/\D/g, '') : '60126189919';
    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    setForgotSuccess(
      language === 'en'
        ? `✓ 6-Digit TAC [ ${code} ] generated & forwarded to WhatsApp! Please enter the TAC below to set your new password.`
        : `✓ 6位验证码 [ ${code} ] 已生成并同步至 WhatsApp！请在下方输入验证码并设置新密码。`
    );
  };

  const handleVerifyTacAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!isTacSent || !generatedTac) {
      setForgotError(language === 'en' ? 'Please click "Send TAC to WhatsApp" first.' : '请先点击“发送 WhatsApp 验证码”。');
      return;
    }
    if (forgotTacInput.trim() !== generatedTac.trim()) {
      setForgotError(language === 'en' ? 'Incorrect TAC code. Please verify the code sent to WhatsApp.' : '验证码不正确，请核对 WhatsApp 验证码。');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 4) {
      setForgotError(language === 'en' ? 'Password must be at least 4 characters.' : '新密码长度至少需要 4 位。');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError(language === 'en' ? 'Passwords do not match.' : '两次输入的密码不一致。');
      return;
    }

    if (onResetPasswordByPhone) {
      onResetPasswordByPhone(forgotPhone, forgotNewPass);
    }
    setLoginEmail(forgotPhone);
    setLoginPass(forgotNewPass);
    alert(
      language === 'en'
        ? '✓ Password reset successfully! You can now log in with your new password.'
        : '✓ 密码重置成功！已为您自动填入新密码，请点击立即登录。'
    );
    setAuthMode('login');
  };

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('123456');
  const [regAddress, setRegAddress] = useState('');
  const [regArea, setRegArea] = useState('Klang / Bukit Tinggi');
  const [regPostal, setRegPostal] = useState('41200');
  const [hasRegAddress2, setHasRegAddress2] = useState(false);
  const [regAddress2, setRegAddress2] = useState('');
  const [regArea2, setRegArea2] = useState('Klang / Bukit Tinggi');
  const [regPostal2, setRegPostal2] = useState('');
  const [regError, setRegError] = useState('');
  // Option for customer to register and buy ala carte meal vs register & buy meal plan
  const [regIntent, setRegIntent] = useState<'alacarte' | 'plan'>('alacarte');

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Member Portal active tabs: 'redeem' (Daily Meal), 'planner' (Advance Multi-Day), 'history' (Delivery Logs), 'referral' (Refer Friends), 'renew' (Packages)
  const [portalTab, setPortalTab] = useState<'redeem' | 'planner' | 'history' | 'referral' | 'renew'>('redeem');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Address 1 vs 2 switcher (1 account 2 addresses)
  const [selectedAddressSlot, setSelectedAddressSlot] = useState<1 | 2>(1);
  const [isEditingAddress2, setIsEditingAddress2] = useState(false);
  const [editAddr2, setEditAddr2] = useState('');
  const [editArea2, setEditArea2] = useState('Klang / Bukit Tinggi');
  const [editPostal2, setEditPostal2] = useState('41200');

  // Daily Meal Form state
  const [selectedDate, setSelectedDate] = useState(() => getNextWorkday(1));
  const [selectedSlot, setSelectedSlot] = useState('Lunch (10:00 AM – 2:00 PM)');
  const [selectedMealId, setSelectedMealId] = useState(menuItems[0]?.id || '');
  const [mealQuantity, setMealQuantity] = useState(1);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [redemptionSuccessMsg, setRedemptionSuccessMsg] = useState('');

  // Daily Meal Redemption Confirmed Popup & Double-Booking Awareness state
  const [redemptionSuccessPopup, setRedemptionSuccessPopup] = useState<{
    isOpen: boolean;
    orderNumber?: string;
    deliveryDate: string;
    formattedDate: string;
    mealName: string;
    mealNameZh: string;
    mealImage: string;
    quantity: number;
    deliverySlot: string;
    deliveryAddress: string;
    area: string;
    postalCode: string;
    remainingMealsAfter: number;
    isBatch?: boolean;
    batchDaysCount?: number;
    whatsappMessage?: string;
  } | null>(null);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  // Double-booking pre-confirmation alert warning
  const [doubleBookingWarning, setDoubleBookingWarning] = useState<{
    isOpen: boolean;
    date: string;
    existingMealName: string;
    existingMealNameZh?: string;
    existingQty: number;
    newSlot?: string;
    newQty?: number;
    maxDailyQuota?: number;
    onProceed: () => void;
  } | null>(null);

  // Official Receipt preview modal for member
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<OfficialReceipt | null>(null);

  // Meal Search & Filter state
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('all');

  // History sub-tab: 'deliveries' (meal deliveries) or 'refunds' (quota refund & balance records) or 'receipts' (official receipts)
  const [historySubTab, setHistorySubTab] = useState<'deliveries' | 'refunds' | 'receipts'>('deliveries');

  // Advance Multi-Day Planner state
  const upcomingWorkdays = useMemo(() => getUpcomingWorkdays(5), []);
  const [batchSchedule, setBatchSchedule] = useState<{ [date: string]: string }>({});

  // Active Package Expiry, First Meal Activation & Admin Special Case Evaluation
  const activePkg = currentMember?.activePackage;
  const expInfo = useMemo(() => {
    if (!activePkg) return null;
    return getEffectivePackageExpiry(activePkg, siteSettings.disabledDeliveryDates || []);
  }, [activePkg, siteSettings.disabledDeliveryDates]);

  const isSpecialCase = Boolean(activePkg?.specialCaseExtension);
  const effectiveExpiryDate = expInfo?.effectiveExpiryDate || activePkg?.expiryDate || '';
  const isExpired = Boolean(expInfo?.isExpired && !isSpecialCase);
  const isPendingFirstMeal = Boolean(activePkg && (!activePkg.isActivated || !activePkg.firstRedeemedDate));

  // Customer is NOT allowed to see dates of selection after package validity ends, unless adjusted by admin for special cases
  const visibleWorkdays = useMemo(() => {
    if (!upcomingWorkdays || upcomingWorkdays.length === 0) return [];
    if (!activePkg || isSpecialCase || !effectiveExpiryDate || isPendingFirstMeal) {
      return upcomingWorkdays;
    }
    if (isExpired) {
      return [];
    }
    // Filter to only workdays strictly on or before effective expiry date
    return upcomingWorkdays.filter((wDate) => wDate <= effectiveExpiryDate);
  }, [upcomingWorkdays, activePkg, isSpecialCase, effectiveExpiryDate, isPendingFirstMeal, isExpired]);

  // =========================================================================
  // DAILY QUOTA ENFORCEMENT RULES (DOUBLE OF PACKAGE MEAL QUOTA)
  // - RM398 (1 meal/day): customer can order max 2 meals per day (1 lunch + 1 dinner, or 2 lunch, or 2 dinner)
  // - RM788 (2 meals/day): customer can order max 4 meals per day (e.g. 2 lunch + 2 dinner, 4 lunch, etc.)
  // =========================================================================
  const baseDailyQuota = useMemo(() => {
    if (!activePkg) return 1;
    return getPackageDailyQuota(activePkg.planId, activePkg.planName, packages);
  }, [activePkg, packages]);

  const maxDailyQuota = useMemo(() => {
    if (!activePkg) return 2;
    return getMaxRedeemableMealsPerDay(activePkg.planId, activePkg.planName, packages);
  }, [activePkg, packages]);

  // Existing bookings on selected date for this member
  const existingBookingsOnSelectedDate = useMemo(() => {
    if (!currentMember || !selectedDate) return [];
    return allRedemptions.filter(
      (r) => r.memberId === currentMember.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled'
    );
  }, [currentMember, selectedDate, allRedemptions]);

  const alreadyBookedQtyOnSelectedDate = useMemo(() => {
    return existingBookingsOnSelectedDate.reduce((sum, r) => sum + (r.quantity || 1), 0);
  }, [existingBookingsOnSelectedDate]);

  const bookedLunchQty = useMemo(() => {
    return existingBookingsOnSelectedDate
      .filter(
        (r) =>
          !r.deliverySlot ||
          r.deliverySlot.toLowerCase().includes('lunch') ||
          r.deliverySlot.includes('10:00')
      )
      .reduce((sum, r) => sum + (r.quantity || 1), 0);
  }, [existingBookingsOnSelectedDate]);

  const bookedDinnerQty = useMemo(() => {
    return existingBookingsOnSelectedDate
      .filter(
        (r) =>
          r.deliverySlot?.toLowerCase().includes('dinner') ||
          r.deliverySlot?.includes('3:00') ||
          r.deliverySlot?.includes('15:00')
      )
      .reduce((sum, r) => sum + (r.quantity || 1), 0);
  }, [existingBookingsOnSelectedDate]);

  const remainingAllowedQtyOnSelectedDate = useMemo(() => {
    return Math.max(0, maxDailyQuota - alreadyBookedQtyOnSelectedDate);
  }, [maxDailyQuota, alreadyBookedQtyOnSelectedDate]);

  const isDailyQuotaReached = alreadyBookedQtyOnSelectedDate >= maxDailyQuota;

  // Auto-clamp mealQuantity if it exceeds remaining allowed quota for the day
  useEffect(() => {
    if (remainingAllowedQtyOnSelectedDate > 0 && mealQuantity > remainingAllowedQtyOnSelectedDate) {
      setMealQuantity(remainingAllowedQtyOnSelectedDate);
    }
  }, [selectedDate, remainingAllowedQtyOnSelectedDate, mealQuantity]);

  // Initialize batch planner with defaults
  useEffect(() => {
    if (menuItems.length > 0 && Object.keys(batchSchedule).length === 0) {
      const initial: { [date: string]: string } = {};
      const targetDays = visibleWorkdays.length > 0 ? visibleWorkdays : upcomingWorkdays;
      targetDays.forEach((dateStr, idx) => {
        initial[dateStr] = menuItems[idx % menuItems.length]?.id || menuItems[0]?.id;
      });
      setBatchSchedule(initial);
    }
  }, [menuItems, visibleWorkdays, upcomingWorkdays]);

  // Sync member addresses when currentMember changes
  useEffect(() => {
    if (currentMember) {
      setDietaryNotes(currentMember.dietaryPreferences || '');
      if (currentMember.address2) {
        setEditAddr2(currentMember.address2);
        setEditArea2(currentMember.area2 || currentMember.area || 'Klang / Bukit Tinggi');
        setEditPostal2(currentMember.postalCode2 || currentMember.postalCode || '41200');
      }
    }
  }, [currentMember]);

  // Filtered menu items for daily redemption gallery
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedMealCategory === 'high-protein' && item.protein < 30) return false;
      if (selectedMealCategory === 'under-500' && item.calories >= 500) return false;
      if (selectedMealCategory === 'chicken' && !item.name.toLowerCase().includes('chicken') && !item.nameZh.includes('鸡')) return false;
      if (selectedMealCategory === 'salmon' && !item.name.toLowerCase().includes('salmon') && !item.name.toLowerCase().includes('fish') && !item.nameZh.includes('三文鱼') && !item.nameZh.includes('鱼')) return false;
      if (selectedMealCategory === 'beef-pork' && !item.name.toLowerCase().includes('beef') && !item.name.toLowerCase().includes('pork') && !item.nameZh.includes('牛') && !item.nameZh.includes('猪')) return false;
      if (selectedMealCategory === 'vegetarian' && !item.name.toLowerCase().includes('tofu') && !item.name.toLowerCase().includes('vege') && !item.nameZh.includes('素') && !item.nameZh.includes('豆腐')) return false;

      // Text search
      if (mealSearchQuery.trim()) {
        const q = mealSearchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q) || item.nameZh.includes(q);
        const matchSubtitle = (item.subtitle || '').toLowerCase().includes(q) || (item.subtitleZh || '').includes(q);
        const matchIngredients = (item.ingredients || []).some((ing) => ing.toLowerCase().includes(q)) || (item.ingredientsZh || []).some((ing) => ing.includes(q));
        return matchName || matchSubtitle || matchIngredients;
      }

      return true;
    });
  }, [menuItems, selectedMealCategory, mealSearchQuery]);

  if (!isOpen) return null;

  const currentAddress =
    selectedAddressSlot === 2 && currentMember?.address2
      ? currentMember.address2
      : currentMember?.address || '';
  const currentArea =
    selectedAddressSlot === 2 && currentMember?.area2
      ? currentMember.area2
      : currentMember?.area || 'Klang / Bukit Tinggi';
  const currentPostal =
    selectedAddressSlot === 2 && currentMember?.postalCode2
      ? currentMember.postalCode2
      : currentMember?.postalCode || '41200';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLogin(loginEmail, loginPass);
    if (!success) {
      setLoginError(
        language === 'en'
          ? 'Invalid Member Number or Password. (Default password: 123456)'
          : '会员账号或密码不正确。（初始默认密码为 123456）'
      );
    }
  };

  const handleQuickDemoLogin = (phoneOrId: string) => {
    onLogin(phoneOrId, '123456');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedName = regName.trim();
    if (!trimmedName) {
      setRegError(language === 'en' ? 'Please enter your Full Name.' : '请填写您的真实姓名。');
      return;
    }

    const phoneError = getMalaysianPhoneError(regPhone, language);
    if (phoneError) {
      setRegError(phoneError);
      return;
    }

    const cleanPhone = normalizeMalaysianPhone(regPhone);

    // Validate Address 1 (Mandatory)
    if (!regAddress.trim()) {
      setRegError(
        language === 'en'
          ? 'Address 1 is mandatory. Please enter your detailed street, building, or unit.'
          : '送餐地址一为必填项。请填写详细街道、大厦或门牌。'
      );
      return;
    }

    if (!regPostal.trim()) {
      setRegError(
        language === 'en'
          ? 'Please enter a 5-digit postal code for Address 1.'
          : '请填写地址一的5位数邮区编号。'
      );
      return;
    }

    // Validate Address 2 if enabled
    if (hasRegAddress2) {
      if (!regAddress2.trim()) {
        setRegError(
          language === 'en'
            ? 'Address 2 is enabled. Please enter street address or click "Remove Address 2".'
            : '您已开启第二送餐地址。请填写地址二的详细街道，或点击“移除地址二”。'
        );
        return;
      }
      if (!regPostal2.trim()) {
        setRegError(
          language === 'en'
            ? 'Please enter postal code for Address 2.'
            : '请填写地址二的邮区编号。'
        );
        return;
      }
    }

    onRegister({
      name: trimmedName,
      phone: cleanPhone,
      email: regEmail.trim() || `${cleanPhone}@customer.chill-healthy.com`,
      password: regPass.trim() || '123456',
      address: regAddress.trim(),
      area: regArea,
      postalCode: regPostal.trim(),
      address2: hasRegAddress2 && regAddress2.trim() ? regAddress2.trim() : undefined,
      area2: hasRegAddress2 && regAddress2.trim() ? regArea2 : undefined,
      postalCode2: hasRegAddress2 && regAddress2.trim() ? regPostal2.trim() : undefined,
      activeAddressSlot: 1,
    });

    // Option for customer to register and buy ala carte meal directly
    if (regIntent === 'alacarte') {
      if (onOpenMenu) {
        onOpenMenu();
      } else {
        onClose();
      }
    } else {
      setPortalTab('renew');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentMember) return;
    const existingPass = currentMember.password || '123456';

    if (currentPasswordInput !== existingPass && currentPasswordInput !== '123456') {
      setPasswordChangeError(
        language === 'en'
          ? 'Current password is incorrect. (Default is 123456)'
          : '当前旧密码不正确。（初始默认密码为 123456）'
      );
      return;
    }

    if (newPasswordInput.length < 4) {
      setPasswordChangeError(
        language === 'en'
          ? 'New password must be at least 4 characters.'
          : '新密码长度至少需要 4 位字符。'
      );
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError(
        language === 'en'
          ? 'New passwords do not match. Please re-enter.'
          : '两次输入的新密码不一致，请重新输入。'
      );
      return;
    }

    if (onUpdateMemberPassword) {
      onUpdateMemberPassword(newPasswordInput);
    } else {
      currentMember.password = newPasswordInput;
    }

    setPasswordChangeSuccess(
      language === 'en'
        ? '✓ Password changed successfully! Please use your new password next time you log in.'
        : '✓ 密码修改成功！下次登录请使用您的新密码。'
    );
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setCurrentPasswordInput('');
    setTimeout(() => {
      setIsChangePasswordOpen(false);
      setPasswordChangeSuccess('');
    }, 2500);
  };

  // Save updated Address 2 (one-time post-registration fill, then locked permanently)
  const handleSaveAddress2 = () => {
    if (!currentMember) return;
    if (!editAddr2.trim() || editAddr2.trim().length < 4) {
      alert(language === 'en' ? 'Please enter a valid street/building address (minimum 4 characters).' : '请输入有效的街道/楼宇送餐地址（至少4个字符）。');
      return;
    }
    if (!editPostal2 || editPostal2.trim().length !== 5) {
      alert(language === 'en' ? 'Please enter a valid 5-digit Malaysian postal code.' : '请输入有效的5位马来西亚邮区编号。');
      return;
    }

    if (onUpdateMemberAddresses) {
      onUpdateMemberAddresses(
        {
          address: currentMember.address,
          area: currentMember.area,
          postalCode: currentMember.postalCode,
        },
        {
          address2: editAddr2.trim(),
          area2: editArea2,
          postalCode2: editPostal2.trim(),
        }
      );
    } else {
      currentMember.address2 = editAddr2.trim();
      currentMember.area2 = editArea2;
      currentMember.postalCode2 = editPostal2.trim();
    }
    setIsEditingAddress2(false);
    setSelectedAddressSlot(2);
    alert(
      language === 'en'
        ? '✓ Address 2 registered successfully! Both delivery addresses are now permanently locked.'
        : '✓ 第二送餐地址已成功保存！两个送餐地址现已永久锁定。'
    );
  };

  const handleDateChange = (dateVal: string) => {
    if (!dateVal) return;
    const dateObj = new Date(dateVal + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert(
        language === 'en'
          ? '⚠️ Notice: Deliveries are only available from Monday to Friday (weekdays only). Please choose a Monday–Friday date.'
          : '⚠️ 提示：健康餐仅在周一至周五工作日配送（周末不送餐）。请选择周一至周五。'
      );
      setSelectedDate(getNextWorkday(1));
      return;
    }

    if (siteSettings.disabledDeliveryDates?.includes(dateVal)) {
      const hol = getMalaysiaHolidayInfo(dateVal);
      const holName = hol ? (language === 'en' ? hol.nameEn : hol.nameZh) : '';
      alert(
        language === 'en'
          ? hol
            ? `🇲🇾 Notice: ${dateVal} is an official Malaysia Bank Public Holiday (${holName}). Delivery is turned off and your package validity automatically extends by +1 day. Please select another workday.`
            : `⚠️ Notice: ${dateVal} has been turned off by kitchen administration (holiday or off-day). Please select another date.`
          : hol
            ? `🇲🇾 提示：${dateVal} 为马来西亚银行法定公假（${holName}）。后厨暂停配送，您的会员套餐有效期已自动顺延 +1 天。请选择其他工作日。`
            : `⚠️ 提示：${dateVal} 已被后厨管理关闭（节假日或休厨日）。请选择其他送餐日期。`
      );
      setSelectedDate(getNextWorkday(1));
      return;
    }

    // Restriction: Customer is NOT allowed to select date after package validity ends, unless special case adjusted by admin
    if (!isSpecialCase && !isPendingFirstMeal && effectiveExpiryDate && dateVal > effectiveExpiryDate) {
      alert(
        language === 'en'
          ? `⚠️ Package Validity Restriction: Your package validity ended on ${effectiveExpiryDate}. You are not allowed to select dates after your package validity end date. Please contact admin for special case adjustment or renew your package.`
          : `⚠️ 配套有效期限制：您的配套有效期截至 ${effectiveExpiryDate} 为止，无法选择到期之后的日期。特殊情况请联系管理员在后台特批调整，或续订新配套。`
      );
      setSelectedDate(getNextWorkday(1));
      return;
    }

    setSelectedDate(dateVal);
  };

  // Helper: Format human-friendly display date
  const formatDisplayDate = (dStr: string) => {
    try {
      const dObj = new Date(dStr + 'T00:00:00');
      return dObj.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  // Submit Daily Meal Redemption
  const handleRedemptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert(
        language === 'en'
          ? '⚠️ Notice: Deliveries are only available from Monday to Friday. Please choose a weekday.'
          : '⚠️ 提示：会员订餐仅限周一至周五工作日，周末不提供送餐服务。'
      );
      return;
    }

    if (siteSettings.disabledDeliveryDates?.includes(selectedDate)) {
      const hol = getMalaysiaHolidayInfo(selectedDate);
      const holName = hol ? (language === 'en' ? hol.nameEn : hol.nameZh) : '';
      alert(
        language === 'en'
          ? hol
            ? `🇲🇾 Notice: ${selectedDate} is a Malaysia Bank Public Holiday (${holName}). Delivery is turned off and your meal plan validity is extended. Please select another date.`
            : `⚠️ Notice: The selected date (${selectedDate}) has been turned off by kitchen administration. Please select another date.`
          : hol
            ? `🇲🇾 提示：所选日期 (${selectedDate}) 为马来西亚银行法定公假（${holName}），已暂停送餐。您的套餐将自动顺延，请选择其他日期。`
            : `⚠️ 提示：所选送餐日期 (${selectedDate}) 已由后厨暂停送餐，请选择其他送餐日期。`
      );
      return;
    }

    if (!currentMember.activePackage || currentMember.activePackage.remainingMeals < mealQuantity) {
      alert(
        language === 'en'
          ? `You have only ${currentMember.activePackage?.remainingMeals || 0} meals left. Please reduce quantity or renew package.`
          : `您的套餐仅剩 ${currentMember.activePackage?.remainingMeals || 0} 餐可用，不足以兑换 ${mealQuantity} 份。请调整份数或续订配套。`
      );
      setPortalTab('renew');
      return;
    }

    // Restriction: Customer is NOT allowed to select/order dates after package validity ends
    if (!isSpecialCase && !isPendingFirstMeal && effectiveExpiryDate && selectedDate > effectiveExpiryDate) {
      alert(
        language === 'en'
          ? `⚠️ Package Validity Restriction: Your package validity ended on ${effectiveExpiryDate}. You cannot submit meal redemptions after validity has ended. Special cases can be adjusted by Admin.`
          : `⚠️ 配套有效期限制：您的配套有效期已于 ${effectiveExpiryDate} 届满，无法提交到期之后的送餐预约。特殊情况需由管理员在后台特批顺延调整。`
      );
      return;
    }

    // Restriction: Member is only allowed to redeem up to double the package meal quota per day
    // E.g. RM398 (1 meal/day) -> max 2 meals per day (1 lunch + 1 dinner, or 2 lunch, or 2 dinner)
    // E.g. RM788 (2 meals/day) -> max 4 meals per day
    const alreadyBookedCountOnDate = allRedemptions
      .filter((r) => r.memberId === currentMember.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled')
      .reduce((sum, r) => sum + (r.quantity || 1), 0);

    if (alreadyBookedCountOnDate + mealQuantity > maxDailyQuota) {
      alert(
        language === 'en'
          ? `⚠️ Daily Quota Exceeded: Your plan allows a maximum of ${maxDailyQuota} meals per day (double of normal daily quota). You already have ${alreadyBookedCountOnDate} meal(s) booked for ${selectedDate}. You can order at most ${Math.max(0, maxDailyQuota - alreadyBookedCountOnDate)} more meal(s) on this date.`
          : `⚠️ 超出每日最高限额：您的套餐每日最高限订 ${maxDailyQuota} 份餐品（双倍配额灵活安排午晚餐）。您在 ${selectedDate} 已安排了 ${alreadyBookedCountOnDate} 份，当日最多仅可再加订 ${Math.max(0, maxDailyQuota - alreadyBookedCountOnDate)} 份。`
      );
      return;
    }

    const chosenMeal = menuItems.find((m) => m.id === selectedMealId) || menuItems[0];

    const doSubmitRedemption = () => {
      const orderNo = generateUniqueOrderNumber('CH');
      const success = onRedeemMeal({
        orderNumber: orderNo,
        orderType: 'Meal Plan Redemption',
        memberId: currentMember.id,
        memberName: currentMember.name,
        memberPhone: currentMember.phone,
        deliveryDate: selectedDate,
        deliverySlot: selectedSlot,
        deliveryAddress: currentAddress,
        area: currentArea,
        postalCode: currentPostal,
        mealId: chosenMeal.id,
        mealName: chosenMeal.name,
        mealNameZh: chosenMeal.nameZh,
        mealImage: chosenMeal.image,
        quantity: mealQuantity,
        dietaryNotes,
        recipeStandard: 'Standard Chef Recipe' as const,
        autoReplySent: false,
      });

      if (success) {
        const remainingAfter = Math.max(0, (currentMember.activePackage?.remainingMeals || 1) - mealQuantity);

        // Pre-build optional notification message for CHILL Healthy Kitchen WhatsApp
        const kitchenNotificationMsg =
          `🍱 *CHILL Healthy 潮轻食 · 会员每日订餐凭据*\n` +
          `*Member Meal Booking Notification*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📋 *订单编号 / Order No:* #${orderNo}\n` +
          `👤 *会员姓名 / Member Name:* ${currentMember.name}\n` +
          `📞 *会员电话 / Phone:* ${currentMember.phone}\n` +
          `🥗 *预订餐品 / Item:* ${mealQuantity}x ${chosenMeal.name} (${chosenMeal.nameZh})\n` +
          `📅 *送餐日期 / Date:* ${selectedDate}\n` +
          `⏰ *送餐时段 / Slot:* ${selectedSlot}\n` +
          `📍 *配送地址 / Address:* ${currentAddress}, ${currentArea} ${currentPostal}\n` +
          (dietaryNotes ? `⚠️ *忌口备注 / Dietary:* ${dietaryNotes}\n` : '') +
          `🎟️ *剩余套餐餐券 / Balance:* ${remainingAfter} 餐\n` +
          `📦 *状态:* 已排入后厨备餐排期 (Kitchen Prepping)\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `🌐 会员已成功提交订餐。`;

        // Pop up the official confirmation notification modal to ensure awareness and avoid double booking
        setRedemptionSuccessPopup({
          isOpen: true,
          orderNumber: orderNo,
          deliveryDate: selectedDate,
          formattedDate: formatDisplayDate(selectedDate),
          mealName: chosenMeal.name,
          mealNameZh: chosenMeal.nameZh,
          mealImage: chosenMeal.image,
          quantity: mealQuantity,
          deliverySlot: selectedSlot,
          deliveryAddress: currentAddress,
          area: currentArea,
          postalCode: currentPostal,
          remainingMealsAfter: remainingAfter,
          whatsappMessage: kitchenNotificationMsg,
        });

        setRedemptionSuccessMsg(
          language === 'en'
            ? `✓ Successfully booked ${mealQuantity} meal(s) (${chosenMeal.name}) for ${selectedDate}! Delivered: 10:00 AM – 2:00 PM.`
            : `✓ 成功预定 ${mealQuantity} 份餐品（${chosenMeal.nameZh}），将于 ${selectedDate} 午间（10:00 AM – 2:00 PM）送达！`
        );
        setTimeout(() => {
          setRedemptionSuccessMsg('');
        }, 6000);
      }
    };

    // Pre-check for existing booking on selected date to prevent accidental double booking
    const existingBooking = allRedemptions.find(
      (r) => r.memberId === currentMember.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled'
    );

    if (existingBooking) {
      setDoubleBookingWarning({
        isOpen: true,
        date: selectedDate,
        existingMealName: existingBooking.mealName,
        existingMealNameZh: existingBooking.mealNameZh,
        existingQty: alreadyBookedCountOnDate,
        newSlot: selectedSlot,
        newQty: mealQuantity,
        maxDailyQuota: maxDailyQuota,
        onProceed: () => {
          setDoubleBookingWarning(null);
          doSubmitRedemption();
        },
      });
      return;
    }

    doSubmitRedemption();
  };

  // Submit Advance Multi-Day Batch Redemption
  const handleBatchSubmit = () => {
    if (!currentMember || !currentMember.activePackage) return;

    const targetDays = visibleWorkdays.length > 0 ? visibleWorkdays : upcomingWorkdays;
    const daysCount = targetDays.length;
    if (daysCount === 0) {
      alert(
        language === 'en'
          ? 'No selectable workdays within your package validity. Please check expiry or request an admin adjustment.'
          : '当前配套有效期内无可选工作日。请检查配套有效期或联系管理员特批顺延。'
      );
      return;
    }

    if (currentMember.activePackage.remainingMeals < daysCount) {
      alert(
        language === 'en'
          ? `You need ${daysCount} meal credits for this week, but currently have ${currentMember.activePackage.remainingMeals}.`
          : `本次整周排餐需要 ${daysCount} 餐，但您目前剩余 ${currentMember.activePackage.remainingMeals} 餐。`
      );
      return;
    }

    // Check if any date already has max daily quota booked
    const overbookedDay = targetDays.find((dStr) => {
      const alreadyBooked = allRedemptions
        .filter((r) => r.memberId === currentMember.id && r.deliveryDate === dStr && r.status !== 'Cancelled')
        .reduce((sum, r) => sum + (r.quantity || 1), 0);
      return alreadyBooked + 1 > maxDailyQuota;
    });

    if (overbookedDay) {
      alert(
        language === 'en'
          ? `⚠️ Daily Quota Limit: ${overbookedDay} already has the maximum of ${maxDailyQuota} meals booked. Please adjust or choose specific dates in Single Meal tab.`
          : `⚠️ 每日配额限制：${overbookedDay} 已达到每日最高限额 ${maxDailyQuota} 份。请在单日兑换中灵活调整。`
      );
      return;
    }

    const batchOrderNo = generateUniqueOrderNumber('CH');
    const redemptionsList = targetDays.map((dateStr) => {
      const mealId = batchSchedule[dateStr] || menuItems[0]?.id;
      const meal = menuItems.find((m) => m.id === mealId) || menuItems[0];
      return {
        orderNumber: batchOrderNo,
        orderType: 'Meal Plan Redemption' as const,
        memberId: currentMember.id,
        memberName: currentMember.name,
        memberPhone: currentMember.phone,
        deliveryDate: dateStr,
        deliverySlot: 'Lunch (10:00 AM – 2:00 PM)',
        deliveryAddress: currentAddress,
        area: currentArea,
        postalCode: currentPostal,
        mealId: meal.id,
        mealName: meal.name,
        mealNameZh: meal.nameZh,
        mealImage: meal.image,
        quantity: 1,
        dietaryNotes,
        recipeStandard: 'Standard Chef Recipe' as const,
        autoReplySent: false,
      };
    });

    if (onBatchRedeemMeals) {
      onBatchRedeemMeals(redemptionsList);
    } else {
      // fallback single redemptions
      redemptionsList.forEach((r) => onRedeemMeal(r));
    }

    const remainingAfter = Math.max(0, currentMember.activePackage.remainingMeals - daysCount);

    // Pre-build optional batch notification message for CHILL Healthy Kitchen WhatsApp
    const batchKitchenMsg =
      `🍱 *CHILL Healthy 潮轻食 · 会员整周排餐预订凭据*\n` +
      `*Member Weekly Batch Schedule Booking*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *批次订单号 / Batch Order No:* #${batchOrderNo}\n` +
      `👤 *会员姓名 / Member Name:* ${currentMember.name}\n` +
      `📞 *会员电话 / Phone:* ${currentMember.phone}\n` +
      `📅 *排餐周期 / Scheduled Dates:* ${daysCount} 个工作日 (${targetDays[0]} ~ ${targetDays[targetDays.length - 1]})\n` +
      `⏰ *送餐时段 / Slot:* Lunch (10:00 AM – 2:00 PM)\n` +
      `📍 *配送地址 / Address:* ${currentAddress}, ${currentArea} ${currentPostal}\n` +
      `🎟️ *剩余套餐餐券 / Balance:* ${remainingAfter} 餐\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 会员已提交整周排餐预订。`;

    setRedemptionSuccessPopup({
      isOpen: true,
      orderNumber: batchOrderNo,
      deliveryDate: `${targetDays[0]} ~ ${targetDays[targetDays.length - 1]}`,
      formattedDate: `${formatDisplayDate(targetDays[0])} — ${formatDisplayDate(targetDays[targetDays.length - 1])}`,
      mealName: `${daysCount} Advance Scheduled Workday Bentos`,
      mealNameZh: `${daysCount} 个工作日提前整周排餐`,
      mealImage: menuItems[0]?.image || '',
      quantity: daysCount,
      deliverySlot: 'Lunch (10:00 AM – 2:00 PM)',
      deliveryAddress: currentAddress,
      area: currentArea,
      postalCode: currentPostal,
      remainingMealsAfter: remainingAfter,
      isBatch: true,
      batchDaysCount: daysCount,
      whatsappMessage: batchKitchenMsg,
    });

    setRedemptionSuccessMsg(
      language === 'en'
        ? `✓ Successfully planned all ${daysCount} upcoming workdays in advance!`
        : `✓ 成功一次性完成未来 ${daysCount} 个工作日的所有午餐排期！`
    );
  };

  // Randomize batch meals
  const handleRandomizeBatch = () => {
    const updated: { [date: string]: string } = {};
    upcomingWorkdays.forEach((dateStr) => {
      const randomDish = menuItems[Math.floor(Math.random() * menuItems.length)];
      updated[dateStr] = randomDish.id;
    });
    setBatchSchedule(updated);
  };

  const memberRedemptions = allRedemptions.filter((r) => r.memberId === currentMember?.id);
  const selectedMealObj = menuItems.find((m) => m.id === selectedMealId) || menuItems[0];

  const targetPhone = siteSettings.whatsappNumber.replace(/\D/g, '') || '0126189919';
  const whatsappLinkNumber = targetPhone.startsWith('60') ? targetPhone : `60${targetPhone.replace(/^0/, '')}`;

  return (
    <div
      id="customer-redeem-fullscreen-page"
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-stone-100 text-stone-900 flex flex-col overflow-hidden animate-in fade-in duration-150"
    >
      {/* =========================================================================
          TOP COMMAND & NAVIGATION BAR (FULL WIDTH, OPTIMIZED ACROSS MOBILE & DESKTOP)
          ========================================================================= */}
      <header className="shrink-0 bg-stone-900 text-white border-b border-stone-800 shadow-md z-30">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Brand & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <ChillLogo variant="badge" size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading font-black text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  CHILL<span className="text-[#4ade80]">HEALTHY</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 shrink-0">
                  {language === 'en' ? 'Customer Portal' : '会员餐券兑换'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate hidden md:block">
                {language === 'en'
                  ? 'Daily Healthy Bento Redemption · Advance Planner · Free Klang Valley Delivery'
                  : '每日健康便当在线兑换 · 提前整周排餐 · 1户口2地址灵活切换'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* When Logged In: Meal Balance Indicator */}
            {currentMember && (
              currentMember.activePackage && currentMember.activePackage.remainingMeals > 0 ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {currentMember.activePackage.remainingMeals} / {currentMember.activePackage.totalMeals}{' '}
                    {language === 'en' ? 'Meals Left' : '剩余餐券'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPortalTab('renew')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/70 text-amber-300 hover:bg-amber-900/80 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'en' ? '0 Meals · Select Plan' : '0餐额 · 选购配套'}</span>
                </button>
              )
            )}

            {/* Return to Public Store Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all cursor-pointer border border-stone-700 shadow-2xs active:scale-95"
              title={language === 'en' ? 'Back to Public Menu Store' : '返回点餐商城主页'}
            >
              <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Return to Store' : '返回点餐主页'}
              </span>
              <span className="sm:hidden">{language === 'en' ? 'Store' : '主页'}</span>
            </button>

            {/* WhatsApp Concierge */}
            {currentMember && (
              <a
                href={`https://wa.me/${whatsappLinkNumber}?text=Hi%20CHILL%20Healthy,%20I%20am%20member%20${encodeURIComponent(currentMember.name)}%20(${currentMember.memberNumber || currentMember.phone}).%20I%20need%20assistance%20with%20my%20daily%20meal%20plan.`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 text-xs font-bold transition-colors cursor-pointer border border-emerald-700/50"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Change Password Button */}
            {currentMember && (
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(true);
                  setPasswordChangeError('');
                  setPasswordChangeSuccess('');
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmPasswordInput('');
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition-colors cursor-pointer border border-stone-700"
                title={language === 'en' ? 'Change Password' : '修改登录密码'}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Password' : '改密码'}</span>
              </button>
            )}

            {/* Member Logout */}
            {currentMember && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer border border-stone-700"
                title={language === 'en' ? 'Log Out' : '退出登录'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'en' ? 'Logout' : '退出'}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Change Password Dialog Modal */}
        {isChangePasswordOpen && currentMember && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white text-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold text-stone-900">
                    {language === 'en' ? 'Change Member Password' : '修改会员登录密码'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {language === 'en'
                      ? `Member ID: ${currentMember.memberNumber || currentMember.phone}`
                      : `会员账号: ${currentMember.memberNumber || currentMember.phone}`}
                  </p>
                </div>
              </div>

              {passwordChangeError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      {language === 'en' ? 'Current Password *' : '当前原密码 *'}
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {language === 'en' ? 'Initial default: 123456' : '初始默认: 123456'}
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'New Password *' : '新密码 *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder={language === 'en' ? 'Enter new password (min 4 chars)' : '输入新密码（至少 4 位）'}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Confirm New Password *' : '确认新密码 *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder={language === 'en' ? 'Re-enter new password' : '再次输入新密码'}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : '取消'}
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    {language === 'en' ? 'Save Password' : '确认修改密码'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN BODY CONTAINER (FULL PAGE VERTICAL SCROLL, NO CONFINED POPUP)
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto bg-stone-100">
        {!currentMember ? (
          /* =========================================================================
             1. GUEST LOGIN & REGISTER SCREEN (RESPONSIVE FULL-PAGE CARD)
             ========================================================================= */
          <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-md shadow-emerald-700/20">
                  C
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900">
                  {language === 'en' ? 'CHILL Healthy Member Portal' : '潮轻食 · 会员中心与餐券兑换'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
                  {language === 'en'
                    ? 'Log in to redeem your daily healthy bento, plan upcoming workdays in advance, and manage delivery addresses.'
                    : '登录会员账号即可每日在线兑换套餐餐盒、查询剩余餐数及配送进度。'}
                </p>
              </div>

              {/* Auth Mode Switch */}
              <div className="grid grid-cols-3 p-1 bg-stone-100 rounded-2xl max-w-sm mx-auto mb-6 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {language === 'en' ? 'Member Login' : '会员登录'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {language === 'en' ? 'Register' : '注册账号'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'forgot' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {language === 'en' ? 'Reset (TAC)' : '重置密码'}
                </button>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 block">
                        {language === 'en' ? 'Member Login Number (Handphone Number) *' : '会员登录账号 (您的手机号码) *'}
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {language === 'en' ? 'Phone = Member ID' : '手机即会员号'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="0126189919"
                      className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      {language === 'en'
                        ? '💡 Enter your registered handphone number (e.g. 0126189919) to log in.'
                        : '💡 请输入您的注册手机号码（如 0126189919）作为会员账号登录。'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 block">
                        {language === 'en' ? 'Password *' : '登录密码 *'}
                      </label>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {language === 'en' ? 'Default: 123456' : '默认初始: 123456'}
                      </span>
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="123456"
                      className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-stone-500">
                        {language === 'en' ? '💡 Default password is 123456.' : '💡 默认初始密码为 123456。'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPhone(loginEmail);
                          setForgotError('');
                          setForgotSuccess('');
                          setAuthMode('forgot');
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Forgot Password (TAC)?' : '忘记密码(TAC)?'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  >
                    {language === 'en' ? 'Log In to Member Portal' : '立即登录会员中心'}
                  </button>

                  {/* Quick Demo Login Preset */}
                  <div className="pt-4 border-t border-stone-100 text-center space-y-2">
                    <span className="text-[11px] text-stone-400 font-medium block">
                      {language === 'en' ? 'Quick One-Click Test Demo Accounts (Password: 123456):' : '快速一键免密体验测试账号 (默认密码: 123456)：'}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('0126189919')}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer text-left sm:text-center"
                      >
                        <span>Agnes Lim (0126189919 · 15 Meals Left)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('0123344556')}
                        className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer text-left sm:text-center"
                      >
                        <span>Marcus (0123344556 · 4 Meals Left)</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : authMode === 'forgot' ? (
                /* Forgot Password via WhatsApp TAC Form */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'en' ? 'Reset Password via WhatsApp TAC' : '通过 WhatsApp 获取安全验证码重置密码'}</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {language === 'en'
                        ? 'Enter your registered handphone number. We will dispatch a 6-digit TAC security code directly to your WhatsApp to verify and reset your password.'
                        : '请输入您的注册手机号码。系统将向您的 WhatsApp 发送 6 位 TAC 安全验证码，验证后即可设置全新密码。'}
                    </p>
                  </div>

                  {forgotError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        {language === 'en' ? 'Registered Handphone Number *' : '注册会员手机号码 *'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          required
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          placeholder="e.g. 0126189919"
                          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSendWhatsAppTac}
                          disabled={tacTimer > 0}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap disabled:bg-stone-300 disabled:cursor-not-allowed"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>
                            {tacTimer > 0
                              ? `${tacTimer}s`
                              : language === 'en'
                              ? 'Get WhatsApp TAC'
                              : '获取 WhatsApp 验证码'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {isTacSent && (
                      <form onSubmit={handleVerifyTacAndReset} className="space-y-3 pt-2 border-t border-stone-100">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                          <span className="font-medium">
                            {language === 'en' ? 'Your WhatsApp TAC Code is:' : '您的 WhatsApp 验证码为：'}
                          </span>
                          <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-amber-300">
                            {generatedTac}
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            {language === 'en' ? 'Enter 6-Digit WhatsApp TAC Code *' : '输入 WhatsApp 6位验证码 *'}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={forgotTacInput}
                            onChange={(e) => setForgotTacInput(e.target.value)}
                            placeholder="6-digit TAC code"
                            className="w-full tracking-widest font-mono text-center text-sm font-bold px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              {language === 'en' ? 'New Password *' : '设置新密码 *'}
                            </label>
                            <input
                              type="password"
                              required
                              value={forgotNewPass}
                              onChange={(e) => setForgotNewPass(e.target.value)}
                              placeholder="min. 4 characters"
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              {language === 'en' ? 'Confirm New Password *' : '确认新密码 *'}
                            </label>
                            <input
                              type="password"
                              required
                              value={forgotConfirmPass}
                              onChange={(e) => setForgotConfirmPass(e.target.value)}
                              placeholder="re-enter password"
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{language === 'en' ? 'Verify TAC & Reset Password' : '验证 TAC 并完成重置密码'}</span>
                        </button>
                      </form>
                    )}

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-xs text-stone-500 hover:text-stone-800 font-bold hover:underline cursor-pointer"
                      >
                        {language === 'en' ? '← Back to Member Login' : '← 返回会员登录'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Validation Error Alert */}
                  {regError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Section 1: Member Info */}
                  <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'en' ? 'Personal Info & Login ID' : '基本资料与登录账号'}</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {language === 'en' ? '* Required fields' : '* 必填项目'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          {language === 'en' ? 'Full Name *' : '会员姓名 *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder={language === 'en' ? 'e.g. Jessica Chen' : '例如：陈美玲'}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-700 block">
                            {language === 'en' ? 'Malaysian Handphone (Login ID) *' : '马来西亚手机号码 (会员登录账号) *'}
                          </label>
                          {regPhone && (
                            <span className="text-[10px] font-bold">
                              {isValidMalaysianHandphone(regPhone) ? (
                                <span className="text-emerald-700 flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>🇲🇾 {language === 'en' ? 'Valid Mobile' : '有效手机号'}</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>🇲🇾 01x-xxxxxxx</span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="e.g. 012-618 9919"
                            className={`w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border ${
                              regPhone && !isValidMalaysianHandphone(regPhone)
                                ? 'border-amber-400 bg-amber-50/40 text-stone-900'
                                : 'border-emerald-600/40 bg-emerald-50/30 text-stone-900'
                            } focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          {language === 'en'
                            ? 'Eligible Malaysian Handphone Number (01x-xxxxxxx)'
                            : '必须为有效的马来西亚手机号码（01x 开头，10-11位）'}
                        </span>
                        <p className="text-[10.5px] text-emerald-800 mt-0.5">
                          {language === 'en'
                            ? 'Your mobile number serves as your official Member ID for fast WhatsApp verification and one-click login.'
                            : '您的手机号码将作为官方会员账号，用于 WhatsApp 快速核验与一键登录。'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          {language === 'en' ? 'Email Address (Optional)' : '电子邮箱 (选填)'}
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="jessica@example.com"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-700 block">
                            {language === 'en' ? 'Login Password' : '登录密码'}
                          </label>
                          <span className="text-[10px] text-stone-500 font-medium">
                            {language === 'en' ? 'Default: 123456' : '默认: 123456'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                          placeholder="123456"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 1 or 2 Delivery Addresses */}
                  <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-stone-900">
                          {language === 'en' ? 'Delivery Addresses (1 or 2 Addresses)' : '配送地址 (必须填写1或2个地址)'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        {hasRegAddress2
                          ? (language === 'en' ? '2 Addresses Registered' : '已设定2个送餐地址')
                          : (language === 'en' ? '1 Address (Can add 2nd)' : '填好地址一，可加第二地址')}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600">
                      {language === 'en'
                        ? 'Address 1 is mandatory (e.g. Office). You can also add Address 2 (e.g. Home) so you can switch delivery spots effortlessly.'
                        : '送餐地址一为必填（如办公室/主地址）；亦可同时填写地址二（如住家），日常配送随心一键切换。'}
                    </p>

                    {/* Address 1 Box (Mandatory) */}
                    <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'en' ? 'Address 1 (Primary / Office / Main) *' : '地址一 (主送餐点 / 办公室 / 住家) *'}</span>
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {language === 'en' ? 'Mandatory' : '必填'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-stone-500 block mb-1">
                            {language === 'en' ? 'Area / Region *' : '配送区域 *'}
                          </label>
                          <select
                            value={regArea}
                            onChange={(e) => setRegArea(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                          >
                            <option value="Klang / Bukit Tinggi">Klang / Bukit Tinggi (巴生)</option>
                            <option value="Shah Alam / Kota Kemuning">Shah Alam (莎阿南)</option>
                            <option value="Subang Jaya / USJ">Subang Jaya / USJ (梳邦再也)</option>
                            <option value="Petaling Jaya / Damansara">Petaling Jaya (八打灵)</option>
                            <option value="Puchong">Puchong (蒲种)</option>
                            <option value="Kuala Lumpur CBD / Bangsar">Kuala Lumpur CBD (吉隆坡)</option>
                            <option value="Cheras / Ampang">Cheras / Ampang (蕉赖/安邦)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-stone-500 block mb-1">
                            {language === 'en' ? 'Postal Code *' : '邮区编号 *'}
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            required
                            value={regPostal}
                            onChange={(e) => setRegPostal(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 41200"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-stone-500 block mb-1">
                          {language === 'en' ? 'Detailed Street / Unit / Building *' : '详细街道 / 门牌 / 大厦楼层 *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder={language === 'en' ? 'Unit, Level, Building Name, Street...' : '例如：Unit 12-03, Menara Symphony, Jalan Kemuning Prima'}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Address 2 Option (1 or 2 addresses) */}
                    {!hasRegAddress2 ? (
                      <button
                        type="button"
                        onClick={() => setHasRegAddress2(true)}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-400/80 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Home className="w-4 h-4 text-emerald-700" />
                        <span>
                          {language === 'en'
                            ? '+ Add Address 2 (Home / Secondary Delivery Location)'
                            : '+ 添加第二配送地址 (住家 / 备用送餐点)'}
                        </span>
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/30 space-y-2.5 shadow-2xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{language === 'en' ? 'Address 2 (Secondary / Home / Office) *' : '地址二 (备用送餐点 / 住家 / 第二地址) *'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setHasRegAddress2(false);
                              setRegAddress2('');
                              setRegPostal2('');
                            }}
                            className="text-[11px] text-stone-500 hover:text-red-600 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === 'en' ? 'Remove Address 2' : '移除地址二'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 block mb-1">
                              {language === 'en' ? 'Area / Region *' : '配送区域 *'}
                            </label>
                            <select
                              value={regArea2}
                              onChange={(e) => setRegArea2(e.target.value)}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                            >
                              <option value="Klang / Bukit Tinggi">Klang / Bukit Tinggi (巴生)</option>
                              <option value="Shah Alam / Kota Kemuning">Shah Alam (莎阿南)</option>
                              <option value="Subang Jaya / USJ">Subang Jaya / USJ (梳邦再也)</option>
                              <option value="Petaling Jaya / Damansara">Petaling Jaya (八打灵)</option>
                              <option value="Puchong">Puchong (蒲种)</option>
                              <option value="Kuala Lumpur CBD / Bangsar">Kuala Lumpur CBD (吉隆坡)</option>
                              <option value="Cheras / Ampang">Cheras / Ampang (蕉赖/安邦)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-stone-500 block mb-1">
                              {language === 'en' ? 'Postal Code *' : '邮区编号 *'}
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              required
                              value={regPostal2}
                              onChange={(e) => setRegPostal2(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 40150"
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-stone-500 block mb-1">
                            {language === 'en' ? 'Detailed Street / House / Condo *' : '详细街道 / 门牌 / 屋苑 *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={regAddress2}
                            onChange={(e) => setRegAddress2(e.target.value)}
                            placeholder={language === 'en' ? 'e.g. No. 18, Jalan Botanic 2, Bandar Botanic' : '例如：No. 18, Jalan Botanic 2, Bandar Botanic'}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 0-Meal Initial Registration Notice */}
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-900 block">
                        {language === 'en' ? '0 Meals Initial Policy · You Decide What to Buy' : '0 餐额初始政策 · 自由决定购买配套或单点'}
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {language === 'en'
                          ? 'New member accounts are registered with 0 meals and no forced subscription. Once registered, you can choose to purchase a meal plan (5-day, 10-day, 20-day) or order ala carte on-demand!'
                          : '新注册账号初始包含 0 份餐额，不强制绑定任何套餐。注册后您可以自由按需选购周期餐包，或直接单点今日轻食外卖！'}
                      </p>
                    </div>
                  </div>

                  {/* Select Order Intent Upon Registration: Buy Ala Carte Meal vs Subscribe Plan */}
                  <div className="bg-stone-50/90 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'en' ? 'Select Option Upon Registration:' : '注册完成后您想先体验什么？'}</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {language === 'en' ? 'Flexible & Switchable' : '随时自由选择'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRegIntent('alacarte')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          regIntent === 'alacarte'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600/30'
                            : 'border-stone-200 text-stone-700 hover:bg-white bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                            <span>{language === 'en' ? 'Register & Buy Ala Carte Meal' : '注册并单点今日外卖餐品'}</span>
                          </span>
                          {regIntent === 'alacarte' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 font-normal leading-snug">
                          {language === 'en'
                            ? 'Single bentos on-demand. Pay via DuitNow QR or WhatsApp!'
                            : '零绑约单点鲜食。支持 DuitNow QR 或 WhatsApp 转账！'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegIntent('plan')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          regIntent === 'plan'
                            ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-600/30'
                            : 'border-stone-200 text-stone-700 hover:bg-white bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span>{language === 'en' ? 'Register & Subscribe Meal Plan' : '注册并订购周期健康餐配套'}</span>
                          </span>
                          {regIntent === 'plan' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 font-normal leading-snug">
                          {language === 'en'
                            ? '5/10/20 Days · From RM19.90/meal · Save RM120+ with Free Delivery'
                            : '5/10/20天餐包 · 低至RM19.90/餐 · 享天天免运立省RM120+'}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Registration CTA */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {regIntent === 'alacarte'
                        ? language === 'en'
                          ? 'Register Account & Order Ala Carte Meal (0 Meals Initial)'
                          : '立即注册账号并开启单点选餐 (初始0餐 · 免绑约)'
                        : language === 'en'
                        ? 'Register Account & View Meal Plans'
                        : '立即注册账号并选购超值配套 (RM398起)'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
             2. LOGGED IN MEMBER PORTAL DASHBOARD (EXPANSIVE FULL-PAGE WORKSPACE)
             ========================================================================= */
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            {/* Top Member Credit & Status Summary Banner */}
            <div className="bg-stone-900 text-white p-4 sm:p-6 rounded-3xl relative overflow-hidden shadow-lg border border-stone-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-xl shrink-0 shadow-md shadow-emerald-600/30">
                    {currentMember.name.substring(0, 1)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg sm:text-2xl font-bold text-white">
                        {currentMember.name}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40">
                        {language === 'en' ? 'Healthy Meal Member' : '潮轻食尊荣会员'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[11px] font-bold border border-emerald-700/60 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{language === 'en' ? 'Member ID / Phone:' : '会员登录账号/手机:'} {currentMember.memberNumber || currentMember.phone}</span>
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[200px] sm:max-w-none">{currentMember.email}</span>
                    </div>
                  </div>
                </div>

                {/* Package Credits Progress Meter */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-stone-800/80 p-3.5 sm:p-4 rounded-2xl border border-stone-700/80">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
                      {language === 'en' ? 'Active Meal Package' : '当前生效配套'}
                    </span>
                    <p className="font-heading font-extrabold text-white text-sm sm:text-base">
                      {currentMember.activePackage
                        ? language === 'en'
                          ? currentMember.activePackage.planName
                          : currentMember.activePackage.planNameZh
                        : language === 'en'
                        ? 'No Active Package'
                        : '暂无生效配套'}
                    </p>
                    {currentMember.activePackage && (() => {
                      const isPendingAdminConfirmation = currentMember.activePackage.adminConfirmed === false;
                      const expInfo = getEffectivePackageExpiry(currentMember.activePackage, siteSettings.disabledDeliveryDates || []);
                      const vDays = expInfo.validityDays || getPlanValidityDays(currentMember.activePackage.planId);
                      const isPendingActivation = !currentMember.activePackage.isActivated || !currentMember.activePackage.firstRedeemedDate;
                      const hasSpecialCase = Boolean(currentMember.activePackage.specialCaseExtension);
                      const isPackExpired = Boolean(expInfo.isExpired && !hasSpecialCase);

                      return (
                        <div className="mt-1 space-y-1">
                          {isPendingAdminConfirmation ? (
                            <>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                  <span>⏳ {language === 'en' ? 'WA Auto-Reply Pending · Admin Review' : '待店主确认开通 (WA回执待处理)'}</span>
                                </span>
                                {currentMember.activePackage.signupOrderNo && (
                                  <span className="text-[10px] font-mono font-bold text-amber-300">
                                    #{currentMember.activePackage.signupOrderNo}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-amber-300/90 block">
                                {language === 'en'
                                  ? '• Subscribed plan is awaiting admin confirmation in Back Office. Meal redemption unlocks upon confirmation.'
                                  : '• 所购配套正等待后台管理员审核确认。管理员在后台确认开通后，将即刻开启每日选餐权限！'}
                              </span>
                            </>
                          ) : isPendingActivation ? (
                            <>
                              <span className="text-[11px] text-sky-400 font-extrabold flex items-center gap-1">
                                <span>⏳ {language === 'en' ? 'Status: Pending First Meal Order' : '状态：等待首餐预订激活'}</span>
                              </span>
                              <span className="text-[10px] text-stone-300 block">
                                {language === 'en'
                                  ? `• Validity standard: ${vDays} Mon–Fri weekdays (${vDays === 30 ? '20 meals' : vDays === 15 ? '10 meals' : '5 meals'})`
                                  : `• 有效期标准：${vDays} 个工作日（${vDays === 30 ? '20餐' : vDays === 15 ? '10餐' : '5餐'}）`}
                              </span>
                              <span className="text-[10px] text-amber-300/90 block">
                                {language === 'en'
                                  ? '• Date of activation begins on first meal you order (not purchase date)'
                                  : '• 有效期以首个预订送餐日正式激活起算（绝非购买配套日期）'}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[11px] font-extrabold ${isPackExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                                  📅 {language === 'en' ? 'Validity Date: Until' : '有效截止日期：至'} {expInfo.effectiveExpiryDate || currentMember.activePackage.expiryDate}
                                </span>
                                {hasSpecialCase && (
                                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded">
                                    ⭐ {language === 'en' ? 'Special Case Active' : '特批顺延生效中'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-300 block">
                                {language === 'en'
                                  ? `• ${vDays} Mon–Fri weekdays (Activated on ${currentMember.activePackage.firstRedeemedDate} · ${expInfo.remainingWorkdays} workdays left)`
                                  : `• 共 ${vDays} 个工作日（于 ${currentMember.activePackage.firstRedeemedDate} 激活 · 剩余 ${expInfo.remainingWorkdays} 个工作日）`}
                              </span>
                              {hasSpecialCase && currentMember.activePackage.specialCaseNotes && (
                                <span className="text-[10px] text-amber-300 block">
                                  • {language === 'en' ? 'Special Case Note: ' : '特批说明：'}{currentMember.activePackage.specialCaseNotes}
                                </span>
                              )}
                              <span className="text-[10px] text-amber-300/90 block">
                                {language === 'en'
                                  ? '• Mon–Fri only · Klang Valley public holidays auto-extend validity date +1 day'
                                  : '• 仅限周一至五 · 巴生谷公假自动顺延 +1 天工作日'}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="h-9 w-px bg-stone-700 hidden sm:block" />

                  {currentMember.activePackage ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Balance Meal Available */}
                      <div className="bg-stone-900/90 px-3.5 py-2 rounded-xl border border-stone-700/70">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                          {language === 'en' ? 'Meal Balance' : '剩余可用餐券'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-heading text-2xl sm:text-3xl font-black text-emerald-400">
                            {currentMember.activePackage.remainingMeals}
                          </span>
                          <span className="text-xs text-stone-400">
                            / {currentMember.activePackage.totalMeals}
                          </span>
                        </div>
                      </div>

                      {/* Redeem Daily Meal Button */}
                      <button
                        onClick={() => setPortalTab('redeem')}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-emerald-600"
                      >
                        <Utensils className="w-3.5 h-3.5 text-emerald-200" />
                        <span>{language === 'en' ? 'Redeem Meal' : '每日选餐'}</span>
                      </button>

                      {/* Refer Friends Quick Button (Only referral program gives free meals) */}
                      <button
                        onClick={() => setPortalTab('referral')}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-400/40"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'en' ? 'Refer Friends (+1 Free Meal)' : '邀请好友 (获赠免费餐)'}</span>
                      </button>

                      {/* Packages & Renew Button */}
                      <button
                        onClick={() => setPortalTab('renew')}
                        className="px-3.5 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-stone-600"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-stone-300" />
                        <span>{language === 'en' ? 'Renew Package' : '续订配套'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPortalTab('renew')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 hover:from-amber-400 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                        <span>{language === 'en' ? '👑 Subscribe Plan (Save RM120+)' : '👑 选购超值配套 (立省RM120+)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenMenu || onClose}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-600/60 shadow-xs"
                        title={language === 'en' ? 'Order Fresh Ala Carte Bento (Pay via DuitNow QR or WhatsApp)' : '单点今日外卖餐盒（支持DuitNow QR或WhatsApp付款）'}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'en' ? '🍱 Order Ala Carte (QR/WhatsApp)' : '🍱 单点今日外卖 (QR/WhatsApp付款)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Bar Strip */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {language === 'en'
                      ? '⏰ Next-Day Cutoff: Select before 5:00 PM · Lunch Delivered Fresh 10:00 AM – 2:00 PM (Mon–Fri)'
                      : '⏰ 隔天午餐请在下午 5:00 前完成选择 · 周一至周五午餐新鲜送达（10:00 AM – 2:00 PM）'}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {language === 'en' ? 'Free Klang Valley Delivery · 1 Account 2 Addresses' : '巴生谷全免运费 · 1户口支持办公室与住家双地址'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setPortalTab('redeem')}
                className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  portalTab === 'redeem'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>{language === 'en' ? 'Daily Next-Day Meal (每天选餐)' : '每天选择隔天餐点'}</span>
              </button>

              <button
                onClick={() => setPortalTab('planner')}
                className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  portalTab === 'planner'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                <span>{language === 'en' ? 'Advance Planner (整周排餐)' : '一次性选择所有餐点'}</span>
              </button>

              <button
                onClick={() => setPortalTab('history')}
                className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  portalTab === 'history'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>
                  {language === 'en' ? 'Delivery Logs' : '订餐派送记录'} ({memberRedemptions.length})
                </span>
              </button>

              <button
                onClick={() => setPortalTab('referral')}
                className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  portalTab === 'referral'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-500" />
                <span>
                  {language === 'en' ? 'Refer Friends (+1 Free Meal)' : '邀请好友 (送免费餐)'}
                </span>
                {(currentMember.referralBonusMealsEarned || currentMember.referralsCount) ? (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-900 shadow-2xs">
                    +{currentMember.referralBonusMealsEarned || currentMember.referralsCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setPortalTab('renew')}
                className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  portalTab === 'renew'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>{language === 'en' ? 'Packages & Renew' : '配套续订'}</span>
              </button>
            </div>

            {/* Tab 1: DAILY NEXT-DAY MEAL SELECTION (RESPONSIVE FULL-PAGE VIEW) */}
            {portalTab === 'redeem' && (
              <div className="space-y-4">
                {redemptionSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-2.5 font-bold animate-in fade-in shadow-xs">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{redemptionSuccessMsg}</span>
                  </div>
                )}

                {/* Gate: If Package Subscription is Pending Confirmation by Admin at Back End Office */}
                {currentMember?.activePackage && currentMember.activePackage.adminConfirmed === false ? (
                  <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-xl text-center space-y-4 animate-in fade-in">
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                        {language === 'en' ? 'WA Auto-Reply Pending · Admin Confirmation' : '待店主确认开通 · WhatsApp/后台确认中'}
                      </span>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-stone-900 mt-2">
                        {language === 'en' ? 'Meal Package Awaiting Admin Confirmation' : '餐食配套正在等待后台管理员确认开通'}
                      </h3>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
                      <div className="flex justify-between items-center text-stone-600">
                        <span>{language === 'en' ? 'Order Number:' : '配套订单编号：'}</span>
                        <span className="font-mono font-black text-stone-900 bg-stone-200/70 px-2 py-0.5 rounded">
                          #{currentMember.activePackage.signupOrderNo || 'CH-261007-6834'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>{language === 'en' ? 'Subscribed Package:' : '已订购配套：'}</span>
                        <span className="font-bold text-emerald-800">{currentMember.activePackage.planName}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>{language === 'en' ? 'Customer Details:' : '会员信息：'}</span>
                        <span className="font-medium text-stone-800">{currentMember.name} · {currentMember.phone}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>{language === 'en' ? 'Delivery Address 1:' : '送餐地址一：'}</span>
                        <span className="font-medium text-stone-800 truncate max-w-[280px]">
                          {currentMember.address}, {currentMember.area} ({currentMember.postalCode})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
                      {language === 'en'
                        ? 'Thank you for subscribing to CHILL Healthy! For kitchen capacity and payment verification, your package order is currently pending confirmation by our kitchen admin in the back office. Daily meal redemption will unlock immediately upon admin confirmation.'
                        : '感谢您订购【潮轻食】健康餐配套！为保障厨房排产与付款核对，您的配套申请正在等待管理员在后台确认开通。管理员在后台确认后，即可立即在此开始每日选餐与配送！'}
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href={`https://wa.me/60126189919?text=${encodeURIComponent(
                          `Hi CHILL Healthy! 👋 I have placed a package subscription order #${currentMember.activePackage.signupOrderNo || 'CH-261007-6834'} for ${currentMember.name} (${currentMember.phone}) - ${currentMember.activePackage.planName}. Please help confirm my package at the backend page so I can redeem meals. Thank you!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{language === 'en' ? 'WhatsApp Admin for Fast Activation (+60126189919)' : '联系店主 WhatsApp 极速确认开通 (+60126189919)'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: Delivery Settings & Order Form (4-5 cols on desktop) */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-4">
                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                      <div className="border-b border-stone-100 pb-3">
                        <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-700" />
                          <span>{language === 'en' ? 'Delivery Address' : '配送地址 (1户口2地址)'}</span>
                        </h4>
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          {language === 'en' ? 'Click either address below to set destination' : '点击下方地址即可一键切换今天送餐点'}
                        </span>
                      </div>

                      {/* 1 Account 2 Addresses Selector */}
                      <div className="space-y-2">
                        {/* Address 1: Office/Main */}
                        <div
                          onClick={() => setSelectedAddressSlot(1)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            selectedAddressSlot === 1
                              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <Building className={`w-5 h-5 shrink-0 mt-0.5 ${selectedAddressSlot === 1 ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <div className="min-w-0 text-xs flex-1">
                            <div className="font-bold text-stone-900 flex items-center justify-between">
                              <span>{language === 'en' ? 'Address 1 (Office / Main)' : '地址一 (办公室/主地址)'}</span>
                              {selectedAddressSlot === 1 && (
                                <span className="text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 text-[11px] mt-1 line-clamp-2">
                              {currentMember.address}, {currentMember.area} ({currentMember.postalCode})
                            </p>
                          </div>
                        </div>

                        {/* Address 2: Home/Secondary */}
                        <div
                          onClick={() => {
                            if (!currentMember.address2) {
                              setIsEditingAddress2(true);
                            } else {
                              setSelectedAddressSlot(2);
                            }
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            selectedAddressSlot === 2
                              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <Home className={`w-5 h-5 shrink-0 mt-0.5 ${selectedAddressSlot === 2 ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <div className="min-w-0 text-xs flex-1">
                            <div className="font-bold text-stone-900 flex items-center justify-between">
                              <span>{language === 'en' ? 'Address 2 (Home / Secondary)' : '地址二 (住家/第二地址)'}</span>
                              {selectedAddressSlot === 2 && (
                                <span className="text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            {currentMember.address2 ? (
                              <p className="text-stone-600 text-[11px] mt-1 line-clamp-2">
                                {currentMember.address2}, {currentMember.area2 || currentMember.area} ({currentMember.postalCode2 || currentMember.postalCode})
                              </p>
                            ) : (
                              <p className="text-emerald-700 font-bold mt-1 text-[11px]">
                                + {language === 'en' ? 'Click to Set Address 2' : '点击添加第二送餐地址'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* If both addresses are filled, display permanent locked banner */}
                        {Boolean(currentMember.address && currentMember.address2 && currentMember.address2.trim()) && (
                          <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-[11px] flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <span>{language === 'en' ? 'Addresses Locked (2/2 Filled)' : '送餐地址已锁定 (2/2 已填满)'}</span>
                            </span>
                            <a
                              href={`https://wa.me/60126189919?text=${encodeURIComponent(`Hi CHILL Healthy, I would like to request an update to one of my registered delivery addresses for member account ${currentMember.name} (${currentMember.phone}).`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 font-bold hover:underline shrink-0"
                            >
                              {language === 'en' ? 'Admin Help on WA' : '联系店主协助'}
                            </a>
                          </div>
                        )}

                        {/* Inline Address 2 Editor (only available if Address 2 is not filled yet) */}
                        {!currentMember.address2 && isEditingAddress2 && (
                          <div className="p-3.5 bg-stone-50 rounded-2xl border-2 border-emerald-400 space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-950 block">
                                {language === 'en' ? 'Fill Up Address 2 (Google Maps Valid):' : '填写地址二 (需为谷歌地图有效地址):'}
                              </span>
                              {editAddr2.trim().length >= 4 && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${editAddr2}, ${editArea2} ${editPostal2}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>{language === 'en' ? 'Verify on Maps ↗' : '谷歌地图核对 ↗'}</span>
                                </a>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editAddr2}
                              onChange={(e) => setEditAddr2(e.target.value)}
                              placeholder="Unit, Condo / Street Address"
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editArea2}
                                onChange={(e) => setEditArea2(e.target.value)}
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white font-medium"
                              >
                                <option value="Klang / Bukit Tinggi">Klang / Bukit Tinggi</option>
                                <option value="Shah Alam / Kota Kemuning">Shah Alam</option>
                                <option value="Subang Jaya / USJ">Subang Jaya</option>
                                <option value="Petaling Jaya / Damansara">Petaling Jaya</option>
                                <option value="Puchong">Puchong</option>
                                <option value="Kuala Lumpur CBD / Bangsar">Kuala Lumpur</option>
                                <option value="Cheras / Ampang">Cheras / Ampang</option>
                              </select>
                              <input
                                type="text"
                                maxLength={5}
                                value={editPostal2}
                                onChange={(e) => setEditPostal2(e.target.value.replace(/\D/g, ''))}
                                placeholder="Postal Code (5 digits)"
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white font-mono"
                              />
                            </div>
                            <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-snug">
                              {language === 'en'
                                ? '⚠️ Notice: Once 2 addresses are filled up, you are not allowed to edit the addresses anymore. All addresses must be valid in Google Maps.'
                                : '⚠️ 提示：一旦填满2个地址，系统将永久锁定地址，顾客不可再自行修改。所有地址必须为 Google 地图有效地址。'}
                            </p>
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setIsEditingAddress2(false)}
                                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                              >
                                {language === 'en' ? 'Cancel' : '取消'}
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveAddress2}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                              >
                                {language === 'en' ? 'Save & Lock Address 2' : '保存并锁定地址二'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delivery Date & Time Window */}
                      <div className="space-y-3 pt-1 border-t border-stone-100">
                        {isExpired && !isSpecialCase ? (
                          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-950 space-y-2.5">
                            <div className="flex items-center gap-2 font-black text-xs text-red-800">
                              <Lock className="w-4 h-4 text-red-600 shrink-0" />
                              <span>
                                {language === 'en'
                                  ? 'Package Validity Ended · Date Selection Closed'
                                  : '配套有效期已届满 · 选餐日期已锁定关闭'}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-red-900">
                              {language === 'en'
                                ? `Your meal package validity officially ended on ${effectiveExpiryDate}. Customer date selection is disabled after package expiry.`
                                : `您的配套有效日期已于 ${effectiveExpiryDate} 正式到期。根据系统规则，配套到期后将关闭订餐选日权限。`}
                            </p>
                            <div className="p-3 rounded-xl bg-white border border-red-200 text-[11px] text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <span>
                                {language === 'en'
                                  ? 'Need an extension for a special case (e.g. medical leave or emergency)?'
                                  : '如因特殊情况（如病假就医或突发出差）需特批顺延？'}
                              </span>
                              <a
                                href={buildWhatsAppUrl(
                                  siteSettings.whatsappNumber,
                                  `Hi Admin, my meal package (${activePkg?.planName}) validity ended on ${effectiveExpiryDate}. Requesting special case validity adjustment / extension for my account (${currentMember.name}, ${currentMember.phone}).`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{language === 'en' ? 'Request Admin Special Case Adjustment' : '联系管理员特批调整'}</span>
                              </a>
                            </div>
                            <p className="text-[10px] text-stone-500 italic">
                              {language === 'en'
                                ? 'Note: Validity dates can be adjusted via the Admin Page only for special cases.'
                                : '提示：管理员可在后台管理页面针对特殊情况灵活调整有效期并解除选日锁定。'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            {/* Special Case Extension Banner */}
                            {isSpecialCase && (
                              <div className="mb-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-emerald-300 text-[11px] text-emerald-950 flex items-start gap-2 shadow-2xs">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-emerald-900 block">
                                    ⭐ {language === 'en' ? 'Admin Special Case Adjustment Active' : '管理员特批顺延已生效'}
                                  </span>
                                  <span>
                                    {language === 'en'
                                      ? `Validity extended until ${effectiveExpiryDate}${activePkg?.specialCaseNotes ? ` (${activePkg.specialCaseNotes})` : ''}. Date selection unlocked up to ${effectiveExpiryDate}.`
                                      : `有效期已特批顺延至 ${effectiveExpiryDate}${activePkg?.specialCaseNotes ? `（原因：${activePkg.specialCaseNotes}）` : ''}，选餐日期已解除限制。`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* First Meal Order Activation Notice */}
                            {isPendingFirstMeal && (
                              <div className="mb-2.5 p-3 rounded-xl bg-sky-50 border border-sky-300 text-[11px] text-sky-950 flex items-start gap-2 shadow-2xs">
                                <Clock className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-sky-900 block">
                                    🌟 {language === 'en' ? 'First Meal Activation Rule' : '首餐生效规则'}
                                  </span>
                                  <span>
                                    {language === 'en'
                                      ? `Your package validity countdown (${expInfo?.validityDays || 30} Mon–Fri weekdays) officially activates on the delivery date of your first meal ordered below, NOT on your package purchase date.`
                                      : `您的配套有效期（共 ${expInfo?.validityDays || 30} 个工作日）将以您在此选择的首个实际送餐日正式激活起算，绝非购买配套日期。`}
                                  </span>
                                </div>
                              </div>
                            )}

                            <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{language === 'en' ? 'Delivery Date (Monday – Friday Only) *' : '送餐日期 (仅限周一至周五) *'}</span>
                              </span>
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                {language === 'en' ? 'Weekdays Only' : '工作日专送'}
                              </span>
                            </label>
                            <input
                              type="date"
                              required
                              min={getNextWorkday(1)}
                              max={!isSpecialCase && effectiveExpiryDate ? effectiveExpiryDate : undefined}
                              value={selectedDate}
                              onChange={(e) => handleDateChange(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600"
                            />

                            {/* Quick Workday Selector Buttons */}
                            <div className="mt-2 space-y-1">
                              <span className="text-[10px] text-stone-500 block font-medium">
                                {language === 'en' ? 'Quick select upcoming workdays:' : '快捷选择即将到来的工作日：'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {visibleWorkdays.map((wDate) => {
                                  const isSelected = selectedDate === wDate;
                                  const isOff = siteSettings.disabledDeliveryDates?.includes(wDate);
                                  const hol = getMalaysiaHolidayInfo(wDate);
                                  const dObj = new Date(wDate + 'T00:00:00');
                                  const dayName = dObj.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
                                    weekday: 'short',
                                    month: 'numeric',
                                    day: 'numeric',
                                  });

                                  return (
                                    <button
                                      key={wDate}
                                      type="button"
                                      disabled={isOff}
                                      onClick={() => handleDateChange(wDate)}
                                      title={
                                        isOff && hol
                                          ? `Malaysia Bank Public Holiday: ${hol.nameEn} / ${hol.nameZh} (Delivery Paused)`
                                          : undefined
                                      }
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                          : isOff
                                          ? 'bg-red-50 text-red-500 border-red-200 line-through cursor-not-allowed'
                                          : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 border-stone-200'
                                      }`}
                                    >
                                      {dayName} {isOff && (hol ? `(🇲🇾 ${language === 'en' ? hol.nameEn : hol.nameZh} Off)` : '(Off)')}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Note if workdays were hidden because they are beyond validity */}
                              {upcomingWorkdays.length > visibleWorkdays.length && (
                                <span className="text-[10px] text-stone-400 block pt-0.5 italic">
                                  {language === 'en'
                                    ? `* Dates after your package validity cutoff (${effectiveExpiryDate}) are hidden. Special cases can be adjusted via Admin Page.`
                                    : `* 超过配套有效期截止日（${effectiveExpiryDate}）的日期已自动隐藏。特殊情况可通过管理员后台调整。`}
                                </span>
                              )}
                            </div>

                            {/* Klang Valley Public Holiday & Validity Rule Notice */}
                            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950 leading-snug">
                              <span>
                                🇲🇾 <strong>{language === 'en' ? 'Package Validity & Holiday Policy:' : '配套有效期与公假顺延规则：'}</strong>{' '}
                                {language === 'en'
                                  ? 'Deliveries are scheduled Monday to Friday only. Gazetted Malaysia Klang Valley public holidays automatically extend your package validity date by +1 day so you never lose meal days.'
                                  : '仅限周一至周五工作日送餐。已自动同步马来西亚巴生谷官方公假（公假当天暂停送餐并自动顺延 +1 天工作日，绝不扣减餐期）。'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Daily Quota & Flexible Lunch/Dinner Info Card */}
                        <div
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isDailyQuotaReached
                              ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                              : alreadyBookedQtyOnSelectedDate > 0
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-xl ${
                                  isDailyQuotaReached ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200/80 text-emerald-800'
                                }`}
                              >
                                {isDailyQuotaReached ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-heading font-extrabold text-xs">
                                  {language === 'en' ? 'Daily Meal Redemption Quota' : '每日餐券兑换配额与限额'}
                                </h4>
                                <p className="text-[10px] text-stone-500">
                                  {language === 'en'
                                    ? `Plan Quota: ${baseDailyQuota} meal/day · Max Limit: ${maxDailyQuota} meals/day (Double Quota)`
                                    : `常规套餐配额: ${baseDailyQuota} 餐/日 · 每日上限: ${maxDailyQuota} 餐/日（双倍限额）`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                                isDailyQuotaReached
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                  : alreadyBookedQtyOnSelectedDate > 0
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}
                            >
                              {alreadyBookedQtyOnSelectedDate} / {maxDailyQuota} {language === 'en' ? 'Booked' : '已订'}
                            </span>
                          </div>

                          <p className="text-[11px] leading-relaxed">
                            {isDailyQuotaReached ? (
                              language === 'en'
                                ? `🔒 Daily limit reached! You have booked all ${maxDailyQuota} allowable meals for ${selectedDate} (${bookedLunchQty > 0 ? `${bookedLunchQty} Lunch` : ''}${bookedLunchQty > 0 && bookedDinnerQty > 0 ? ' + ' : ''}${bookedDinnerQty > 0 ? `${bookedDinnerQty} Dinner` : ''}). Additional orders for this date are locked to protect your package balance.`
                                : `🔒 当日配额已满！您在 ${selectedDate} 已安排了满额 ${maxDailyQuota} 份餐品（${bookedLunchQty > 0 ? `${bookedLunchQty}份午餐` : ''}${bookedLunchQty > 0 && bookedDinnerQty > 0 ? ' + ' : ''}${bookedDinnerQty > 0 ? `${bookedDinnerQty}份晚餐` : ''}）。为避免超额扣减，当日订餐已锁定。`
                            ) : alreadyBookedQtyOnSelectedDate > 0 ? (
                              language === 'en'
                                ? `✨ You currently have ${alreadyBookedQtyOnSelectedDate} meal(s) booked for ${selectedDate} (${bookedLunchQty > 0 ? `${bookedLunchQty} Lunch` : ''}${bookedLunchQty > 0 && bookedDinnerQty > 0 ? ' + ' : ''}${bookedDinnerQty > 0 ? `${bookedDinnerQty} Dinner` : ''}). You can still redeem up to ${remainingAllowedQtyOnSelectedDate} more meal(s) today (flexible combinations allowed: 1 Lunch + 1 Dinner, 2 Lunch, or 2 Dinner).`
                                : `✨ 您在 ${selectedDate} 已预订 ${alreadyBookedQtyOnSelectedDate} 份（${bookedLunchQty > 0 ? `${bookedLunchQty}份午餐` : ''}${bookedLunchQty > 0 && bookedDinnerQty > 0 ? ' + ' : ''}${bookedDinnerQty > 0 ? `${bookedDinnerQty}份晚餐` : ''}）。今日仍可加订最多 ${remainingAllowedQtyOnSelectedDate} 份（支持灵活组合：1份午餐+1份晚餐，或2午餐/2晚餐）。`
                            ) : (
                              language === 'en'
                                ? `💡 Flexible Scheduling: You can redeem up to ${maxDailyQuota} meals on ${selectedDate} (double your package quota). Feel free to arrange 1 Lunch + 1 Dinner or multiple meals in the same delivery slot.`
                                : `💡 灵活排餐规则：${selectedDate} 当日最高可兑换 ${maxDailyQuota} 份餐品（套餐双倍限额）。您可自由组合：1份午餐+1份晚餐，或同一时段选择 ${maxDailyQuota} 份。`
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{language === 'en' ? 'Delivery Window *' : '配送时段 *'}</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSlot('Lunch (10:00 AM – 2:00 PM)')}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                                selectedSlot.includes('Lunch')
                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/30'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              🍱 {language === 'en' ? 'Lunch (10:00 AM – 2:00 PM)' : '午餐 (10:00 AM – 2:00 PM)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot('Dinner (3:00 PM – 7:00 PM)')}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                                selectedSlot.includes('Dinner')
                                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-600/30'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              🍲 {language === 'en' ? 'Dinner (3:00 PM – 7:00 PM)' : '晚餐 (3:00 PM – 7:00 PM)'}
                            </button>
                          </div>
                        </div>

                        {/* Meal Quantity selector */}
                        <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">
                              {language === 'en' ? 'Portion Quantity:' : '当日送餐份数:'}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {isDailyQuotaReached
                                ? language === 'en'
                                  ? `🔒 Daily limit reached (${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota} meals). Selection locked.`
                                  : `🔒 已达当日上限（${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota}份）。份数已锁定。`
                                : language === 'en'
                                ? `Can add up to ${remainingAllowedQtyOnSelectedDate} more meal(s) today (Max ${maxDailyQuota}/day)`
                                : `今日还可订 ${remainingAllowedQtyOnSelectedDate} 份（每日最高限额 ${maxDailyQuota} 份）`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isDailyQuotaReached || mealQuantity <= 1}
                              onClick={() => setMealQuantity((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-stone-900">
                              {isDailyQuotaReached ? 0 : mealQuantity}
                            </span>
                            <button
                              type="button"
                              disabled={
                                isDailyQuotaReached ||
                                mealQuantity >= remainingAllowedQtyOnSelectedDate ||
                                mealQuantity >= (currentMember.activePackage?.remainingMeals || 0)
                              }
                              onClick={() =>
                                setMealQuantity((q) =>
                                  Math.min(
                                    remainingAllowedQtyOnSelectedDate,
                                    currentMember.activePackage?.remainingMeals || 6,
                                    q + 1
                                  )
                                )
                              }
                              className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Standard Recipe Notice for Meal Plan Customers */}
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                              <span>{language === 'en' ? 'Standard Recipe Guarantee' : '标准主厨营养配方出品'}</span>
                            </div>
                            <span className="text-[10px] bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full font-extrabold uppercase">
                              {language === 'en' ? 'Standard Portion' : '标准配方'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-snug">
                            {language === 'en'
                              ? 'Meal plan bentos are prepared according to certified chef standard nutritional proportions. Customization options (cauliflower rice swaps, extra meat) are reserved exclusively for Ala Carte customers.'
                              : '月度/周期套餐顾客严格按主厨标准科学营养比例出餐（均衡碳水、优质蛋白与蔬菜）。换花椰菜米、加肉等定制选项仅对单点顾客开放。'}
                          </p>
                        </div>

                        {/* Dietary / Special Kitchen Request */}
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            {language === 'en' ? 'Kitchen Preparation Notes (Allergies / Dressing)' : '厨房备餐要求 (酱汁分开 / 少葱蒜 / 忌口)'}
                          </label>
                          <input
                            type="text"
                            value={dietaryNotes}
                            onChange={(e) => setDietaryNotes(e.target.value)}
                            placeholder="e.g. Sauce on the side, no cucumber, gentle cooking..."
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Selected Meal Summary Box */}
                      {selectedMealObj && (
                        <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                            {language === 'en' ? 'Selected Bento Box:' : '当前选中便当：'}
                          </span>
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedMealObj.image}
                              alt={selectedMealObj.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-heading font-bold text-xs sm:text-sm text-stone-900 truncate">
                                {language === 'en' ? selectedMealObj.name : selectedMealObj.nameZh}
                              </h5>
                              <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                                <span className="text-emerald-700 font-bold">{selectedMealObj.calories} kcal</span>
                                <span>·</span>
                                <span className="text-amber-700 font-bold">{selectedMealObj.protein}g protein</span>
                              </div>
                            </div>

                            {/* Inline Double-Booking Notice for Selected Date */}
                            {(() => {
                              const existingBooking = allRedemptions.find(
                                (r) => r.memberId === currentMember?.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled'
                              );
                              if (!existingBooking) return null;
                              return (
                                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5 mt-2 shadow-2xs">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">
                                      {language === 'en'
                                        ? `Notice: You already have a meal booked for ${selectedDate}!`
                                        : `温馨提示：您在 ${selectedDate} 已经有一笔午餐预定！`}
                                    </span>
                                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                      {language === 'en'
                                        ? `Scheduled dish: "${existingBooking.mealName}" (${existingBooking.quantity || 1} box). To avoid accidental double booking, please verify before confirming.`
                                        : `已排餐品：“${existingBooking.mealNameZh || existingBooking.mealName}”（${existingBooking.quantity || 1}份）。为免重复订餐，请核对是否确需加订。`}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                            <span>
                              {language === 'en' ? 'Package Cost:' : '套餐费用:'}{' '}
                              <strong>RM 0.00 (Included)</strong>
                            </span>
                            <span>
                              {language === 'en' ? 'Credits after:' : '兑换后剩余:'}{' '}
                              <strong>
                                {Math.max(0, (currentMember.activePackage?.remainingMeals || 0) - mealQuantity)}{' '}
                                meals
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Submit Redemption Button or 0-Meal Action Guidance */}
                      {(!currentMember.activePackage || currentMember.activePackage.remainingMeals <= 0) ? (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                          <div className="flex items-start gap-2.5 text-xs text-amber-950">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900">
                                {language === 'en'
                                  ? 'You currently have 0 meal credits.'
                                  : '您当前暂无可用餐额（0餐）。'}
                              </p>
                              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                {language === 'en'
                                  ? 'Upgrade to a CHILL Meal Plan for maximum savings (from RM19.90/meal with 100% Free Delivery), or order fresh Ala Carte bentos directly!'
                                  : '强烈建议您选购周期餐包享天天免运费与低至RM19.90/餐超值优惠；您也可以随时直接单点今日轻食！'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setPortalTab('renew')}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 hover:from-amber-400 hover:to-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-200" />
                              <span>{language === 'en' ? '👑 Upgrade to Meal Plan' : '👑 选购健康餐配套'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={onOpenMenu || onClose}
                              className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-emerald-600/40 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{language === 'en' ? '🍱 Order Ala Carte (QR/WhatsApp)' : '🍱 单点今日餐品 (QR/WhatsApp付款)'}</span>
                            </button>
                          </div>
                        </div>
                      ) : isDailyQuotaReached ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-3.5 rounded-xl bg-stone-200 text-stone-500 border border-stone-300 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-stone-400" />
                          <span>
                            {language === 'en'
                              ? `🔒 Daily Limit Reached (${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota} Meals) for ${selectedDate}`
                              : `🔒 当日配额已满已锁定（${selectedDate} 已安排 ${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota} 份）`}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRedemptionSubmit}
                          className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {(() => {
                              const existingBooking = allRedemptions.find(
                                (r) => r.memberId === currentMember?.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled'
                              );
                              if (existingBooking) {
                                return language === 'en'
                                  ? `Add Additional Bento for ${selectedDate} (${mealQuantity} box · Total ${alreadyBookedQtyOnSelectedDate + mealQuantity}/${maxDailyQuota})`
                                  : `加订额外餐品 (送达: ${selectedDate} · ${mealQuantity}份 · 当日累计 ${alreadyBookedQtyOnSelectedDate + mealQuantity}/${maxDailyQuota}份)`;
                              }
                              return language === 'en'
                                ? `Confirm & Book ${mealQuantity} Bento for ${selectedDate}`
                                : `确认兑换 ${mealQuantity} 份餐品 (送达: ${selectedDate})`;
                            })()}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: 26 Signature Bento Gallery (7-8 cols on desktop) */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-emerald-700" />
                            <span>{language === 'en' ? 'Choose Your Healthy Bento Box' : '选择您的健康便当 (全场26款任选)'}</span>
                          </h4>
                          <span className="text-[11px] text-stone-500">
                            {filteredMenuItems.length} {language === 'en' ? 'bentos match your search' : '道餐盒可供选择'}
                          </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={mealSearchQuery}
                            onChange={(e) => setMealSearchQuery(e.target.value)}
                            placeholder={language === 'en' ? 'Search dishes or ingredients...' : '搜索菜名或食材...'}
                            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Category Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {[
                          { id: 'all', en: 'All Bentos (26)', zh: '全部便当 (26)' },
                          { id: 'high-protein', en: 'High Protein (35g+)', zh: '高蛋白 (35g+)' },
                          { id: 'under-500', en: 'Low Calorie (<500 kcal)', zh: '极低卡 (<500卡)' },
                          { id: 'chicken', en: 'Chicken Bento', zh: '嫩鸡便当' },
                          { id: 'salmon', en: 'Salmon & Fish', zh: '三文鱼/海鲜' },
                          { id: 'beef-pork', en: 'Beef & Pork', zh: '牛肉/轻食猪肉' },
                          { id: 'vegetarian', en: 'Vegetarian', zh: '素食养生' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedMealCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              selectedMealCategory === cat.id
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {language === 'en' ? cat.en : cat.zh}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Responsive Dish Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredMenuItems.map((meal) => {
                        const isSelected = selectedMealId === meal.id;
                        return (
                          <div
                            key={meal.id}
                            onClick={() => setSelectedMealId(meal.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between bg-white relative group ${
                              isSelected
                                ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md bg-emerald-50/20'
                                : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                            }`}
                          >
                            {/* Photo and Header */}
                            <div>
                              <div className="relative aspect-video rounded-xl overflow-hidden mb-2.5 bg-stone-100">
                                <img
                                  src={meal.image}
                                  alt={meal.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {isSelected && (
                                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                                    <Check className="w-3 h-3" />
                                    <span>SELECTED</span>
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                                  {meal.calories} kcal · {meal.protein}g protein
                                </div>
                              </div>

                              <h5 className="font-heading font-bold text-xs sm:text-sm text-stone-900 group-hover:text-emerald-800 transition-colors">
                                {language === 'en' ? meal.name : meal.nameZh}
                              </h5>
                              <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                {language === 'en' ? meal.subtitle || meal.description : meal.subtitleZh || meal.descriptionZh}
                              </p>
                            </div>

                            {/* Card Footer: RM0 benefit and select button */}
                            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title={language === 'en' ? 'Standard Chef Recipe (RM 0)' : '标准主厨配方 (RM 0)'}>
                                {language === 'en' ? 'Standard (RM 0)' : '标准配方 (RM 0)'}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white font-extrabold'
                                    : 'bg-stone-100 text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-800'
                                }`}
                              >
                                {isSelected ? (language === 'en' ? 'Chosen' : '已选') : (language === 'en' ? 'Select' : '选择此餐')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MOBILE STICKY FLOATING CONFIRMATION BAR */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl z-40 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      {selectedDate} · {isDailyQuotaReached ? 0 : mealQuantity} Meal
                    </span>
                    <p className="font-heading font-extrabold text-xs text-stone-900 truncate">
                      {isDailyQuotaReached
                        ? language === 'en'
                          ? `Daily Limit Reached (${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota})`
                          : `已达当日上限 (${alreadyBookedQtyOnSelectedDate}/${maxDailyQuota}份)`
                        : selectedMealObj
                        ? language === 'en'
                          ? selectedMealObj.name
                          : selectedMealObj.nameZh
                        : 'Select Dish'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedemptionSubmit}
                    disabled={
                      !currentMember.activePackage ||
                      currentMember.activePackage.remainingMeals <= 0 ||
                      isDailyQuotaReached
                    }
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    {isDailyQuotaReached ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>
                      {isDailyQuotaReached
                        ? language === 'en'
                          ? 'Locked'
                          : '已锁定'
                        : language === 'en'
                        ? 'Confirm Redeem'
                        : '立即确认兑换'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

            {/* Tab 2: ADVANCE MULTI-DAY MEAL PLANNER (整周一次性排餐) */}
            {portalTab === 'planner' && (
              <div className="space-y-4">
                {currentMember?.activePackage && currentMember.activePackage.adminConfirmed === false ? (
                  <div className="p-6 bg-white rounded-3xl border-2 border-amber-400 text-center space-y-3 max-w-lg mx-auto">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
                    <h4 className="font-heading font-black text-stone-900 text-base">
                      {language === 'en' ? 'Package Subscription Pending Admin Confirmation' : '配套订购正等待后台管理员确认开通'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {language === 'en'
                        ? 'Advance multi-day planner will unlock immediately once your package subscription is confirmed by admin in the back office.'
                        : '待管理员在后台确认开通您的配套后，将即刻开启整周提前排餐功能！'}
                    </p>
                  </div>
                ) : isExpired && !isSpecialCase ? (
                  <div className="p-5 rounded-3xl bg-red-50 border border-red-300 text-red-950 space-y-3">
                    <div className="flex items-center gap-2 font-black text-sm text-red-800">
                      <Lock className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        {language === 'en'
                          ? 'Package Validity Ended · Advance Planner Locked'
                          : '配套有效期已届满 · 提前排餐功能已锁定关闭'}
                      </span>
                    </div>
                    <p className="text-xs text-red-900 leading-relaxed">
                      {language === 'en'
                        ? `Your meal package validity officially ended on ${effectiveExpiryDate}. Under policy, customer date selection is disabled after package expiry.`
                        : `您的配套有效日期已于 ${effectiveExpiryDate} 正式到期。根据系统规则，配套到期后将关闭订餐选日权限。`}
                    </p>
                    <div className="p-3 rounded-2xl bg-white border border-red-200 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span>
                        {language === 'en'
                          ? 'Need a validity extension for a special case (e.g. medical leave or emergency)?'
                          : '如因特殊情况（如病假就医或突发出差）需特批顺延？'}
                      </span>
                      <a
                        href={buildWhatsAppUrl(
                          siteSettings.whatsappNumber,
                          `Hi Admin, my meal package (${activePkg?.planName}) validity ended on ${effectiveExpiryDate}. Requesting special case validity adjustment / extension for advance booking (${currentMember.name}, ${currentMember.phone}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Request Admin Special Case Adjustment' : '联系管理员特批调整'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <h4 className="font-heading text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wider">
                          {language === 'en' ? 'Advance Workday Meal Planner' : '一次性选择好所有餐点 (提前排餐)'}
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {language === 'en'
                            ? `Schedule your upcoming workdays (Mon – Fri 10:00 AM – 2:00 PM) in 1 click.${effectiveExpiryDate ? ` (Valid until: ${effectiveExpiryDate})` : ''}`
                            : `一次性安排好未来工作日的午餐便当，免除每天重复选餐的繁琐。${effectiveExpiryDate ? `（有效截止日期：${effectiveExpiryDate}）` : ''}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRandomizeBatch}
                        className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Auto-Balance Menu' : '一键营养均衡搭配'}</span>
                      </button>
                    </div>

                    {/* Workdays Grid (Filtered to dates strictly within validity) */}
                    {visibleWorkdays.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
                        <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-stone-700">
                          {language === 'en'
                            ? `No upcoming workdays available before your package validity cutoff (${effectiveExpiryDate}).`
                            : `在您的配套有效期截止日（${effectiveExpiryDate}）之前没有可供排期的工作日。`}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          {language === 'en'
                            ? 'Dates after validity end are restricted. Special cases can be adjusted by Admin.'
                            : '到期后的选日已被限制。特殊情况可通过管理员在后台调整。'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          {visibleWorkdays.map((dateStr, index) => {
                            const selectedDishId = batchSchedule[dateStr] || menuItems[0]?.id;
                            const dish = menuItems.find((m) => m.id === selectedDishId) || menuItems[0];
                            const dateObj = new Date(dateStr);
                            const dayName = dateObj.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            });

                            return (
                              <div
                                key={dateStr}
                                className="p-3.5 bg-white rounded-2xl border border-stone-200 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-2xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">
                                      D{index + 1}
                                    </span>
                                    <span className="text-[11px] text-stone-500 font-semibold">{dayName}</span>
                                  </div>

                                  <div className="aspect-video rounded-xl overflow-hidden mb-2 bg-stone-100">
                                    <img
                                      src={dish.image}
                                      alt={dish.name}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                      }}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <select
                                    value={selectedDishId}
                                    onChange={(e) =>
                                      setBatchSchedule({ ...batchSchedule, [dateStr]: e.target.value })
                                    }
                                    className="w-full text-xs px-2 py-2 rounded-xl border border-stone-200 bg-white"
                                  >
                                    {menuItems.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {language === 'en' ? m.name : m.nameZh} ({m.calories} kcal)
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="text-[10px] text-stone-500 mt-2 text-center">
                                  {dish.calories} kcal · {dish.protein}g protein
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <span>
                            {language === 'en' ? 'Deliver to:' : '送餐地址:'}{' '}
                            <strong className="text-stone-900">{currentAddress}, {currentArea}</strong>
                          </span>
                          <span className="text-emerald-800 font-bold">
                            Total: {visibleWorkdays.length} meals (deducted from remaining package)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleBatchSubmit}
                          disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals < visibleWorkdays.length}
                          className="w-full py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {language === 'en'
                              ? `Confirm All ${visibleWorkdays.length} Days Schedule`
                              : `一键确认未来 ${visibleWorkdays.length} 天全部排餐`}
                          </span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab 3: DELIVERY LOGS & STATUS TRACKING & REFUND AUDIT */}
            {portalTab === 'history' && (
              <div className="space-y-4">
                {/* Sub-tabs for Deliveries vs Refund Audit */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistorySubTab('deliveries')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        historySubTab === 'deliveries'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Meal Deliveries' : '餐品配送记录'}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        historySubTab === 'deliveries' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {memberRedemptions.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistorySubTab('refunds')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        historySubTab === 'refunds'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Quota Refund & Balance Logs' : '退款返还与餐券明细'}</span>
                      {currentMember?.creditsHistory?.some((c) => c.type === 'refund') && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                          {currentMember.creditsHistory.filter((c) => c.type === 'refund').length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistorySubTab('receipts')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        historySubTab === 'receipts'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Official Receipts' : '官方付款收据'}</span>
                      {currentMember?.officialReceipts && currentMember.officialReceipts.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                          historySubTab === 'receipts' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentMember.officialReceipts.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {currentMember?.activePackage && (
                    <div className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shrink-0">
                      <span>{language === 'en' ? 'Active Balance:' : '当前可用餐券:'}</span>
                      <strong className="text-emerald-700 font-extrabold text-sm">{currentMember.activePackage.remainingMeals}</strong>
                      <span>{language === 'en' ? 'meals' : '餐'}</span>
                    </div>
                  )}
                </div>

                {/* Sub-view 1: Meal Deliveries */}
                {historySubTab === 'deliveries' && (
                  <div>
                    {memberRedemptions.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                        {language === 'en'
                          ? 'No meal redemptions yet. Click "Daily Next-Day Meal" to schedule your lunch!'
                          : '暂无订餐记录。请点击“每天选择隔天餐点”开始您的健康轻食之旅！'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {memberRedemptions.map((r) => (
                          <div
                            key={r.id}
                            className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-3 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={r.mealImage}
                                  alt={r.mealName}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-2xs"
                                />
                                <div>
                                  <h5 className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                                    {language === 'en' ? r.mealName : r.mealNameZh}
                                    {r.quantity && r.quantity > 1 ? ` x${r.quantity}` : ''}
                                  </h5>
                                  <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-emerald-700" />
                                      <span>{r.deliveryDate}</span>
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-emerald-700" />
                                      <span>10:00 AM – 2:00 PM</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    r.status === 'Delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.status === 'Out for Delivery'
                                      ? 'bg-sky-100 text-sky-800 animate-pulse'
                                      : r.status === 'Prepping in Kitchen'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {r.status === 'Pending' && (language === 'en' ? 'Pending' : '待制作')}
                                  {r.status === 'Prepping in Kitchen' && (language === 'en' ? 'In Kitchen' : '厨房制作中')}
                                  {r.status === 'Out for Delivery' && (language === 'en' ? 'Out for Delivery' : '骑手配送中')}
                                  {r.status === 'Delivered' && (language === 'en' ? 'Delivered' : '已送达')}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                                  {r.recipeStandard || 'Standard Chef Recipe'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
                              <span className="truncate max-w-xs">
                                📍 {r.deliveryAddress}, {r.area}
                              </span>
                              <a
                                href={`https://wa.me/${whatsappLinkNumber}?text=Hi%20CHILL%20Healthy,%20I%20want%20to%20check%20or%20pause%20my%20delivery%20${r.id}%20for%20${r.deliveryDate}.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{language === 'en' ? 'Modify on WhatsApp' : '更改送餐/暂停 (WhatsApp)'}</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view 2: Quota Refund & Balance Records Audit Log */}
                {historySubTab === 'refunds' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {language === 'en' ? 'Meal Balance & Refund Guarantee Record' : '餐券明细与自动返还记录'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {language === 'en'
                            ? 'Whenever an order is deleted or cancelled, meals are automatically refunded back to your balance.'
                            : '当订单被取消或删除时，餐券将自动全额返还至您的账户余额，全程系统存证。'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-500 uppercase font-bold block">
                          {language === 'en' ? 'Current Balance' : '实时剩余餐数'}
                        </span>
                        <span className="text-base font-extrabold text-emerald-700">
                          {currentMember?.activePackage?.remainingMeals || 0} {language === 'en' ? 'meals' : '餐'}
                        </span>
                      </div>
                    </div>

                    {!currentMember?.creditsHistory || currentMember.creditsHistory.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                        {language === 'en' ? 'No balance adjustments or refund logs yet.' : '暂无餐券变动或退款记录。'}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {currentMember.creditsHistory.map((item) => {
                          const isRefund = item.type === 'refund';
                          const isRedeem = item.type === 'redeem';
                          const isPurchase = item.type === 'purchase';

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                isRefund
                                  ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isRefund
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : isRedeem
                                      ? 'bg-stone-100 text-stone-700'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isRefund ? (
                                    <RotateCcw className="w-4 h-4" />
                                  ) : isRedeem ? (
                                    <Utensils className="w-4 h-4" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-bold ${
                                        isRefund
                                          ? 'text-emerald-950 font-extrabold'
                                          : 'text-stone-900'
                                      }`}
                                    >
                                      {isRefund
                                        ? language === 'en'
                                          ? 'Meal Quota Restored / Refunded'
                                          : '已退单并返还餐券配额'
                                        : isRedeem
                                        ? language === 'en'
                                          ? 'Meal Redeemed'
                                          : '兑换餐品'
                                        : language === 'en'
                                        ? 'Package Subscribed'
                                        : '套餐充值'}
                                    </span>
                                    {isRefund && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                                        {language === 'en' ? 'Auto-Restored' : '已自动返还'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                                    {item.note}
                                  </p>
                                  <span className="text-[10px] text-stone-400 block mt-0.5">
                                    {item.date}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`text-sm font-black ${
                                    isRefund || isPurchase
                                      ? 'text-emerald-700'
                                      : 'text-stone-700'
                                  }`}
                                >
                                  {item.amount > 0 ? `+${item.amount}` : item.amount}{' '}
                                  <span className="text-[11px] font-semibold">
                                    {language === 'en' ? 'meals' : '餐'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view 3: Official Receipts */}
                {historySubTab === 'receipts' && (
                  <div>
                    {!currentMember?.officialReceipts || currentMember.officialReceipts.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs space-y-2">
                        <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                        <p>
                          {language === 'en'
                            ? 'No official payment receipts issued yet. Receipts will appear here once verified by kitchen administration.'
                            : '暂无已开具的官方正式付款收据。后台确认付款后将在此展示。'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentMember.officialReceipts.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                                  {rec.paymentConfirmed ? (language === 'en' ? 'PAID' : '已付款') : (language === 'en' ? 'PENDING' : '待确认')}
                                </span>
                                <span className="font-mono text-xs font-bold text-stone-900">
                                  #{rec.receiptNumber}
                                </span>
                                <span className="text-[11px] text-stone-400">· {rec.issuedAt}</span>
                              </div>
                              <h5 className="font-heading font-bold text-sm text-stone-900">
                                {rec.planName}
                              </h5>
                              <p className="text-xs text-stone-500">
                                {language === 'en' ? 'Payment Method:' : '支付方式:'} {rec.paymentMethod}
                                {rec.paymentReference && ` (${rec.paymentReference})`}
                              </p>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                              <div className="font-heading font-extrabold text-base text-emerald-800">
                                RM {rec.totalAmount.toFixed(2)}
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptForPreview(rec)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{language === 'en' ? 'View / Print Receipt' : '查看 / 打印收据'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3.5: REFERRAL REWARDS PROGRAM */}
            {portalTab === 'referral' && (
              <div className="space-y-5">
                {/* Hero Referral Banner */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-300/80 shadow-xs relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        <span>{language === 'en' ? 'Exclusive Member Referral Benefit' : '会员专属推荐特权'}</span>
                      </div>
                      <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-stone-900">
                        {language === 'en'
                          ? 'Get 1 Free Meal Credit for Every New Friend Referral (RM398+ Plan)!'
                          : '好友首次开户订购 RM398 及以上配套，立送您 1 份免费餐券！'}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        {language === 'en'
                          ? `Invite colleagues and friends to eat clean and live healthy. Whenever a friend signs up for a new account and purchases any meal plan of RM${MIN_REFERRAL_PLAN_PRICE} and above (e.g. 20-Day Lifestyle Plan or Multi-Person Plans) using your Referral Code, 1 Free Meal Credit is automatically credited to your active package!`
                          : `邀请同事与好友一起健康享用营养低卡轻食。每当好友注册新账户并使用您的专属推荐码购买 RM${MIN_REFERRAL_PLAN_PRICE} 及以上餐点配套（如热销的20天月度计划或双人/多人套餐），您的账户将自动入账 1 份免费餐券（永久累计、自动抵扣）。`}
                      </p>
                    </div>

                    {/* Quick Stats in Hero */}
                    <div className="grid grid-cols-2 gap-3 shrink-0 w-full sm:w-auto">
                      <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs text-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          {language === 'en' ? 'Friends Referred' : '成功推荐人数'}
                        </span>
                        <span className="font-heading text-2xl font-black text-amber-700 mt-0.5 block">
                          {currentMember.referralsCount || 0}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {language === 'en' ? 'friends joined' : '位好友已加入'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs text-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          {language === 'en' ? 'Free Meals Earned' : '已赚取免费餐券'}
                        </span>
                        <span className="font-heading text-2xl font-black text-emerald-700 mt-0.5 block">
                          +{currentMember.referralBonusMealsEarned || 0}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {language === 'en' ? 'free meal credits' : '份免单奖励'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral Code & Direct Share Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Your Exclusive Code */}
                  <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          {language === 'en' ? 'Your Exclusive Referral Code' : '您的专属邀请码'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {language === 'en' ? 'Unique ID' : '终身有效'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {language === 'en'
                          ? 'Share this code with friends to enter at checkout cart.'
                          : '好友在结账付款页面输入此推荐码即可为您绑定奖励。'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-dashed border-amber-300 flex items-center justify-between gap-3">
                      <span className="font-mono text-base sm:text-lg font-black tracking-wider text-amber-900 select-all">
                        {getMemberReferralCode(currentMember)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getMemberReferralCode(currentMember));
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? (language === 'en' ? 'Copied!' : '已复制') : (language === 'en' ? 'Copy Code' : '复制推荐码')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Instant WhatsApp Share Link */}
                  <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          {language === 'en' ? 'One-Click WhatsApp Share' : '一键 WhatsApp 好友分享'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {language === 'en' ? 'Fastest' : '一键直达'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {language === 'en'
                          ? 'Send an inviting message with your link straight to friends or work chat groups.'
                          : '自动生成精美邀请文案与专属订餐链接，直接发送给好友或公司微信/WhatsApp群。'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={`https://wa.me/?text=${buildReferralWhatsAppMessage(currentMember.name, getMemberReferralCode(currentMember), language)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{language === 'en' ? 'Share via WhatsApp' : '立即通过 WhatsApp 分享'}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const url = buildReferralShareUrl(getMemberReferralCode(currentMember));
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="py-2.5 px-3.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-500" />}
                        <span>{copiedLink ? (language === 'en' ? 'Link Copied!' : '链接已复制') : (language === 'en' ? 'Copy Link' : '复制订餐链接')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* How It Works (3 Steps) */}
                <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{language === 'en' ? 'How the Referral Reward Works' : '好友推荐奖励规则说明'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center mb-1.5">
                        1
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        {language === 'en' ? 'Share Your Code' : '分享您的专属推荐码'}
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {language === 'en'
                          ? 'Send your code or link to friends, colleagues, or fitness buddies.'
                          : '将您的推荐码或专属链接分享给同事、家人或运动伙伴。'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-1.5">
                        2
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        {language === 'en' ? 'New Account Signs Up (RM398+ Plan)' : '好友新开户订购 RM398+ 配套'}
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {language === 'en'
                          ? `Friend signs up for a new account with a plan of RM${MIN_REFERRAL_PLAN_PRICE}+ (e.g. 20-Day Plan RM398) & enters your code.`
                          : `好友首次注册新账户并选购 RM${MIN_REFERRAL_PLAN_PRICE} 及以上配套（如20天轻体餐 RM398），结账输入您的推荐码。`}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center mb-1.5">
                        3
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        {language === 'en' ? 'Get +1 Free Meal' : '您立得 +1 份免费餐券'}
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {language === 'en'
                          ? 'Once their order is confirmed, 1 Free Meal Credit is added to your account instantly.'
                          : '好友订单一经确认，您的账户即时获赠 1 份免费餐券，可随时选餐！'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Bonus Credits History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-extrabold text-sm text-stone-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'en' ? 'Your Referral Rewards History' : '推荐奖励入账明细'}</span>
                    </h4>
                    <span className="text-xs text-stone-500">
                      {language === 'en' ? 'Total Bonus Meals:' : '累计奖励餐券:'}{' '}
                      <strong className="text-emerald-700">+{currentMember.referralBonusMealsEarned || 0}</strong>
                    </span>
                  </div>

                  {(() => {
                    const bonusItems = (currentMember.creditsHistory || []).filter(
                      (c) => c.type === 'bonus' || (c.note && c.note.toLowerCase().includes('referral'))
                    );

                    if (bonusItems.length === 0) {
                      return (
                        <div className="text-center py-8 bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                          {language === 'en'
                            ? 'No referral rewards claimed yet. Share your code above to start earning free meals!'
                            : '暂无推荐奖励记录。快将上方推荐码分享给好友，开启免费餐券奖励吧！'}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {bonusItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                🎁
                              </div>
                              <div>
                                <p className="text-xs font-bold text-stone-900">{item.note}</p>
                                <span className="text-[10px] text-stone-500">{item.date}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                +{item.amount} {language === 'en' ? 'Free Meal' : '免费餐'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tab 4: PACKAGES & RENEWAL */}
            {portalTab === 'renew' && (
              <div className="space-y-4">
                <div className="text-center max-w-md mx-auto">
                  <h4 className="font-heading font-extrabold text-base sm:text-lg text-stone-900">
                    {language === 'en' ? 'Official CHILL Healthy Meal Plans' : '潮轻食官方健康餐配套'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'en'
                      ? 'Select any 1 to 6 person package below to renew your meal credits.'
                      : '选择适合您的 1 至 6 人配套，充值餐券轻松享受每日健康送餐。'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-5 rounded-3xl border border-stone-200 bg-white hover:border-emerald-600 transition-all flex flex-col justify-between gap-4 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-heading font-bold text-base text-stone-900">
                            {language === 'en' ? pkg.title : pkg.titleZh}
                          </h5>
                          {pkg.popular && (
                            <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                              {language === 'en' ? 'POPULAR' : '热销首选'}
                            </span>
                          )}
                        </div>
                        {(() => {
                          const vDays = pkg.validityDays || getPlanValidityDays(pkg);
                          const valDetails = getDetailedPackageValidity(getTodayStr(), pkg, siteSettings?.disabledDeliveryDates || []);
                          return (
                            <div>
                              <p className="text-xs text-stone-600 font-medium">
                                {pkg.mealsTotal} {language === 'en' ? 'Meals' : '餐'} · {vDays} {language === 'en' ? 'Days Validity (Mon–Fri)' : '天工作日有效期'} · RM {pkg.pricePerMeal.toFixed(2)}/{language === 'en' ? 'meal' : '餐'}
                              </p>
                              <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] space-y-0.5">
                                <div className="font-extrabold text-emerald-900 flex items-center justify-between">
                                  <span>{language === 'en' ? 'Estimated Validity Date:' : '预估有效截止日期：'}</span>
                                  <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-black">
                                    {valDetails.expiryDate}
                                  </span>
                                </div>
                                <div className="text-[10px] text-stone-600">
                                  {language === 'en'
                                    ? `• ${vDays} Mon–Fri weekdays (${vDays === 30 ? '20 Meals' : vDays === 15 ? '10 Meals' : '5 Meals'} standard)`
                                    : `• ${vDays}个工作日（${vDays === 30 ? '20餐' : vDays === 15 ? '10餐' : '5餐'}标准）`}
                                </div>
                                <div className="text-[10px] text-emerald-800 font-semibold">
                                  {language === 'en'
                                    ? '• Klang Valley public holidays automatically extend validity +1 day'
                                    : '• 自动同步巴生谷官方公假，遇公假顺延 +1 天工作日'}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="text-[11px] text-emerald-700 font-semibold mt-2 space-y-0.5">
                          <div>✓ {language === 'en' ? 'Free daily lunch delivery' : '巴生谷每日免费送餐'}</div>
                          <div>✓ {language === 'en' ? '1 account 2 addresses' : '1户口支持双地址切换'}</div>
                          <div>✓ {language === 'en' ? '26 signature bentos included' : '26道招牌轻食任选'}</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <div className="font-heading font-extrabold text-xl text-emerald-800">
                            RM {pkg.totalPrice.toFixed(2)}
                          </div>
                          {pkg.originalPrice && pkg.originalPrice > 0 ? (
                            <span className="text-[10px] text-stone-400 line-through">
                              RM {pkg.originalPrice.toFixed(2)}
                            </span>
                          ) : null}
                        </div>

                        <button
                          onClick={() => {
                            onSelectPackageToBuy(pkg);
                            onClose();
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          {language === 'en' ? 'Order Plan' : '立即选购'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          POPUP NOTIFICATION 1: DAILY MEAL CONFIRMATION & DOUBLE-BOOKING AWARENESS
          ========================================================================= */}
      {/* =========================================================================
          POPUP NOTIFICATION 1: DAILY MEAL REDEMPTION CONFIRMED NOTIFICATION MODAL
          ========================================================================= */}
      {redemptionSuccessPopup && redemptionSuccessPopup.isOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRedemptionSuccessPopup(null);
          }}
        >
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 animate-in zoom-in-95 flex flex-col max-h-[90vh] sm:max-h-[88vh] my-auto overflow-hidden">
            {/* Top Emerald Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 sm:px-6 sm:py-4.5 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-white/20 text-white border border-white/30 shrink-0">
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-200" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-700/80 text-emerald-200 px-2.5 py-0.5 rounded-md">
                        {language === 'en' ? 'RESERVATION CONFIRMED' : '订餐排期已确认'}
                      </span>
                      {redemptionSuccessPopup.orderNumber && (
                        <span className="text-[11px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-md border border-white/30">
                          #{redemptionSuccessPopup.orderNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-white mt-0.5 leading-tight truncate">
                      {language === 'en' ? 'Daily Meal Successfully Booked!' : '每日健康餐预定成功！'}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRedemptionSuccessPopup(null)}
                  className="p-1.5 sm:p-2 rounded-full bg-white/15 hover:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
              {/* Unique Order Number Banner with Copy */}
              {redemptionSuccessPopup.orderNumber && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                      {language === 'en' ? 'Unique Order Tracking No.' : '专属订餐编号'}
                    </span>
                    <p className="font-mono font-black text-lg sm:text-xl text-emerald-950 mt-0.5 select-all">
                      #{redemptionSuccessPopup.orderNumber}
                    </p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      {language === 'en'
                        ? 'Recorded in kitchen back-office for easy tracking reference.'
                        : '已同步录入后厨管理后台，双方凭此唯一编号高效对账。'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && redemptionSuccessPopup.orderNumber) {
                        navigator.clipboard.writeText(redemptionSuccessPopup.orderNumber);
                        setCopiedOrderNo(true);
                        setTimeout(() => setCopiedOrderNo(false), 2500);
                      }
                    }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
                    title="Copy Order Number"
                  >
                    {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOrderNo ? (language === 'en' ? 'Copied!' : '已复制！') : (language === 'en' ? 'Copy No.' : '复制编号')}</span>
                  </button>
                </div>
              )}

              {/* Member Self-Service Notice: No need to WhatsApp to own phone, always viewable in portal */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'Order Saved to Member Account'
                        : '订单已安全存入您的会员中心'}
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'Self-Service Portal' : '随时自主查阅'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {language === 'en'
                    ? 'No need to send confirmation to your own WhatsApp — you can log in at any time to view all your scheduled and past deliveries under "Delivery Records".'
                    : '无需发送确认回执到个人 WhatsApp——您随时登录会员中心，进入【配送记录】即可实时查阅所有已排期餐点与最新备餐进度。'}
                </p>
              </div>

              {/* Optional: Send Notification to CHILL Healthy WhatsApp (Customer Choice - Never Forced) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'Optional: Notify CHILL Healthy WhatsApp'
                        : '可选：发送订餐凭据通知潮轻食客服'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full">
                    {siteSettings.whatsappDisplay || '+60126189919'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {language === 'en'
                    ? 'Our kitchen receives your order schedule automatically. If you wish to send an extra slip directly to CHILL Healthy WhatsApp (+60126189919), you can choose to click below (optional):'
                    : '后厨排单已自动记录。若您需要向潮轻食官方 WhatsApp (+60126189919) 额外发送一份订餐凭据作为客服备忘，可选择点击下方发送（非必填，自由选择）：'}
                </p>
                <div className="pt-0.5">
                  <a
                    href={buildWhatsAppUrl(
                      siteSettings.whatsappNumber,
                      redemptionSuccessPopup.whatsappMessage ||
                        `🍱 *CHILL Healthy 潮轻食 · 会员订餐凭据*\n*Member Booking Slip*\n━━━━━━━━━━━━━━━━━━━\n📋 订单号 / Order No: #${redemptionSuccessPopup.orderNumber}\n👤 会员姓名: ${currentMember?.name}\n📞 会员电话: ${currentMember?.phone}\n🥗 预订餐品: ${redemptionSuccessPopup.quantity}x ${redemptionSuccessPopup.mealName} (${redemptionSuccessPopup.mealNameZh})\n📅 送餐日期: ${redemptionSuccessPopup.formattedDate || redemptionSuccessPopup.deliveryDate}\n⏰ 送餐时段: ${redemptionSuccessPopup.deliverySlot}\n📍 配送地址: ${redemptionSuccessPopup.deliveryAddress}, ${redemptionSuccessPopup.area} ${redemptionSuccessPopup.postalCode}\n🎟️ 剩余餐券: ${redemptionSuccessPopup.remainingMealsAfter} 餐\n━━━━━━━━━━━━━━━━━━━`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>
                      {language === 'en'
                        ? `Send Slip to CHILL Healthy WhatsApp (Optional)`
                        : `发送凭据至潮轻食 WhatsApp（可选）`}
                    </span>
                  </a>
                </div>
              </div>

              {/* Double-Booking Prevention Awareness Box */}
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{language === 'en' ? 'Reminder: Avoid Double Booking' : '防重复订餐提示'}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {language === 'en' ? (
                    <>
                      Your lunch for <strong>{redemptionSuccessPopup.formattedDate}</strong> is locked into our kitchen prep queue.{' '}
                      <strong>Please do not submit another order for this date</strong> to avoid unintended duplicate meal quota deductions.
                    </>
                  ) : (
                    <>
                      您在 <strong>{redemptionSuccessPopup.formattedDate}</strong> 的餐点已锁定后厨制作排期。{' '}
                      <strong>请勿就该日期重复订餐</strong>，以免重复扣除餐券。如需核对可在「配送记录」中查看。
                    </>
                  )}
                </p>
              </div>

              {/* Order Summary Card */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                <div className="flex items-center gap-3 pb-2.5 border-b border-stone-200/70">
                  {redemptionSuccessPopup.mealImage && (
                    <img
                      src={redemptionSuccessPopup.mealImage}
                      alt={redemptionSuccessPopup.mealName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 truncate">
                      {language === 'en' ? redemptionSuccessPopup.mealName : redemptionSuccessPopup.mealNameZh}
                    </h4>
                    {language !== 'en' && (
                      <p className="text-[11px] text-stone-500 truncate">{redemptionSuccessPopup.mealName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {redemptionSuccessPopup.quantity} {language === 'en' ? 'Box' : '份'}
                      </span>
                      <span className="text-stone-500 font-medium">
                        {language === 'en' ? 'Chef Standard Recipe' : '私厨标准配方'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Delivery Date & Time' : '送餐日期与时段'}
                    </span>
                    <p className="font-bold text-stone-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{redemptionSuccessPopup.deliveryDate}</span>
                    </p>
                    <p className="text-[10px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{redemptionSuccessPopup.deliverySlot}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Remaining Balance' : '套餐剩余餐券'}
                    </span>
                    <p className="font-extrabold text-emerald-800 text-xs sm:text-sm flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {redemptionSuccessPopup.remainingMealsAfter} {language === 'en' ? 'Meals Left' : '餐可用'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/70 text-[11px]">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    {language === 'en' ? 'Delivery Destination' : '送餐目的地'}
                  </span>
                  <p className="text-stone-700 flex items-start gap-1 mt-0.5 leading-tight">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                    <span>
                      {redemptionSuccessPopup.deliveryAddress}, {redemptionSuccessPopup.area} {redemptionSuccessPopup.postalCode}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Buttons Footer - Guaranteed Visible within Viewport */}
            <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 shrink-0 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRedemptionSuccessPopup(null);
                  setPortalTab('history');
                }}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>{language === 'en' ? 'View in Delivery Records' : '查阅配送记录'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRedemptionSuccessPopup(null)}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Got it / Done' : '我知道了 / 完成'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP NOTIFICATION 2: DOUBLE-BOOKING PRE-CONFIRMATION WARNING MODAL
          ========================================================================= */}
      {doubleBookingWarning && doubleBookingWarning.isOpen && (
        <div
          className="fixed inset-0 z-80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDoubleBookingWarning(null);
          }}
        >
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-300 animate-in zoom-in-95 flex flex-col max-h-[90vh] my-auto overflow-hidden">
            <div className="bg-amber-500 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20 text-white shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-white">
                    {language === 'en' ? 'Flexible Daily Booking Notice' : '灵活加订 / 重复订餐确认'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    {language === 'en'
                      ? `Max ${doubleBookingWarning.maxDailyQuota || 2} meals allowed per day (Double Quota)`
                      : `每日最高限额 ${doubleBookingWarning.maxDailyQuota || 2} 份餐品（双倍限额）`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoubleBookingWarning(null)}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-stone-700 overflow-y-auto flex-1">
              <p className="leading-relaxed">
                {language === 'en' ? (
                  <>
                    You already have <strong>{doubleBookingWarning.existingQty}x meal(s)</strong> scheduled for delivery on <strong>{formatDisplayDate(doubleBookingWarning.date)}</strong> ({doubleBookingWarning.existingMealName}).
                  </>
                ) : (
                  <>
                    您在 <strong>{formatDisplayDate(doubleBookingWarning.date)}</strong> 已经安排了 <strong>{doubleBookingWarning.existingQty} 份餐品</strong>（{doubleBookingWarning.existingMealNameZh || doubleBookingWarning.existingMealName}）。
                  </>
                )}
              </p>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1.5 leading-relaxed">
                <span className="font-bold text-xs block text-amber-900">
                  🍱 {language === 'en' ? 'Flexible Daily Meal Quota:' : '灵活排餐双倍限额规则：'}
                </span>
                <p>
                  {language === 'en'
                    ? `Your plan allows up to ${doubleBookingWarning.maxDailyQuota || 2} meals per day. Adding ${doubleBookingWarning.newQty || 1} meal (${doubleBookingWarning.newSlot || 'selected slot'}) will bring your total to ${(doubleBookingWarning.existingQty || 1) + (doubleBookingWarning.newQty || 1)} / ${doubleBookingWarning.maxDailyQuota || 2} meals for this date.`
                    : `您的配套每日最高允许兑换 ${doubleBookingWarning.maxDailyQuota || 2} 份餐品。加订 ${doubleBookingWarning.newQty || 1} 份（${doubleBookingWarning.newSlot || '所选时段'}）后，当日累计为 ${(doubleBookingWarning.existingQty || 1) + (doubleBookingWarning.newQty || 1)} / ${doubleBookingWarning.maxDailyQuota || 2} 份。`}
                </p>
                <p className="text-[11px] text-amber-800">
                  {language === 'en'
                    ? 'Flexible combinations allowed: you can arrange 1 Lunch + 1 Dinner or multiple meals in the same delivery window.'
                    : '支持灵活排餐组合：可安排 1份午餐 + 1份晚餐，亦可同一时段配送多份。'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 shrink-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDoubleBookingWarning(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel (Keep Existing)' : '取消（保持原有预定）'}
              </button>

              <button
                type="button"
                onClick={doubleBookingWarning.onProceed}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-xs cursor-pointer"
              >
                {language === 'en'
                  ? `Yes, Add Meal (${doubleBookingWarning.newQty || 1} Box)`
                  : `确认加订 (${doubleBookingWarning.newQty || 1} 份)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP NOTIFICATION 3: OFFICIAL RECEIPT PREVIEW MODAL FOR MEMBER
          ========================================================================= */}
      {selectedReceiptForPreview && (
        <OfficialReceiptModal
          isOpen={Boolean(selectedReceiptForPreview)}
          onClose={() => setSelectedReceiptForPreview(null)}
          receipt={selectedReceiptForPreview}
          language={language}
          siteSettings={siteSettings}
        />
      )}
    </div>
  );
};
