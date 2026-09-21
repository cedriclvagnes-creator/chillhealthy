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
} from 'lucide-react';
import { Language, MemberAccount, MealItem, MealPlan, MealRedemption, SiteSettings } from '../types';
import { ChillLogo } from './ChillLogo';

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
  menuItems: MealItem[];
  packages: MealPlan[];
  allRedemptions: MealRedemption[];
  siteSettings: SiteSettings;
  onSelectPackageToBuy: (pkg: MealPlan) => void;
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
  menuItems,
  packages,
  allRedemptions,
  siteSettings,
  onSelectPackageToBuy,
}) => {
  // Login / Register state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

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

  // Member Portal active tabs: 'redeem' (Daily Meal), 'planner' (Advance Multi-Day), 'history' (Delivery Logs), 'renew' (Packages)
  const [portalTab, setPortalTab] = useState<'redeem' | 'planner' | 'history' | 'renew'>('redeem');

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

  // Meal Search & Filter state
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('all');

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

  // Submit Daily Meal Redemption
  const handleRedemptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;

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
    });

    if (success) {
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
      };
    });

    if (onBatchRedeemMeals) {
      onBatchRedeemMeals(redemptionsList);
    } else {
      // fallback single redemptions
      redemptionsList.forEach((r) => onRedeemMeal(r));
    }

    setRedemptionSuccessMsg(
      language === 'en'
        ? `✓ Successfully planned all ${daysCount} upcoming workdays in advance!`
        : `✓ 成功一次性完成未来 ${daysCount} 个工作日的所有午餐排期！`
    );
    setPortalTab('history');
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
            {currentMember && currentMember.activePackage && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentMember.activePackage.remainingMeals} / {currentMember.activePackage.totalMeals}{' '}
                  {language === 'en' ? 'Meals Left' : '剩余餐券'}
                </span>
              </div>
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
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl max-w-xs mx-auto mb-6">
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
                  {language === 'en' ? 'Register Account' : '新会员注册'}
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
                    <p className="text-[11px] text-stone-500 mt-1">
                      {language === 'en'
                        ? '💡 Default password is 123456. You can easily change it inside your profile.'
                        : '💡 所有会员初始密码均为 123456，登录后可在个人中心随时修改。'}
                    </p>
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

                  {/* Bottom Registration CTA */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'en' ? 'Create Account & Access Member Portal' : '立即注册并进入会员中心'}</span>
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
                              <span>{language === 'en' ? 'Delivery Date (Mon – Fri only) *' : '送餐日期 (周一至周五) *'}</span>
                            </span>
                          </label>
                          <input
                            type="date"
                            required
                            min={getNextWorkday(1)}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600"
                          />
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
                              🍱 {language === 'en' ? 'Lunch (10am–2pm)' : '午餐 (10am–2pm)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot('Dinner: 3:00pm - 7:00pm')}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                                selectedSlot.includes('Dinner')
                                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-600/30'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              🍲 {language === 'en' ? 'Dinner: 3:00pm - 7:00pm' : '晚餐：3:00pm - 7:00pm'}
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

                        {/* Dietary / Special Kitchen Request */}
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            {language === 'en' ? 'Kitchen Preparation Notes (Dietary / Health)' : '厨房备餐要求 (酱汁分开 / 低钠 / 少葱蒜)'}
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
                          {language === 'en'
                            ? `Confirm & Book ${mealQuantity} Bento for ${selectedDate}`
                            : `确认兑换 ${mealQuantity} 份餐品 (送达: ${selectedDate})`}
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
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {language === 'en' ? 'Included (RM 0)' : '配套内免费兑换'}
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

            {/* Tab 3: DELIVERY LOGS & STATUS TRACKING */}
            {portalTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900">
                    {language === 'en' ? 'Your Meal Deliveries' : '您的餐品配送记录'}
                  </h4>
                  <span className="text-xs text-stone-500 font-semibold">
                    {memberRedemptions.length} {language === 'en' ? 'orders total' : '次兑换记录'}
                  </span>
                </div>

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

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
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
    </div>
  );
};
