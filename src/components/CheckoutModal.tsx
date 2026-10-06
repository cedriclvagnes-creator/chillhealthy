import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  MessageCircle,
  QrCode,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building,
  Home,
  Gift,
  Check,
  AlertCircle,
  Crown,
  Copy,
} from 'lucide-react';
import { CartItem, Language, SiteSettings, MemberAccount, MealRedemption } from '../types';
import { DuitNowPaymentCard } from './DuitNowPaymentCard';
import { getMalaysiaHolidayInfo } from '../utils/malaysiaHolidays';
import {
  getMemberReferralCode,
  findMemberByReferralCode,
  checkReferralRewardEligibility,
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
  buildOrderConfirmationAutoReply,
  buildCustomerWhatsAppAutoReplyUrl,
} from '../utils/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  language: Language;
  siteSettings: SiteSettings;
  members?: MemberAccount[];
  currentMember?: MemberAccount | null;
  onOrderCompleted: () => void;
  onOrderPlaced?: (order: MealRedemption) => void;
  onPackageOrdered?: (
    planItem: CartItem,
    customer: {
      name: string;
      phone: string;
      address: string;
      area: string;
      postalCode: string;
      address2?: string;
      area2?: string;
      postalCode2?: string;
      referralCode?: string;
    }
  ) => void;
  onOpenMemberPortal?: () => void;
  onRegisterCustomer?: (customer: {
    name: string;
    phone: string;
    address: string;
    area: string;
    postalCode: string;
    address2?: string;
    area2?: string;
    postalCode2?: string;
    password?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  language,
  siteSettings,
  members = [],
  currentMember = null,
  onOrderCompleted,
  onOrderPlaced,
  onPackageOrdered,
  onOpenMemberPortal,
  onRegisterCustomer,
}) => {
  const hasPlan = cart.some((i) => i.type === 'plan');
  const planItem = cart.find((i) => i.type === 'plan');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [area, setArea] = useState('Klang / Bukit Tinggi');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('41200');

  // Option for customer to register and buy ala carte meal directly
  const [registerAsMember, setRegisterAsMember] = useState(true);
  const [registerPassword, setRegisterPassword] = useState('123456');
  const [registeredMemberPhone, setRegisteredMemberPhone] = useState('');

  // Address 2 (one account up to 2 addresses for Klang Valley meal plans)
  const [hasAddress2, setHasAddress2] = useState(false);
  const [address2, setAddress2] = useState('');
  const [area2, setArea2] = useState('Klang / Bukit Tinggi');
  const [postalCode2, setPostalCode2] = useState('41200');

  // Member Referral Code system
  const [referralCodeInput, setReferralCodeInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref') || '';
    }
    return '';
  });
  const [appliedReferralMember, setAppliedReferralMember] = useState<MemberAccount | null>(null);
  const [referralError, setReferralError] = useState('');

  // Prefill member details if logged in
  useEffect(() => {
    if (currentMember) {
      if (!name) setName(currentMember.name || '');
      if (!phone) setPhone(currentMember.phone || '');
      if (!address) setAddress(currentMember.address || '');
      if (currentMember.area) setArea(currentMember.area);
      if (currentMember.postalCode) setPostalCode(currentMember.postalCode);
      if (currentMember.address2) {
        setHasAddress2(true);
        setAddress2(currentMember.address2);
        if (currentMember.area2) setArea2(currentMember.area2);
        if (currentMember.postalCode2) setPostalCode2(currentMember.postalCode2);
      }
    }
  }, [currentMember]);

  // Auto-validate referral code on mount if query param exists or entered
  useEffect(() => {
    if (referralCodeInput && members && members.length > 0 && !appliedReferralMember) {
      validateAndApplyReferral(referralCodeInput);
    }
  }, [members]);

  const validateAndApplyReferral = (codeToTest: string) => {
    const raw = codeToTest.trim();
    if (!raw) {
      setAppliedReferralMember(null);
      setReferralError('');
      return;
    }

    if (!members || members.length === 0) {
      return;
    }

    const matched = findMemberByReferralCode(members, raw);
    if (!matched) {
      setAppliedReferralMember(null);
      setReferralError(
        language === 'en'
          ? 'Referral code not found. Please verify with your friend.'
          : '未找到该推荐码，请与好友核对。'
      );
      return;
    }

    // Check if self-referral
    const userPhoneClean = (phone || currentMember?.phone || '').replace(/\D/g, '');
    const matchedPhoneClean = (matched.phone || '').replace(/\D/g, '');
    if (
      matched.id === currentMember?.id ||
      (userPhoneClean && userPhoneClean === matchedPhoneClean)
    ) {
      setAppliedReferralMember(null);
      setReferralError(
        language === 'en'
          ? 'You cannot use your own referral code.'
          : '不能使用您自己的推荐码。'
      );
      return;
    }

    setAppliedReferralMember(matched);
    setReferralError('');
  };

  const [deliveryDate, setDeliveryDate] = useState(() => {
    // Next available active delivery workday (Monday - Friday, excluding admin/bank holiday off dates)
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 30; i++) {
      const day = d.getDay();
      const str = d.toISOString().split('T')[0];
      if (day !== 0 && day !== 6 && !siteSettings.disabledDeliveryDates?.includes(str)) {
        return str;
      }
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  });

  const [deliverySlot, setDeliverySlot] = useState<'Lunch (10:00 AM – 2:00 PM)' | 'Dinner (3:00 PM – 7:00 PM)' | 'Both Lunch & Dinner'>(
    'Lunch (10:00 AM – 2:00 PM)'
  );
  const [paymentMethod, setPaymentMethod] = useState<'duitnow' | 'whatsapp'>('duitnow');
  const [notes, setNotes] = useState('');

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  if (!isOpen) return null;

  const handleCopyOrderNo = () => {
    if (orderId && navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2500);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Standardized delivery fee: RM15 for order < RM100; FREE on RM100 and above or meal packages
  const deliveryFee = hasPlan ? 0 : subtotal >= 100 ? 0 : 15.0;
  const grandTotal = subtotal + deliveryFee;

  const planPrice = planItem ? (planItem.price || planItem.planDetails?.basePrice || 0) : 0;
  const cleanCustomerPhone = phone.replace(/\D/g, '');
  const isExistingAccount = Boolean(
    currentMember ||
    (members && members.some((m) => m.phone.replace(/\D/g, '') === cleanCustomerPhone))
  );
  const isNewAccount = !isExistingAccount;
  const isPlanPriceEligible = planPrice >= MIN_REFERRAL_PLAN_PRICE;
  const isReferralEligible = Boolean(appliedReferralMember) && isNewAccount && isPlanPriceEligible;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert(language === 'en' ? 'Please complete all required fields.' : '请填写完整联系信息与送餐地址。');
      return;
    }

    const phoneErr = getMalaysianPhoneError(phone, language);
    if (phoneErr) {
      setPhoneError(phoneErr);
      alert(phoneErr);
      return;
    }
    const cleanPhone = normalizeMalaysianPhone(phone);

    if (siteSettings.disabledDeliveryDates?.includes(deliveryDate)) {
      const hol = getMalaysiaHolidayInfo(deliveryDate);
      alert(
        language === 'en'
          ? hol
            ? `🇲🇾 Notice: ${deliveryDate} is a Malaysia Bank Public Holiday (${hol.nameEn}). Delivery is turned off. Please select another delivery date.`
            : `⚠️ Notice: Selected date (${deliveryDate}) has been turned off by kitchen administration. Please select another date.`
          : hol
            ? `🇲🇾 提示：${deliveryDate} 为马来西亚银行法定公假（${hol.nameZh}），后厨暂停配送。请选择其他工作日。`
            : `⚠️ 提示：所选日期 (${deliveryDate}) 后厨已暂停配送，请选择其他日期。`
      );
      return;
    }

    // Generate unique order number (format CH-YYMMDD-XXXX e.g. CH-261006-8492)
    const generatedId = generateUniqueOrderNumber('CH');
    setOrderId(generatedId);

    // Save order record for Back End Office tracking
    const itemsSummaryText = hasPlan
      ? (planItem?.title || 'Meal Plan Package')
      : cart.map((c) => `${c.title} x${c.quantity}`).join(', ');

    const newOrderRecord: MealRedemption = {
      id: generatedId,
      orderNumber: generatedId,
      orderType: hasPlan ? 'Package Subscription' : 'Ala Carte Bento',
      memberId: cleanPhone,
      memberName: name.trim(),
      memberPhone: cleanPhone,
      deliveryDate: hasPlan
        ? (planItem?.planDetails?.days ? `${planItem.planDetails.days}-Day Plan` : deliveryDate)
        : deliveryDate,
      deliverySlot: deliverySlot,
      deliveryAddress: address.trim(),
      area,
      postalCode: postalCode.trim(),
      mealId: hasPlan ? (planItem?.cartItemId || 'plan') : (cart[0]?.cartItemId || 'alacarte'),
      mealName: hasPlan ? (planItem?.title || 'Meal Plan') : (cart[0]?.title || 'Ala Carte Bento'),
      mealNameZh: hasPlan
        ? (planItem?.titleZh || '健康餐饮配套')
        : cart.map((c) => `${c.titleZh || c.title} x${c.quantity}`).join('，'),
      mealImage: hasPlan ? (planItem?.image || '') : (cart[0]?.image || ''),
      quantity: hasPlan ? 1 : cart.reduce((s, c) => s + c.quantity, 0),
      totalAmount: grandTotal,
      paymentMethod: paymentMethod === 'duitnow' ? 'DuitNow QR' : 'WhatsApp Direct Pay',
      itemsSummary: itemsSummaryText,
      status: 'Pending',
      dietaryNotes: notes,
      createdAt: new Date().toISOString(),
      recipeStandard: hasPlan ? 'Standard Chef Recipe' : 'Customized Ala Carte',
      autoReplySent: false,
    };

    if (onOrderPlaced) {
      onOrderPlaced(newOrderRecord);
    }

    // If package order, trigger package provision
    if (hasPlan && planItem && onPackageOrdered) {
      onPackageOrdered(planItem, {
        name,
        phone: cleanPhone,
        address,
        area,
        postalCode,
        address2: hasAddress2 ? address2 : undefined,
        area2: hasAddress2 ? area2 : undefined,
        postalCode2: hasAddress2 ? postalCode2 : undefined,
        referralCode: appliedReferralMember
          ? getMemberReferralCode(appliedReferralMember)
          : (referralCodeInput.trim().toUpperCase() || undefined),
      });
      setRegisteredMemberPhone(cleanPhone);
    } else if (registerAsMember && !currentMember && onRegisterCustomer) {
      // Option for customer to register and buy ala carte meal directly
      onRegisterCustomer({
        name: name.trim(),
        phone: cleanPhone,
        address: address.trim(),
        area,
        postalCode: postalCode.trim(),
        address2: hasAddress2 && address2.trim() ? address2.trim() : undefined,
        area2: hasAddress2 && address2.trim() ? area2 : undefined,
        postalCode2: hasAddress2 && address2.trim() ? postalCode2.trim() : undefined,
        password: registerPassword.trim() || '123456',
      });
      setRegisteredMemberPhone(cleanPhone);
    }

    // Prepare WhatsApp Message to official number +60126189919
    const whatsappLinkNumber = '60126189919';

    if (hasPlan && planItem) {
      const msg =
        `*📣 Confirm Order | 订单确认* %0A` +
        `感谢您下单我们的【潮轻食健康配套】❤️%0A` +
        `Thank you for choosing our Chill Healthy Meal Plan!%0A%0A` +
        `*Order ID:* ${generatedId}%0A` +
        `*Registered Name (注册姓名):* ${name}%0A` +
        `*Phone (联系电话):* ${phone}%0A` +
        `*Package (所选配套):* ${planItem.title}%0A` +
        `*Delivery Slot (送餐时段):* ${deliverySlot}%0A` +
        `*Total Amount (总额):* RM ${grandTotal.toFixed(2)}%0A` +
        `*Delivery Address 1 (地址一):* ${address}, ${area} ${postalCode}%0A` +
        (hasAddress2 && address2 ? `*Delivery Address 2 (地址二):* ${address2}, ${area2} ${postalCode2}%0A` : '') +
        (appliedReferralMember
          ? `*Referral Code (推荐人邀请码):* ${getMemberReferralCode(appliedReferralMember)} (Referrer: ${appliedReferralMember.name})%0A` +
            (isReferralEligible
              ? `*Referral Reward (推荐免单奖励):* ${appliedReferralMember.name} receives +1 Free Meal Credit upon confirmation of this RM${planPrice.toFixed(0)} new account meal plan!%0A`
              : !isNewAccount
              ? `*Referral Note (推荐提示):* Existing account. Referral free meal bonus applies to new account registrations only.%0A`
              : `*Referral Note (推荐提示):* Current plan is RM${planPrice.toFixed(0)}. Referral free meal bonus applies to new account plans RM398 and above (e.g. 20-Day Plan).%0A`)
          : referralCodeInput.trim()
          ? `*Referral Code (推荐码):* ${referralCodeInput.trim().toUpperCase()}%0A`
          : '') +
        (notes ? `*Dietary Notes (忌口备注):* ${notes}%0A` : '') +
        (paymentMethod === 'duitnow'
          ? `*Payment Method:* DuitNow QR (Chill Healthy Trading)%0A已完成付款，附上付款水单！请为我确认配套，开启每日订餐权限！🥗%0A`
          : `*Payment Method:* WhatsApp Direct Pay%0A已提交配套订单，请提供转账方式/DuitNow QR，协助开通订餐！🥗%0A`) +
        `Website: www.chill-healthy.com`;

      if (paymentMethod === 'whatsapp') {
        window.open(`https://wa.me/${whatsappLinkNumber}?text=${msg}`, '_blank');
      }
    } else {
      const itemsText = cart
        .map((item) => `- ${item.title} x${item.quantity} (RM ${(item.price * item.quantity).toFixed(2)})`)
        .join('%0A');

      const paymentMethodText =
        paymentMethod === 'duitnow'
          ? `*Payment:* DuitNow QR (Chill Healthy Trading)%0A已完成付款，附上付款凭证水单，请查收并安排配送！🥗`
          : `*Payment:* WhatsApp Direct Pay%0A已提交单点餐品订单，请向我发送付款转账方式 / DuitNow QR 收款码，谢谢！🥗`;

      const msg =
        `*📣 New Ala Carte Order: ${generatedId} | 单点外卖订单*%0A` +
        `Customer (顾客姓名): ${name}%0A` +
        `Phone (手机号码): ${phone}%0A` +
        (registerAsMember || currentMember || registeredMemberPhone
          ? `Member Status: Registered Member (${cleanPhone})%0A`
          : '') +
        `Type: Fresh Bento Delivery%0A` +
        `Date: ${deliveryDate} | Slot: ${deliverySlot}%0A` +
        `Address 1: ${address}, ${area} ${postalCode}%0A` +
        (hasAddress2 && address2 ? `Address 2: ${address2}, ${area2} ${postalCode2}%0A` : '') +
        `Items (单点餐品):%0A${itemsText}%0A` +
        `Subtotal: RM ${subtotal.toFixed(2)}%0A` +
        `Delivery Fee: ${deliveryFee === 0 ? 'FREE (≥RM100)' : 'RM 15.00 (<RM100)'}%0A` +
        `*Total Amount: RM ${grandTotal.toFixed(2)}*%0A` +
        (notes ? `Notes (忌口备注): ${notes}%0A` : '') +
        `${paymentMethodText}%0A` +
        `Website: www.chill-healthy.com`;

      if (paymentMethod === 'whatsapp') {
        window.open(`https://wa.me/${whatsappLinkNumber}?text=${msg}`, '_blank');
      }
    }

    setOrderSuccess(true);
  };

  const handleFinish = () => {
    onOrderCompleted();
    onClose();
  };

  const whatsappLinkNumber = '60126189919';

  const registeredOrEnteredPhone = registeredMemberPhone || normalizeMalaysianPhone(phone) || phone;

  const itemsListForWA = cart
    .map((item) => `• ${item.title} x${item.quantity} (RM ${(item.price * item.quantity).toFixed(2)})`)
    .join('%0A');

  const customerAutoReplyUrl = buildCustomerWhatsAppAutoReplyUrl(registeredOrEnteredPhone, {
    orderNumber: orderId,
    customerName: name.trim() || (language === 'en' ? 'Valued Customer' : '尊敬的顾客'),
    customerPhone: registeredOrEnteredPhone,
    items: hasPlan
      ? (planItem?.title || 'Meal Plan Package')
      : cart.map((c) => `• ${c.title} x${c.quantity} (RM ${(c.price * c.quantity).toFixed(2)})`).join('\n'),
    deliveryDate: hasPlan ? (planItem?.planDetails?.days ? `${planItem.planDetails.days}-Day Plan` : deliveryDate) : deliveryDate,
    deliverySlot: deliverySlot,
    deliveryAddress: `${address}, ${area} ${postalCode}`,
    totalAmount: grandTotal,
    paymentMethod: paymentMethod === 'duitnow' ? 'DuitNow QR' : 'WhatsApp Direct Pay',
    dietaryNotes: notes,
    orderType: hasPlan ? 'Package Subscription' : 'Ala Carte Bento',
  });

  const confirmOrderWhatsAppMessage =
    `*📣 Confirm Order | 订单付款凭单确认*%0A` +
    `感谢您下单我们的【潮轻食健康餐】❤️%0A` +
    `*Order ID:* ${orderId}%0A` +
    `*Registered Name (注册姓名):* ${name}%0A` +
    `*Phone (联系电话):* ${phone}%0A` +
    (registerAsMember || currentMember || registeredMemberPhone
      ? `*Member Account:* Registered Member (${registeredMemberPhone || normalizeMalaysianPhone(phone)})%0A`
      : '') +
    (planItem
      ? `*Package (所选配套):* ${planItem.title}%0A`
      : `*Items (所选单点餐盒):*%0A${itemsListForWA}%0A`) +
    (appliedReferralMember
      ? `*Referral Code (推荐人邀请码):* ${getMemberReferralCode(appliedReferralMember)} (${appliedReferralMember.name})%0A`
      : referralCodeInput.trim()
      ? `*Referral Code (推荐码):* ${referralCodeInput.trim().toUpperCase()}%0A`
      : '') +
    `*Delivery Date (送餐日期):* ${deliveryDate}%0A` +
    `*Delivery Slot (送餐时段):* ${deliverySlot}%0A` +
    `*Delivery Address (送达地址):* ${address}, ${area} ${postalCode}%0A` +
    (hasAddress2 && address2 ? `*Address 2:* ${address2}, ${area2} ${postalCode2}%0A` : '') +
    `*Total Due (结账总额):* RM ${grandTotal.toFixed(2)}%0A` +
    (paymentMethod === 'duitnow'
      ? `已通过 DuitNow QR 付款给 Chill Healthy Trading，附上付款凭单水单截图，请协助确认！🥗`
      : `已选择 WhatsApp Direct Pay，请协助提供转账方式 / DuitNow QR 收款码完成付款，谢谢！🥗`);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {orderSuccess ? (
          /* =========================================================================
             ORDER SUCCESS: EXACT STEP 1 -> STEP 2 -> STEP 3 CONFIRMATION
             ========================================================================= */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                {language === 'en' ? 'Step 1 Completed · Order Placed' : '第一步已完成 · 订单成功提交'}
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                {language === 'en' ? 'Thank You for Choosing CHILL Healthy!' : '感谢您下单【潮轻食健康配套】❤️'}
              </h2>
            </div>

            {/* Dedicated Unique Order Tracking Number Highlight Card */}
            <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                    {language === 'en' ? 'Unique Order Tracking No.' : '专属订单跟踪编号'}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {hasPlan ? (language === 'en' ? 'Meal Plan' : '健康餐配套') : (language === 'en' ? 'Ala Carte' : '单点外卖')}
                  </span>
                </div>
                <p className="font-mono font-black text-2xl sm:text-3xl text-emerald-950 mt-1 tracking-tight select-all">
                  #{orderId}
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {language === 'en'
                    ? 'Use this unique order number for all back-end kitchen tracking & delivery verification.'
                    : '后厨与系统管理后台均以此唯一编号核对，客户与客服可凭此快速查询追踪。'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyOrderNo}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                title="Copy Order Number"
              >
                {copiedOrderNo ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOrderNo ? (language === 'en' ? 'Copied!' : '已复制！') : (language === 'en' ? 'Copy Order No.' : '复制订单编号')}</span>
              </button>
            </div>

            {hasPlan ? (
              /* 3-Step Guide for Package Buyers */
              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 text-left space-y-4">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-2">
                  {language === 'en' ? 'Next Steps to Start Your Daily Meals:' : '开启每日选餐 3 步骤：'}
                </div>

                {/* Step 1 Check */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">
                      {language === 'en' ? 'Step 1 | Meal Plan Selected & Paid' : '第一步 | 选择配套并完成付款'}
                    </p>
                    <p className="text-stone-500 mt-0.5">
                      {planItem?.title} · RM {grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Step 2 WhatsApp */}
                <div className="flex items-start gap-3 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-emerald-950">
                      {paymentMethod === 'duitnow'
                        ? language === 'en'
                          ? 'Step 2 | WhatsApp Payment Slip & Name'
                          : '第二步 | 付款后 WhatsApp 发送凭证水单'
                        : language === 'en'
                        ? 'Step 2 | WhatsApp to Us for Payment Mode'
                        : '第二步 | WhatsApp 联系客服获取付款方式'}
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      {paymentMethod === 'duitnow'
                        ? language === 'en'
                          ? `After payment, kindly send your receipt/slip via WhatsApp to +60126189919 with your name "${name}" so our kitchen team can activate your account.`
                          : `DuitNow 付款后，请将付款凭单截图发送到官方 WhatsApp (+60126189919)，附上注册名字「${name}」，以便我们立即为您开启订餐权限。`
                        : language === 'en'
                        ? `Kindly WhatsApp +60126189919 to obtain payment transfer details or QR code to confirm your plan order.`
                        : `请通过 WhatsApp (+60126189919) 联系客服获取银行转账资料或 DuitNow QR 收款码以确认配套。`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <a
                        href={`https://wa.me/${whatsappLinkNumber}?text=${confirmOrderWhatsAppMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{paymentMethod === 'duitnow' ? (language === 'en' ? 'Send Slip to Shop WhatsApp (+60126189919)' : '发水单至官方 WhatsApp (+60126189919)') : (language === 'en' ? 'WhatsApp Shop for Payment (+60126189919)' : 'WhatsApp 联系客服获取付款方式 (+60126189919)')}</span>
                      </a>

                      <a
                        href={customerAutoReplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Auto reply to registered number"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? `Auto-Reply to My WhatsApp (${registeredOrEnteredPhone})` : `接收确认回执至我的 WhatsApp (${registeredOrEnteredPhone})`}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 3 Confirmation */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">
                      {language === 'en' ? 'Step 3 | Order Confirmation & Daily Meal Selection' : '第三步 | 确认配套并开始自选餐点'}
                    </p>
                    <p className="text-stone-500 mt-0.5">
                      {language === 'en'
                        ? 'Once confirmed, select your meals daily before 5:00 PM for lunch (10:00 AM – 2:00 PM) or dinner (3:00 PM – 7:00 PM).'
                        : '确认配套后，即可自选每天午餐（10:00 AM – 2:00 PM）或晚餐（3:00 PM – 7:00 PM），前一天下午 5:00 前选定。'}
                    </p>
                  </div>
                </div>

                {/* Referral Attribution Notice */}
                {appliedReferralMember && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Gift className="w-4 h-4 text-amber-600" />
                      <span>
                        {isReferralEligible
                          ? (language === 'en' ? '🎁 Referral Reward Activated (+1 Free Meal Credit)!' : '🎁 好友推荐奖励已生效 (+1份免费餐券)！')
                          : (language === 'en' ? '🤝 Referrer Linked' : '🤝 推荐人已关联')}
                      </span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {isReferralEligible
                        ? (language === 'en'
                            ? `Your referrer ${appliedReferralMember.name} (${getMemberReferralCode(appliedReferralMember)}) will receive 1 Free Meal Credit added to their account once this new account order (RM${planPrice.toFixed(0)}) is confirmed.`
                            : `您的推荐人 ${appliedReferralMember.name}（推荐码：${getMemberReferralCode(appliedReferralMember)}）在此新账户配套订单（RM${planPrice.toFixed(0)}）确认后，将自动获赠 1 份免费餐券！`)
                        : !isNewAccount
                        ? (language === 'en'
                            ? `Referrer ${appliedReferralMember.name} is linked to your order. Note: Referral free meal credit is exclusively awarded for new account sign-ups.`
                            : `已关联推荐人 ${appliedReferralMember.name}。提示：推荐免单餐券仅限新用户首次注册新账户时生效。`)
                        : (language === 'en'
                            ? `Referrer ${appliedReferralMember.name} is linked to your order. Note: Free meal credit requires subscribing to a plan of RM${MIN_REFERRAL_PLAN_PRICE} and above (current plan: RM${planPrice.toFixed(0)}).`
                            : `已关联推荐人 ${appliedReferralMember.name}。提示：推荐免单餐券仅限订购 RM${MIN_REFERRAL_PLAN_PRICE} 及以上配套（当前配套：RM${planPrice.toFixed(0)}）。`)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* 3-Step Guide for Ala Carte Bento Buyers (Same seamless experience as per membership) */
              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 text-left space-y-4">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-2">
                  {language === 'en' ? 'Order Details & Next Steps:' : '单点外卖订单明细与后续步骤：'}
                </div>

                {/* Step 1 Check */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-stone-900">
                      {language === 'en' ? 'Step 1 | Ala Carte Order Placed & Payment Method Selected' : '第一步 | 单点订单已提交 · 付款方式已选定'}
                    </p>
                    <div className="mt-1 space-y-1 text-stone-600">
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'Delivery Date & Slot:' : '送达日期与时段:'}</span>
                        <span className="font-bold text-stone-900">{deliveryDate} · {deliverySlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'Delivery Address:' : '送达地址:'}</span>
                        <span className="font-bold text-stone-900 text-right">{address}, {area} {postalCode}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-stone-900">
                        <span>{language === 'en' ? 'Total Amount Due:' : '支付金额:'}</span>
                        <span className="text-emerald-800 font-heading text-sm">RM {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 WhatsApp / Payment Mode */}
                <div className="flex items-start gap-3 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-emerald-950">
                      {paymentMethod === 'duitnow'
                        ? language === 'en'
                          ? 'Step 2 | WhatsApp Payment Slip & Name'
                          : '第二步 | 付款后 WhatsApp 发送凭证水单'
                        : language === 'en'
                        ? 'Step 2 | WhatsApp to Us for Payment Mode'
                        : '第二步 | WhatsApp 联系客服确认付款方式'}
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      {paymentMethod === 'duitnow'
                        ? language === 'en'
                          ? `After DuitNow QR payment, kindly WhatsApp your slip to +60126189919 with your name "${name}" so our kitchen team can verify and dispatch immediately.`
                          : `DuitNow QR 付款后，请将付款凭单截图发送到官方 WhatsApp (+60126189919)，附上名字「${name}」，以便厨房核验并安排即时制作配送。`
                        : language === 'en'
                        ? `Kindly WhatsApp +60126189919 to obtain payment instructions or DuitNow QR code for your ala carte meal.`
                        : `请点击下方直接发送 WhatsApp 至官方客服 (+60126189919)，索取付款转账方式或 DuitNow QR 收款码完成付款。`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <a
                        href={`https://wa.me/${whatsappLinkNumber}?text=${confirmOrderWhatsAppMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{paymentMethod === 'duitnow' ? (language === 'en' ? 'Send Slip to Shop WhatsApp (+60126189919)' : '发水单至官方 WhatsApp (+60126189919)') : (language === 'en' ? 'WhatsApp Shop for Payment Mode (+60126189919)' : 'WhatsApp 联系客服确认付款方式 (+60126189919)')}</span>
                      </a>

                      <a
                        href={customerAutoReplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Auto reply to registered number"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? `Auto-Reply to My WhatsApp (${registeredOrEnteredPhone})` : `接收确认回执至我的 WhatsApp (${registeredOrEnteredPhone})`}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 3 Kitchen Preparation */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">
                      {language === 'en' ? 'Step 3 | Fresh Preparation & Scheduled Delivery' : '第三步 | 厨房现做鲜食并准时配送'}
                    </p>
                    <p className="text-stone-500 mt-0.5">
                      {language === 'en'
                        ? `Chef prepares freshly cooked meal boxes for delivery on ${deliveryDate} during ${deliverySlot}.`
                        : `后厨将于 ${deliveryDate} 送餐时段（${deliverySlot}）准时鲜烹并由专属配送车队送达。`}
                    </p>
                  </div>
                </div>

                {/* Member Account Created Notice if registered */}
                {(registerAsMember || currentMember || registeredMemberPhone) && (
                  <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-left text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                      <Crown className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'en' ? '🎉 Member Account Linked & Active!' : '🎉 会员账户已建立/已关联！'}</span>
                    </div>
                    <p className="text-emerald-900 text-[11px] leading-relaxed">
                      {language === 'en'
                        ? `Your eligible Malaysian mobile number (${registeredMemberPhone || normalizeMalaysianPhone(phone)}) is your official Member ID (Default password: 123456). You can access the Member Portal anytime to track deliveries or upgrade to a meal plan!`
                        : `您的马来西亚手机号（${registeredMemberPhone || normalizeMalaysianPhone(phone)}）已作为官方会员登录账号（初始密码：123456）。您可随时进入会员中心查看历史订单、保存地址或随时升级周期配套！`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onOpenMemberPortal && (hasPlan || registerAsMember || currentMember || registeredMemberPhone) ? (
                <button
                  onClick={() => {
                    handleFinish();
                    onOpenMemberPortal();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {hasPlan
                      ? language === 'en'
                        ? 'Go to Member Portal to Select Daily Meals'
                        : '进入会员中心挑选每天餐点'
                      : language === 'en'
                      ? 'Go to Member Portal Dashboard'
                      : '进入会员中心查看账户'}
                  </span>
                </button>
              ) : null}

              <button
                onClick={handleFinish}
                className="py-3.5 px-6 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Return to Home' : '返回首页'}
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             CHECKOUT FORM: ORDERING DETAILS & 2-ADDRESS SUPPORT
             ========================================================================= */
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4 max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-heading text-xl font-extrabold text-stone-900">
                  {hasPlan
                    ? language === 'en'
                      ? 'Meal Package Order & Registration'
                      : '健康餐配套订购与配送资料'
                    : language === 'en'
                    ? 'Delivery & Order Details'
                    : '填写配送信息与结账'}
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {hasPlan
                  ? language === 'en'
                    ? 'Free delivery across Klang Valley · 1 account supports up to 2 addresses'
                    : '巴生谷全免运费 · 一个户口支持两个送餐地址（办公室/住家）'
                  : language === 'en'
                  ? 'Standard delivery fee RM15 for orders below RM100 · FREE on orders RM100 and above!'
                  : '未满RM100统一运费RM15 · 满RM100全巴生谷免运费！'}
              </p>
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'en' ? 'Your Registered Name *' : '注册姓名 (将用于WhatsApp核对) *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agnes Lim"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 block">
                    {language === 'en' ? 'Malaysian Handphone / WhatsApp *' : '马来西亚手机号码 / WhatsApp *'}
                  </label>
                  {phone && (
                    <span className="text-[10px] font-bold">
                      {isValidMalaysianHandphone(phone) ? (
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
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="e.g. 012-618 9919"
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${
                    phone && !isValidMalaysianHandphone(phone)
                      ? 'border-amber-400 bg-amber-50/40 text-stone-900'
                      : 'border-stone-200 text-stone-900'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold`}
                />
                {phoneError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Member Account / Registration option (for customer buying ala carte or new to membership) */}
            {!currentMember ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-300 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={registerAsMember}
                    onChange={(e) => setRegisterAsMember(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {language === 'en'
                        ? 'Register as Member with this phone number (Free Membership)'
                        : '同时注册为潮轻食会员 (免费入会 · 自动保存地址 · 手机号一键登录)'}
                    </span>
                  </span>
                </label>
                {registerAsMember && (
                  <div className="pl-6 text-[11px] text-stone-600 space-y-1">
                    <p>
                      {language === 'en'
                        ? '💡 Your Malaysian handphone number will be your official Member Login ID (Default password: 123456). Accounts start with 0 meals so you can freely order ala carte or subscribe to a meal plan anytime!'
                        : '💡 您的有效马来西亚手机号将自动作为会员登录账号（初始默认密码：123456）。账号初始0餐，既可随时单点外卖，也可随时升级周期餐包享天天免运！'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  {language === 'en' ? 'Logged in as Member:' : '已以会员身份登录：'}{' '}
                  <strong>{currentMember.name}</strong> ({currentMember.memberNumber || currentMember.phone})
                </span>
              </div>
            )}

            {/* Delivery Address 1 (Main: Office or Home) */}
            <div className="space-y-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'en' ? 'Address 1 (Office / Main Address) *' : '送餐地址一 (办公室 / 主地址) *'}</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  {hasPlan || subtotal >= 100
                    ? (language === 'en' ? 'Free Delivery' : '免运费')
                    : (language === 'en' ? 'Fee RM 15' : '运费 RM 15')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-stone-600 block mb-1">
                    {language === 'en' ? 'Area / City *' : '区域 / 城市 *'}
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
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
                  <label className="text-[11px] font-medium text-stone-600 block mb-1">
                    {language === 'en' ? 'Postal Code *' : '邮区编号 *'}
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 41200"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  {language === 'en' ? 'Detailed Street / Building / Floor / Unit *' : '详细地址 (公司大厦/楼层/门牌号) *'}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Level 10, Menara Symphony, Jalan Kemuning Prima"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                />
              </div>

              {/* Optional Address 2 (1 account 2 addresses) */}
              <div className="pt-2 border-t border-stone-200/80">
                {!hasAddress2 ? (
                  <button
                    type="button"
                    onClick={() => setHasAddress2(true)}
                    className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? '+ Add Address 2 (Home / Secondary)' : '+ 添加第二地址 (住家/备用送餐点)'}</span>
                  </button>
                ) : (
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'en' ? 'Address 2 (Home / Secondary)' : '送餐地址二 (住家/备用送餐点)'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasAddress2(false)}
                        className="text-[11px] text-stone-400 hover:text-red-600"
                      >
                        {language === 'en' ? 'Remove' : '移除'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={area2}
                          onChange={(e) => setArea2(e.target.value)}
                          placeholder="Area (e.g. Klang Botanic)"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          maxLength={5}
                          value={postalCode2}
                          onChange={(e) => setPostalCode2(e.target.value.replace(/\D/g, ''))}
                          placeholder="Postal Code"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Home address: Unit, Condo, Street..."
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Schedule notice: Lunch & Dinner Available */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'en' ? 'First Delivery Date' : '首送生效日期'}</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white"
                />
                {siteSettings.disabledDeliveryDates?.includes(deliveryDate) && (() => {
                  const hol = getMalaysiaHolidayInfo(deliveryDate);
                  return (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        {language === 'en'
                          ? hol
                            ? `🇲🇾 Notice: ${deliveryDate} is a Malaysia Bank Public Holiday (${hol.nameEn}). Delivery is turned off. Please select another workday.`
                            : `⚠️ Notice: ${deliveryDate} is turned off by kitchen administration. Please select another date.`
                          : hol
                            ? `🇲🇾 提示：${deliveryDate} 为马来西亚银行法定公假（${hol.nameZh}），已暂停配送。请选择其他工作日。`
                            : `⚠️ 提示：${deliveryDate} 已暂停配送，请选择其他配送日期。`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'en' ? 'Delivery Slot (Lunch / Dinner) *' : '送餐时段 (午餐 / 晚餐) *'}</span>
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) =>
                    setDeliverySlot(
                      e.target.value as 'Lunch (10:00 AM – 2:00 PM)' | 'Dinner (3:00 PM – 7:00 PM)' | 'Both Lunch & Dinner'
                    )
                  }
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800"
                >
                  <option value="Lunch (10:00 AM – 2:00 PM)">
                    🍱 {language === 'en' ? 'Lunch (10:00 AM – 2:00 PM)' : '午餐配送 (10:00 AM – 2:00 PM)'}
                  </option>
                  <option value="Dinner (3:00 PM – 7:00 PM)">
                    🍲 {language === 'en' ? 'Dinner (3:00 PM – 7:00 PM)' : '晚餐配送 (3:00 PM – 7:00 PM)'}
                  </option>
                  <option value="Both Lunch & Dinner">
                    🍱🍲 {language === 'en' ? 'Both Lunch & Dinner (Split)' : '午餐与晚餐分批送达'}
                  </option>
                </select>
              </div>
            </div>

            {/* Dietary notes */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                {language === 'en' ? 'Dietary Restrictions / 3-Highs Health Notes' : '健康关怀与忌口备注 (如三高/少盐/不吃海鲜)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'e.g. Low sodium, no spicy, diabetic-friendly rice option'
                    : '例如：少油盐、三高忌糖、不吃辣、酱料分开'
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
              />
            </div>

            {/* 🎁 Member Referral Code Input Section */}
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-300/70 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>
                    {language === 'en' ? "Friend's Referral Code (Optional)" : '好友推荐邀请码 (可选)'}
                  </span>
                </label>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                  {language === 'en' ? 'New Account · Plan RM398+ Only' : '新账户 · 限 RM398 及以上配套'}
                </span>
              </div>

              <p className="text-[11px] text-stone-600 leading-snug">
                {language === 'en'
                  ? 'Referred by a friend or colleague? Enter their referral code. When signing up for a new account with a plan of RM398 and above (e.g. 20-Day Lifestyle Plan or Multi-Person Plans), 1 Free Meal Credit is awarded to your referrer!'
                  : '受好友或同事推荐订餐？输入好友的专属推荐码或手机号。新账户首次注册订购 RM398 及以上餐食配套（如20天月度计划或多人套餐），推荐人即可获赠 1 份免费餐券！'}
              </p>

              {/* Plan price threshold hint */}
              {hasPlan && !isPlanPriceEligible && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
                  {language === 'en'
                    ? `💡 Note: Current plan is RM ${planPrice.toFixed(0)}. Referral free meal reward activates on plans RM398 and above (e.g. 20-Day Transformation Plan RM398).`
                    : `💡 提示：当前配套为 RM ${planPrice.toFixed(0)}。推荐免费餐券仅在订购 RM398 及以上配套（如20天月度计划 RM398）时生效。`}
                </div>
              )}

              {/* Existing account hint */}
              {!isNewAccount && (
                <div className="text-[11px] text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-xl">
                  {language === 'en'
                    ? '💡 Note: You are ordering with an existing account. Referral free meal reward is reserved for new account first-time sign-ups.'
                    : '💡 提示：您正在使用已有会员账户订餐。推荐免费餐券仅适用于新用户首次注册的新账户。'}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setReferralCodeInput(val);
                    if (!val) {
                      setAppliedReferralMember(null);
                      setReferralError('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      validateAndApplyReferral(referralCodeInput);
                    }
                  }}
                  placeholder={
                    language === 'en'
                      ? 'e.g. CHILL-AGNES9919 or 0126189919'
                      : '例如：CHILL-AGNES9919 或好友手机号'
                  }
                  className="flex-1 text-xs uppercase tracking-wider font-mono font-bold px-3 py-2 rounded-xl border border-stone-300 bg-white placeholder:font-normal placeholder:tracking-normal focus:outline-hidden focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => validateAndApplyReferral(referralCodeInput)}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                >
                  {language === 'en' ? 'Apply Code' : '验证推荐码'}
                </button>
              </div>

              {/* Referral verification feedback */}
              {appliedReferralMember && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
                    isReferralEligible
                      ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${
                        isReferralEligible ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    />
                    <span>
                      {isReferralEligible ? (
                        language === 'en' ? (
                          <>
                            🎉 <strong>Eligible for Free Meal!</strong> Referred by{' '}
                            <strong className="text-emerald-900">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · 1 Free Meal Credit will be
                            credited to them!
                          </>
                        ) : (
                          <>
                            🎉 <strong>符合免单资格！</strong>推荐人：
                            <strong className="text-emerald-900">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · 订单确认后自动送 1 份免费餐券！
                          </>
                        )
                      ) : !isNewAccount ? (
                        language === 'en' ? (
                          <>
                            Referred by{' '}
                            <strong className="text-amber-950">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · <em>Existing Account (Free meal applies to new sign-ups only)</em>
                          </>
                        ) : (
                          <>
                            推荐人：<strong className="text-amber-950">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · <em>已有账户（免单奖励仅限新账户注册）</em>
                          </>
                        )
                      ) : (
                        language === 'en' ? (
                          <>
                            Referred by{' '}
                            <strong className="text-amber-950">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · <em>Plan is RM{planPrice.toFixed(0)} (Free meal requires RM398+ plan)</em>
                          </>
                        ) : (
                          <>
                            推荐人：<strong className="text-amber-950">{appliedReferralMember.name}</strong> (
                            {getMemberReferralCode(appliedReferralMember)}) · <em>当前配套 RM{planPrice.toFixed(0)}（免单需 RM398+ 配套）</em>
                          </>
                        )
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReferralCodeInput('');
                      setAppliedReferralMember(null);
                      setReferralError('');
                    }}
                    className="text-[11px] text-stone-500 hover:text-red-700 font-bold underline cursor-pointer shrink-0"
                  >
                    {language === 'en' ? 'Remove' : '取消'}
                  </button>
                </div>
              )}

              {referralError && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <span>⚠️ {referralError}</span>
                </p>
              )}
            </div>

            {/* Payment Method: Enforce DuitNow QR with WhatsApp confirmation, NO bank transfer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 block">
                  {language === 'en' ? 'Payment Method *' : '结账付款方式 *'}
                </label>
                <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                  {language === 'en' ? 'DuitNow QR Instant Pay' : '推荐使用 DuitNow QR'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('duitnow')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'duitnow'
                      ? 'border-pink-600 bg-pink-50/50 text-pink-950 font-bold ring-2 ring-pink-600/30'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-bold">DuitNow QR (Instant Pay)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    {language === 'en' ? 'Malaysia National QR · Any Bank / TNG' : '国家通用二维码 · 任何银行或电子钱包'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/30'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">WhatsApp Direct Pay</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    {language === 'en' ? 'Direct to +60126189919' : '直连官方客服 WhatsApp +60126189919'}
                  </span>
                </button>
              </div>

              {/* DuitNow QR Interactive Card embedded directly */}
              {paymentMethod === 'duitnow' && (
                <div className="mt-3">
                  <DuitNowPaymentCard
                    amount={grandTotal}
                    orderId="NEW-CHECKOUT"
                    language={language}
                    whatsappNumber="60126189919"
                    siteSettings={siteSettings}
                  />
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <p className="font-bold">
                        {language === 'en'
                          ? 'Important: After payment, please WhatsApp payment slip to us (+60126189919)'
                          : '重要提醒：DuitNow 付款成功后，请务必将付款水单截图 WhatsApp 发送给我们 (+60126189919)！'}
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        {language === 'en'
                          ? 'We will verify your transaction immediately and confirm your order schedule.'
                          : '厨房收到付款水单后将即时核销并为您安排鲜食排期。'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Breakdown */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>{language === 'en' ? 'Order Subtotal:' : '餐品总额:'}</span>
                <span className="font-bold text-stone-900">RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{language === 'en' ? 'Klang Valley Delivery:' : '巴生谷配送运费:'}</span>
                <span className="font-bold text-emerald-700">
                  {deliveryFee === 0
                    ? (language === 'en' ? 'FREE (Orders ≥ RM100 / Package)' : '全免运费 (满RM100/配套包免运)')
                    : `RM ${deliveryFee.toFixed(2)} (${language === 'en' ? 'Standard fee < RM100' : '未满RM100统一运费'})`}
                </span>
              </div>
              {subtotal > 0 && subtotal < 100 && !hasPlan && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {language === 'en'
                    ? `💡 Add RM ${(100 - subtotal).toFixed(2)} more to enjoy FREE delivery!`
                    : `💡 还差 RM ${(100 - subtotal).toFixed(2)} 即可享全巴生谷免运费！`}
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-sm text-stone-900">
                <span>{language === 'en' ? 'Grand Total Due:' : '结账总计:'}</span>
                <span className="text-emerald-800 font-heading text-base font-black">
                  RM {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {hasPlan
                  ? language === 'en'
                    ? `Confirm Package Order (RM ${grandTotal.toFixed(2)})`
                    : `确认订购配套 (RM ${grandTotal.toFixed(2)})`
                  : language === 'en'
                  ? `Place Order & Submit Payment (RM ${grandTotal.toFixed(2)})`
                  : `提交订单并确认付款 (RM ${grandTotal.toFixed(2)})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
