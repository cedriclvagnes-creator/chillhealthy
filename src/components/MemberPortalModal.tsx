import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Language, MemberAccount, MealItem, MealPlan, MealRedemption, SiteSettings } from '../types';

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
  const [regPhone, setRegPhone] = useState('0126189919');
  const [regPass, setRegPass] = useState('123456');
  const [regAddress, setRegAddress] = useState('');
  const [regArea, setRegArea] = useState('Klang / Bukit Tinggi');
  const [regPostal, setRegPostal] = useState('41200');

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

  // Advance Multi-Day Planner state
  const upcomingWorkdays = React.useMemo(() => getUpcomingWorkdays(5), []);
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
    if (!regName || !regEmail || !regPhone) {
      alert(language === 'en' ? 'Please fill in name, email and phone.' : '请填写姓名、邮箱和电话。');
      return;
    }
    onRegister({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPass || '123456',
      address: regAddress,
      area: regArea,
      postalCode: regPostal,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!currentMember ? (
          /* =========================================================================
             1. GUEST LOGIN & REGISTER SCREEN
             ========================================================================= */
          <div className="p-6 sm:p-8">
            <div className="text-center max-w-md mx-auto mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-md shadow-emerald-700/20">
                C
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900">
                {language === 'en' ? 'CHILL Healthy Member Portal' : '潮轻食 · 会员中心与餐券兑换'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {language === 'en'
                  ? 'Log in to redeem your daily meal package, check remaining meal credits, and track deliveries.'
                  : '登录会员账号即可每日在线兑换套餐餐盒、查询剩余餐数及配送进度。'}
              </p>
            </div>

            {/* Auth Mode Switch */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl max-w-xs mx-auto mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {language === 'en' ? 'Member Login' : '会员登录'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {language === 'en' ? 'Register Account' : '新会员注册'}
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto space-y-4">
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
              <form onSubmit={handleRegisterSubmit} className="max-w-md mx-auto space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Full Name *' : '姓名 *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jessica Chen"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Handphone Number (Member ID) *' : '手机号码 (会员登录账号) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0126189919"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Email Address *' : '电子邮箱 *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jessica@example.com"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700 block">
                        {language === 'en' ? 'Password' : '登录密码'}
                      </label>
                      <span className="text-[10px] text-stone-400">
                        {language === 'en' ? 'Default 123456' : '默认 123456'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="123456"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Address 1 (Office or Main Address)' : '地址一 (办公室/主要送餐点)'}
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Unit, Building name, Street..."
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Area' : '配送区域'}
                    </label>
                    <select
                      value={regArea}
                      onChange={(e) => setRegArea(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white"
                    >
                      <option value="Klang / Bukit Tinggi">Klang / Bukit Tinggi (巴生)</option>
                      <option value="Shah Alam / Kota Kemuning">Shah Alam (莎阿南)</option>
                      <option value="Subang Jaya / USJ">Subang Jaya / USJ</option>
                      <option value="Petaling Jaya / Damansara">Petaling Jaya (八打灵)</option>
                      <option value="Kuala Lumpur CBD">Kuala Lumpur CBD (吉隆坡)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Postal Code' : '邮区编号'}
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={regPostal}
                      onChange={(e) => setRegPostal(e.target.value)}
                      placeholder="41200"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                  {language === 'en'
                    ? '✓ Your handphone number will be your Member Login Number. Default password is set to 123456 and can be changed later.'
                    : '✓ 您的手机号码将作为您的专属会员账号，初始密码设为 123456，进入会员中心后可随时修改。'}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer mt-2"
                >
                  {language === 'en' ? 'Create Account & Access Portal' : '立即注册并进入会员中心'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* =========================================================================
             2. LOGGED IN MEMBER PORTAL DASHBOARD
             ========================================================================= */
          <div>
            {/* Top Member Header Banner */}
            <div className="bg-stone-900 text-white p-5 sm:p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-lg shrink-0 shadow-md">
                    {currentMember.name.substring(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                        {currentMember.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40">
                        {language === 'en' ? 'Official Meal Member' : '潮轻食专属会员'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[11px] font-bold border border-emerald-700/60 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{language === 'en' ? 'Member ID / Phone:' : '会员登录账号/手机:'} {currentMember.memberNumber || currentMember.phone}</span>
                      </span>
                      <span>·</span>
                      <span>{currentMember.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition-colors cursor-pointer border border-stone-700"
                    title={language === 'en' ? 'Change Password' : '修改登录密码'}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Change Password' : '修改密码'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${whatsappLinkNumber}?text=Hi%20CHILL%20Healthy,%20I%20am%20member%20${encodeURIComponent(currentMember.name)}.%20I%20need%20assistance%20with%20my%20daily%20meal%20plan.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Concierge</span>
                  </a>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Logout' : '退出'}</span>
                  </button>
                </div>
              </div>

              {/* Change Password Dialog Modal */}
              {isChangePasswordOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
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
                            ? `Member Number: ${currentMember.memberNumber || currentMember.phone}`
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
                            {language === 'en' ? 'Initial default is 123456' : '初始默认密码为 123456'}
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

              {/* Package Credits Stat Bar */}
              <div className="mt-4 p-4 rounded-2xl bg-stone-800/90 border border-stone-700 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-stone-400 font-semibold block">
                    {language === 'en' ? 'Active Meal Package:' : '当前生效配套:'}
                  </span>
                  <p className="font-heading font-extrabold text-white text-base">
                    {currentMember.activePackage
                      ? language === 'en'
                        ? currentMember.activePackage.planName
                        : currentMember.activePackage.planNameZh
                      : language === 'en'
                      ? 'No Active Package'
                      : '暂无生效配套'}
                  </p>
                  {currentMember.activePackage?.expiryDate && (
                    <span className="text-[10px] text-stone-400">
                      Valid until: {currentMember.activePackage.expiryDate} (30 days validity)
                    </span>
                  )}
                </div>

                {currentMember.activePackage ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        {language === 'en' ? 'Remaining Meals' : '剩余可用餐数'}
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

                    <button
                      onClick={() => setPortalTab('redeem')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      {language === 'en' ? 'Redeem Meal' : '每日选餐'}
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

            {/* Official Ordering Instructions Notice Banner */}
            <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold">
                  {language === 'en'
                    ? '⏰ Next-Day Cutoff: Select before 5:00 PM · Mon to Fri Lunch Delivery (10:00 AM – 2:00 PM)'
                    : '⏰ 隔天餐点请在下午 5:00 前完成选择 · 周一至周五午餐配送（10:00 AM – 2:00 PM）'}
                </span>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold">
                {language === 'en' ? 'Free Delivery · 1 Account 2 Addresses' : '巴生谷免运费 · 1户口支持2个地址'}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setPortalTab('redeem')}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  portalTab === 'redeem'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>{language === 'en' ? 'Next-Day Meal (每天选餐)' : '每天选择隔天餐点'}</span>
              </button>

              <button
                onClick={() => setPortalTab('planner')}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  portalTab === 'planner'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                <span>{language === 'en' ? 'Advance Planner (一次性排餐)' : '一次性选择所有餐点'}</span>
              </button>

              <button
                onClick={() => setPortalTab('history')}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  portalTab === 'history'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>
                  {language === 'en' ? 'Delivery Logs' : '订餐派送记录'} ({memberRedemptions.length})
                </span>
              </button>

              <button
                onClick={() => setPortalTab('renew')}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  portalTab === 'renew'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>{language === 'en' ? 'Packages & Renew' : '配套续订'}</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-6 max-h-[62vh] overflow-y-auto">
              {/* =========================================================
                  TAB 1: DAILY NEXT-DAY MEAL SELECTION
                  ========================================================= */}
              {portalTab === 'redeem' && (
                <div>
                  {redemptionSuccessMsg && (
                    <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-2 font-bold animate-in fade-in">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{redemptionSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleRedemptionSubmit} className="space-y-4">
                    {/* 1 Account 2 Addresses Selector */}
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'en' ? 'Select Delivery Address (1 Account 2 Addresses)' : '选择送餐地址 (一个户口支持两个地址)'}</span>
                        </label>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          {language === 'en' ? 'Free Klang Valley Delivery' : '巴生谷全免运费'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Address 1: Office/Main */}
                        <div
                          onClick={() => setSelectedAddressSlot(1)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                            selectedAddressSlot === 1
                              ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                              : 'border-stone-200 bg-white hover:bg-stone-100'
                          }`}
                        >
                          <Building className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 text-xs">
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{language === 'en' ? 'Address 1 (Office / Main)' : '地址一 (办公室/主地址)'}</span>
                              {selectedAddressSlot === 1 && (
                                <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 truncate mt-0.5">
                              {currentMember.address}, {currentMember.area}
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
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                            selectedAddressSlot === 2
                              ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                              : 'border-stone-200 bg-white hover:bg-stone-100'
                          }`}
                        >
                          <Home className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 text-xs flex-1">
                            <div className="font-bold text-stone-900 flex items-center justify-between">
                              <span>{language === 'en' ? 'Address 2 (Home / Secondary)' : '地址二 (住家/第二地址)'}</span>
                              {selectedAddressSlot === 2 && (
                                <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            {currentMember.address2 ? (
                              <p className="text-stone-600 truncate mt-0.5">
                                {currentMember.address2}, {currentMember.area2 || currentMember.area}
                              </p>
                            ) : (
                              <p className="text-emerald-700 font-bold mt-0.5">
                                + {language === 'en' ? 'Click to Set Address 2' : '点击添加第二送餐地址'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inline Address 2 Editor */}
                      {isEditingAddress2 && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 animate-in fade-in">
                          <span className="text-xs font-bold text-emerald-900 block">
                            {language === 'en' ? 'Set Address 2 (Home / Secondary):' : '设定地址二 (住家/备用地址):'}
                          </span>
                          <input
                            type="text"
                            value={editAddr2}
                            onChange={(e) => setEditAddr2(e.target.value)}
                            placeholder="Unit, Condo / Street Address"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress2(false)}
                              className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800"
                            >
                              {language === 'en' ? 'Cancel' : '取消'}
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAddress2}
                              className="px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-lg"
                            >
                              {language === 'en' ? 'Save Address 2' : '保存地址二'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Choose Date & Time Window */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'en' ? 'Delivery Date (Mon – Fri only) *' : '送餐日期 (周一至周五) *'}</span>
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
                          <span>{language === 'en' ? 'Lunch Delivery Window *' : '午餐配送时段 *'}</span>
                        </label>
                        <div className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-bold">
                          🍱 午餐配送：10:00 AM – 2:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Meal Quantity selector for multi-person packages */}
                    <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'en' ? 'Meals to Deliver on This Day:' : '当日送餐份数:'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {language === 'en' ? 'Deducted from remaining package credits' : '将从您的套餐剩余餐券中扣除'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMealQuantity((q) => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {mealQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setMealQuantity((q) =>
                              Math.min(currentMember.activePackage?.remainingMeals || 6, q + 1)
                            )
                          }
                          className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Meal Selection Grid (26 rotating meals) */}
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'en' ? 'Choose Your Healthy Bento Box *' : '挑选今日轻食餐盒 (26种选择) *'}</span>
                        </span>
                        <span className="text-[11px] text-emerald-800 font-semibold">
                          {menuItems.length} {language === 'en' ? 'Bentos available' : '道招牌餐点任选'}
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-stone-200 rounded-2xl">
                        {menuItems.map((meal) => (
                          <div
                            key={meal.id}
                            onClick={() => setSelectedMealId(meal.id)}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              selectedMealId === meal.id
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 font-bold'
                                : 'border-stone-100 hover:bg-stone-50'
                            }`}
                          >
                            <img
                              src={meal.image}
                              alt={meal.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs text-stone-900 truncate">
                                {language === 'en' ? meal.name : meal.nameZh}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                                <span className="text-emerald-700 font-bold">{meal.calories} kcal</span>
                                <span>·</span>
                                <span className="text-amber-700 font-bold">{meal.protein}g protein</span>
                              </div>
                            </div>
                            {selectedMealId === meal.id && (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dietary Notes */}
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        {language === 'en' ? 'Special Notes for Kitchen (Dietary / 3-Highs)' : '厨房备餐特调要求 (低钠/三高/酱汁分开)'}
                      </label>
                      <input
                        type="text"
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                        placeholder="e.g. Dressing on side, no cucumber, gentle cooking for senior..."
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals <= 0}
                      className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {language === 'en'
                          ? `Confirm & Book ${mealQuantity} Bento for ${selectedDate}`
                          : `确认兑换 ${mealQuantity} 份餐品 (送达日期: ${selectedDate})`}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* =========================================================
                  TAB 2: ADVANCE MULTI-DAY MEAL PLANNER (一次性选择好所有餐点)
                  ========================================================= */}
              {portalTab === 'planner' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                        {language === 'en' ? 'Advance Workday Meal Planner' : '一次性选择好所有餐点 (提前排餐)'}
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {language === 'en'
                          ? 'Plan your healthy lunch ahead for the upcoming workdays (Mon – Fri 10:00 AM – 2:00 PM).'
                          : '一次性安排好未来工作日的午餐便当，免除每天重复选餐的繁琐。'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRandomizeBatch}
                      className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Randomize Menu' : '一键均衡搭配'}</span>
                    </button>
                  </div>

                  {/* Workdays List */}
                  <div className="space-y-2.5">
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
                          className="p-3 bg-white rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-stone-100 text-stone-800 text-xs font-black flex items-center justify-center shrink-0">
                              D{index + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-stone-900 block">{dayName}</span>
                              <span className="text-[10px] text-stone-400">10:00 AM – 2:00 PM Lunch</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-1 max-w-md">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <select
                              value={selectedDishId}
                              onChange={(e) =>
                                setBatchSchedule({ ...batchSchedule, [dateStr]: e.target.value })
                              }
                              className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
                            >
                              {menuItems.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {language === 'en' ? m.name : m.nameZh} ({m.calories} kcal)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                    <span>
                      {language === 'en' ? 'Deliver to:' : '送餐地址:'}{' '}
                      <strong className="text-stone-900">{currentAddress}, {currentArea}</strong>
                    </span>
                    <span className="text-emerald-800 font-bold">
                      {upcomingWorkdays.length} meals total
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={!currentMember.activePackage || currentMember.activePackage.remainingMeals < upcomingWorkdays.length}
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
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

              {/* =========================================================
                  TAB 3: REDEMPTION & KITCHEN DISPATCH LOGS
                  ========================================================= */}
              {portalTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      {language === 'en' ? 'Your Meal Deliveries' : '您的餐品配送记录'}
                    </h4>
                    <span className="text-xs text-stone-500">
                      {memberRedemptions.length} {language === 'en' ? 'orders total' : '次兑换记录'}
                    </span>
                  </div>

                  {memberRedemptions.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      {language === 'en'
                        ? 'No meal redemptions yet. Click "Redeem Daily Meal" to schedule your lunch!'
                        : '暂无订餐记录。请点击“每日餐品兑换”开始您的健康轻食之旅！'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberRedemptions.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 sm:p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={r.mealImage}
                                alt={r.mealName}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                }}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
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

              {/* =========================================================
                  TAB 4: PACKAGES & RENEWAL
                  ========================================================= */}
              {portalTab === 'renew' && (
                <div className="space-y-4">
                  <div className="text-center max-w-md mx-auto">
                    <h4 className="font-heading font-extrabold text-base text-stone-900">
                      {language === 'en' ? 'Official CHILL Healthy Meal Plans' : '潮轻食官方健康餐配套'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {language === 'en'
                        ? 'Select any 1 to 6 person package below to add meal credits to your profile.'
                        : '选择适合您的 1 至 6 人配套，充值餐券轻松享受每日健康送餐。'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-heading font-bold text-sm sm:text-base text-stone-900">
                              {language === 'en' ? pkg.title : pkg.titleZh}
                            </h5>
                            {pkg.popular && (
                              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                                {language === 'en' ? 'POPULAR' : '热销首选'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {pkg.mealsTotal} Meals in 30 Days · {pkg.persons || 1} Person ({pkg.mealsPerDay || 1} meal/day) · RM {pkg.pricePerMeal.toFixed(2)}/meal
                          </p>
                          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                            ✓ {language === 'en' ? 'Free daily lunch delivery · 1 account 2 addresses' : '巴生谷免运费 · 1户口2个地址 · 26道菜品任选'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <div className="font-heading font-extrabold text-lg text-emerald-800">
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
                            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            {language === 'en' ? 'Order Plan' : '立即选购'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-600">
                    <span>
                      {language === 'en'
                        ? 'Special corporate orders or consultation? WhatsApp: '
                        : '企业团餐、三高健康咨询？请直连官方客服 WhatsApp：'}
                    </span>
                    <a
                      href={`https://wa.me/${whatsappLinkNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 underline"
                    >
                      {siteSettings.whatsappDisplay}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
