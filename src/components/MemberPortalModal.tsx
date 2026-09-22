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
} from 'lucide-react';
import { Language, MemberAccount, MealItem, MealPlan, MealRedemption, SiteSettings, OfficialReceipt } from '../types';
import { ChillLogo } from './ChillLogo';
import { OfficialReceiptModal } from './OfficialReceiptModal';
import {
  getMemberReferralCode,
  buildReferralShareUrl,
  buildReferralWhatsAppMessage,
  MIN_REFERRAL_PLAN_PRICE,
} from '../utils/referral';

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
  } | null>(null);

  // Double-booking pre-confirmation alert warning
  const [doubleBookingWarning, setDoubleBookingWarning] = useState<{
    isOpen: boolean;
    date: string;
    existingMealName: string;
    existingMealNameZh?: string;
    existingQty: number;
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

  // Initialize batch planner with defaults
  useEffect(() => {
    if (menuItems.length > 0 && Object.keys(batchSchedule).length === 0) {
      const initial: { [date: string]: string } = {};
      upcomingWorkdays.forEach((dateStr, idx) => {
        initial[dateStr] = menuItems[idx % menuItems.length]?.id || menuItems[0]?.id;
      });
      setBatchSchedule(initial);
    }
  }, [menuItems, upcomingWorkdays]);

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

    const rawPhone = regPhone.replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 8) {
      setRegError(
        language === 'en'
          ? 'Please enter a valid Handphone Number (which serves as your Login ID).'
          : '请填写有效的手机号码（作为您的会员登录账号）。'
      );
      return;
    }

    const cleanPhone =
      rawPhone.startsWith('60')
        ? rawPhone.slice(1)
        : rawPhone.startsWith('0')
        ? rawPhone
        : `0${rawPhone}`;

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

  // Save updated Address 2
  const handleSaveAddress2 = () => {
    if (!currentMember) return;
    if (onUpdateMemberAddresses) {
      onUpdateMemberAddresses(
        {
          address: currentMember.address,
          area: currentMember.area,
          postalCode: currentMember.postalCode,
        },
        {
          address2: editAddr2,
          area2: editArea2,
          postalCode2: editPostal2,
        }
      );
    } else {
      currentMember.address2 = editAddr2;
      currentMember.area2 = editArea2;
      currentMember.postalCode2 = editPostal2;
    }
    setIsEditingAddress2(false);
    setSelectedAddressSlot(2);
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
      alert(
        language === 'en'
          ? `⚠️ Notice: ${dateVal} has been turned off by kitchen administration (holiday or off-day). Please select another date.`
          : `⚠️ 提示：${dateVal} 已被后厨管理关闭（节假日或休厨日）。请选择其他送餐日期。`
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
      alert(
        language === 'en'
          ? `⚠️ Notice: The selected date (${selectedDate}) has been turned off by kitchen administration. Please select another date.`
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

    const chosenMeal = menuItems.find((m) => m.id === selectedMealId) || menuItems[0];

    const doSubmitRedemption = () => {
      const success = onRedeemMeal({
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
      });

      if (success) {
        const remainingAfter = Math.max(0, (currentMember.activePackage?.remainingMeals || 1) - mealQuantity);

        // Pop up the official confirmation notification modal to ensure awareness and avoid double booking
        setRedemptionSuccessPopup({
          isOpen: true,
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
        existingQty: existingBooking.quantity || 1,
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

    const daysCount = upcomingWorkdays.length;
    if (currentMember.activePackage.remainingMeals < daysCount) {
      alert(
        language === 'en'
          ? `You need ${daysCount} meal credits for this week, but currently have ${currentMember.activePackage.remainingMeals}.`
          : `本次整周排餐需要 ${daysCount} 餐，但您目前剩余 ${currentMember.activePackage.remainingMeals} 餐。`
      );
      return;
    }

    const redemptionsList = upcomingWorkdays.map((dateStr) => {
      const mealId = batchSchedule[dateStr] || menuItems[0]?.id;
      const meal = menuItems.find((m) => m.id === mealId) || menuItems[0];
      return {
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
      };
    });

    if (onBatchRedeemMeals) {
      onBatchRedeemMeals(redemptionsList);
    } else {
      // fallback single redemptions
      redemptionsList.forEach((r) => onRedeemMeal(r));
    }

    const remainingAfter = Math.max(0, currentMember.activePackage.remainingMeals - daysCount);

    setRedemptionSuccessPopup({
      isOpen: true,
      deliveryDate: `${upcomingWorkdays[0]} ~ ${upcomingWorkdays[upcomingWorkdays.length - 1]}`,
      formattedDate: `${formatDisplayDate(upcomingWorkdays[0])} — ${formatDisplayDate(upcomingWorkdays[upcomingWorkdays.length - 1])}`,
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
                            {language === 'en' ? 'Handphone Number (Login ID) *' : '手机号码 (会员登录账号) *'}
                          </label>
                        </div>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="e.g. 012-618 9919"
                            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-emerald-600/40 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold text-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-100/60 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        {language === 'en'
                          ? 'Your handphone number will be your official Member Login ID.'
                          : '您的手机号码将作为唯一的会员登录ID，简单好记。'}
                      </span>
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

                  {/* Bottom Registration CTA */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'en' ? 'Create Account & Access Member Portal (0 Meals Initial)' : '立即注册并进入会员中心 (初始0餐)'}</span>
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
                    {currentMember.activePackage?.expiryDate && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Valid until: {currentMember.activePackage.expiryDate} (30 days validity)
                      </span>
                    )}
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

                      {/* WhatsApp Plan Renewal Reminder Button (Right Beside Balance Meal Available) */}
                      {(() => {
                        const planName = (currentMember.activePackage.planName || '').toLowerCase();
                        const planId = (currentMember.activePackage.planId || '').toLowerCase();
                        const totalMeals = currentMember.activePackage.totalMeals || 20;

                        // Calculate free meals: 1 meal free for single, 2 for duo, etc.
                        let freeMeals = 1;
                        let tierLabelEn = 'Single Plan (1 Meal Free + Free Delivery)';
                        let tierLabelZh = '单人配套（送1餐+免运费）';

                        if (planId.includes('6-person') || planName.includes('6-person') || totalMeals >= 120) {
                          freeMeals = 6;
                          tierLabelEn = '6-Person Plan (6 Meals Free + Free Delivery)';
                          tierLabelZh = '六人配套（送6餐+免运费）';
                        } else if (planId.includes('5-person') || planName.includes('5-person') || totalMeals >= 100) {
                          freeMeals = 5;
                          tierLabelEn = '5-Person Plan (5 Meals Free + Free Delivery)';
                          tierLabelZh = '五人配套（送5餐+免运费）';
                        } else if (planId.includes('4-person') || planName.includes('4-person') || totalMeals >= 80) {
                          freeMeals = 4;
                          tierLabelEn = '4-Person Plan (4 Meals Free + Free Delivery)';
                          tierLabelZh = '四人配套（送4餐+免运费）';
                        } else if (planId.includes('3-person') || planName.includes('3-person') || totalMeals >= 60) {
                          freeMeals = 3;
                          tierLabelEn = '3-Person Plan (3 Meals Free + Free Delivery)';
                          tierLabelZh = '三人配套（送3餐+免运费）';
                        } else if (planId.includes('2-person') || planName.includes('duo') || planName.includes('2-person') || totalMeals >= 40) {
                          freeMeals = 2;
                          tierLabelEn = 'Duo Plan (2 Meals Free + Free Delivery)';
                          tierLabelZh = '双人配套（送2餐+免运费）';
                        }

                        const bonusTextEn = `${freeMeals} Meal${freeMeals > 1 ? 's' : ''} Free with Delivery`;
                        const bonusTextZh = `送 ${freeMeals} 餐 + 免运费`;

                        const whatsappMessage = encodeURIComponent(
                          `Hi CHILL Healthy (chill-healthy.com)! 👋\n\n` +
                          `I would like to renew my meal plan with the Renewal Special Bonus:\n` +
                          `👤 Member: ${currentMember.name} (${currentMember.memberNumber || currentMember.phone})\n` +
                          `📦 Current Plan: ${currentMember.activePackage.planName}\n` +
                          `🍱 Balance Remaining: ${currentMember.activePackage.remainingMeals}/${currentMember.activePackage.totalMeals} meals\n` +
                          `🎁 Renewal Incentive: ${bonusTextEn} (${tierLabelZh})\n\n` +
                          `Please help me confirm my plan renewal and claim my ${freeMeals} free meal(s) with delivery. Thank you!`
                        );

                        return (
                          <a
                            id="btn-whatsapp-renewal-reminder"
                            href={`https://wa.me/${whatsappLinkNumber}?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer border border-emerald-400/40 active:scale-95"
                            title={
                              language === 'en'
                                ? `Renew via WhatsApp & get ${bonusTextEn}`
                                : `通过 WhatsApp 续订配套，即可获赠 ${bonusTextZh}`
                            }
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                              <Gift className="w-4 h-4 text-amber-300 animate-bounce" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3 text-emerald-300 fill-emerald-300/30" />
                                  {language === 'en' ? 'Renew via WhatsApp' : 'WhatsApp 专属续订'}
                                </span>
                                <span className="text-[9px] font-black bg-amber-400 text-stone-900 px-1.5 py-0.2 rounded-full shadow-2xs">
                                  {language === 'en' ? `+${freeMeals} FREE` : `送${freeMeals}餐`}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold text-white leading-tight">
                                {language === 'en'
                                  ? `${bonusTextEn}`
                                  : `${bonusTextZh}`}
                              </p>
                            </div>
                          </a>
                        );
                      })()}

                      {/* Redeem Daily Meal Button */}
                      <button
                        onClick={() => setPortalTab('redeem')}
                        className="px-3.5 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-stone-600"
                      >
                        <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'en' ? 'Redeem Meal' : '每日选餐'}</span>
                      </button>

                      {/* Refer Friends Quick Button */}
                      <button
                        onClick={() => setPortalTab('referral')}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-400/40"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'en' ? 'Refer Friends (+1 Free Meal)' : '邀请好友 (送1餐)'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPortalTab('renew')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                    >
                      {language === 'en' ? 'Subscribe Plan' : '购买配套'}
                    </button>
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

                        {/* Inline Address 2 Editor */}
                        {isEditingAddress2 && (
                          <div className="p-3 bg-stone-50 rounded-2xl border border-emerald-300 space-y-2.5 animate-in fade-in">
                            <span className="text-xs font-bold text-emerald-900 block">
                              {language === 'en' ? 'Set Address 2 (Home / Secondary):' : '设定地址二 (住家/备用地址):'}
                            </span>
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
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
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
                                placeholder="Postal Code"
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setIsEditingAddress2(false)}
                                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                              >
                                {language === 'en' ? 'Cancel' : '取消'}
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveAddress2}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                              >
                                {language === 'en' ? 'Save Address 2' : '保存地址二'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delivery Date & Time Window */}
                      <div className="space-y-3 pt-1 border-t border-stone-100">
                        <div>
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
                              {upcomingWorkdays.map((wDate) => {
                                const isSelected = selectedDate === wDate;
                                const isOff = siteSettings.disabledDeliveryDates?.includes(wDate);
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
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                        : isOff
                                        ? 'bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed'
                                        : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 border-stone-200'
                                    }`}
                                  >
                                    {dayName} {isOff && '(Off)'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
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
                              {language === 'en' ? 'Deducted from package balance' : '从套餐剩余餐券中扣除'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setMealQuantity((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-stone-900">
                              {mealQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setMealQuantity((q) =>
                                  Math.min(currentMember.activePackage?.remainingMeals || 6, q + 1)
                                )
                              }
                              className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
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

                      {/* Submit Redemption Button */}
                      <button
                        type="button"
                        onClick={handleRedemptionSubmit}
                        disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals <= 0}
                        className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {(() => {
                            const existingBooking = allRedemptions.find(
                              (r) => r.memberId === currentMember?.id && r.deliveryDate === selectedDate && r.status !== 'Cancelled'
                            );
                            if (existingBooking) {
                              return language === 'en'
                                ? `Add Additional Bento for ${selectedDate} (${mealQuantity} box)`
                                : `加订额外餐品 (送达: ${selectedDate} · ${mealQuantity}份)`;
                            }
                            return language === 'en'
                              ? `Confirm & Book ${mealQuantity} Bento for ${selectedDate}`
                              : `确认兑换 ${mealQuantity} 份餐品 (送达: ${selectedDate})`;
                          })()}
                        </span>
                      </button>
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
                      {selectedDate} · {mealQuantity} Meal
                    </span>
                    <p className="font-heading font-extrabold text-xs text-stone-900 truncate">
                      {selectedMealObj ? (language === 'en' ? selectedMealObj.name : selectedMealObj.nameZh) : 'Select Dish'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedemptionSubmit}
                    disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals <= 0}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Confirm Redeem' : '立即确认兑换'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: ADVANCE MULTI-DAY MEAL PLANNER (整周一次性排餐) */}
            {portalTab === 'planner' && (
              <div className="space-y-4">
                <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <h4 className="font-heading text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wider">
                      {language === 'en' ? 'Advance Workday Meal Planner' : '一次性选择好所有餐点 (提前排餐)'}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {language === 'en'
                        ? 'Schedule your upcoming workdays (Mon – Fri 10:00 AM – 2:00 PM) in 1 click.'
                        : '一次性安排好未来 5 个工作日的午餐便当，免除每天重复选餐的繁琐。'}
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

                {/* Workdays Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {upcomingWorkdays.map((dateStr, index) => {
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
                    Total: {upcomingWorkdays.length} meals (deducted from remaining package)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals < upcomingWorkdays.length}
                  className="w-full py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? `Confirm All ${upcomingWorkdays.length} Days Schedule`
                      : `一键确认未来 ${upcomingWorkdays.length} 天全部排餐`}
                  </span>
                </button>
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
                        <p className="text-xs text-stone-500">
                          {pkg.mealsTotal} Meals in 30 Days · {pkg.persons || 1} Person · RM {pkg.pricePerMeal.toFixed(2)}/meal
                        </p>
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
      {redemptionSuccessPopup && redemptionSuccessPopup.isOpen && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95">
            {/* Top Emerald Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-white/20 text-white border border-white/30 shrink-0">
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-200" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-700/80 text-emerald-200 px-2.5 py-0.5 rounded-md">
                    {language === 'en' ? 'RESERVATION CONFIRMED' : '订餐排期已确认'}
                  </span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white mt-1 leading-tight">
                    {language === 'en' ? 'Daily Meal Successfully Booked!' : '每日健康餐预定成功！'}
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    {language === 'en'
                      ? 'Your meal has been securely scheduled with our kitchen team.'
                      : '您的餐点已成功提交后厨制作排期。'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Double-Booking Prevention Awareness Box */}
              <div className="p-4 rounded-2xl bg-amber-50/95 border border-amber-200 text-amber-950 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{language === 'en' ? 'Awareness: Avoid Double Booking' : '防重复订餐重要提示'}</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
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
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-200/70">
                  {redemptionSuccessPopup.mealImage && (
                    <img
                      src={redemptionSuccessPopup.mealImage}
                      alt={redemptionSuccessPopup.mealName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-sm text-stone-900 truncate">
                      {language === 'en' ? redemptionSuccessPopup.mealName : redemptionSuccessPopup.mealNameZh}
                    </h4>
                    {language !== 'en' && (
                      <p className="text-xs text-stone-500 truncate">{redemptionSuccessPopup.mealName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {redemptionSuccessPopup.quantity} {language === 'en' ? 'Box' : '份'}
                      </span>
                      <span className="text-stone-500 font-medium">
                        {language === 'en' ? 'Chef Standard Recipe' : '私厨标准配方'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Delivery Date & Time' : '送餐日期与时段'}
                    </span>
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{redemptionSuccessPopup.deliveryDate}</span>
                    </p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{redemptionSuccessPopup.deliverySlot}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Remaining Package Balance' : '套餐剩余餐券'}
                    </span>
                    <p className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {redemptionSuccessPopup.remainingMealsAfter} {language === 'en' ? 'Meals Left' : '餐可用'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/70 text-xs">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    {language === 'en' ? 'Delivery Destination' : '送餐目的地'}
                  </span>
                  <p className="text-stone-700 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>
                      {redemptionSuccessPopup.deliveryAddress}, {redemptionSuccessPopup.area} {redemptionSuccessPopup.postalCode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRedemptionSuccessPopup(null);
                    setPortalTab('history');
                  }}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  <span>{language === 'en' ? 'View in Delivery Records' : '查阅配送记录'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRedemptionSuccessPopup(null)}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'en' ? 'Got it / Done' : '我知道了 / 完成'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP NOTIFICATION 2: DOUBLE-BOOKING PRE-CONFIRMATION WARNING MODAL
          ========================================================================= */}
      {doubleBookingWarning && doubleBookingWarning.isOpen && (
        <div className="fixed inset-0 z-80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <div className="bg-amber-500 text-white p-5 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 text-white shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-white">
                  {language === 'en' ? 'Double Booking Notice' : '重复订餐风险提示'}
                </h3>
                <p className="text-xs text-amber-100">
                  {language === 'en' ? 'You already have a scheduled lunch for this date' : '您在该送餐日期已有一笔预定记录'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700">
              <p className="leading-relaxed">
                {language === 'en' ? (
                  <>
                    You already have <strong>{doubleBookingWarning.existingQty}x {doubleBookingWarning.existingMealName}</strong> scheduled for delivery on <strong>{formatDisplayDate(doubleBookingWarning.date)}</strong>.
                  </>
                ) : (
                  <>
                    您在 <strong>{formatDisplayDate(doubleBookingWarning.date)}</strong> 已经成功预定了 <strong>{doubleBookingWarning.existingMealNameZh || doubleBookingWarning.existingMealName}</strong>（{doubleBookingWarning.existingQty}份）。
                  </>
                )}
              </p>

              <p className="text-stone-500 bg-amber-50 p-3 rounded-xl border border-amber-200">
                {language === 'en'
                  ? 'To avoid accidental double booking, please confirm if you intentionally want to add an additional meal box to this delivery date.'
                  : '为避免重复扣除您的套餐餐券，请确认您是否确实需要为该日期加订多一份午餐？'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
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
                  {language === 'en' ? 'Yes, Book Additional Meal' : '是的，确认加订餐品'}
                </button>
              </div>
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
