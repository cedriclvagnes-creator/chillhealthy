import React, { useState } from 'react';
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
} from 'lucide-react';
import { CartItem, Language, SiteSettings } from '../types';
import { DuitNowPaymentCard } from './DuitNowPaymentCard';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  language: Language;
  siteSettings: SiteSettings;
  onOrderCompleted: () => void;
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
    }
  ) => void;
  onOpenMemberPortal?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  language,
  siteSettings,
  onOrderCompleted,
  onPackageOrdered,
  onOpenMemberPortal,
}) => {
  const hasPlan = cart.some((i) => i.type === 'plan');
  const planItem = cart.find((i) => i.type === 'plan');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Klang / Bukit Tinggi');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('41200');

  // Address 2 (one account up to 2 addresses for Klang Valley meal plans)
  const [hasAddress2, setHasAddress2] = useState(false);
  const [address2, setAddress2] = useState('');
  const [area2, setArea2] = useState('Klang / Bukit Tinggi');
  const [postalCode2, setPostalCode2] = useState('41200');

  const [deliveryDate, setDeliveryDate] = useState(() => {
    // Next workday (Monday - Friday)
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2); // if Saturday, move to Monday
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // if Sunday, move to Monday
    return d.toISOString().split('T')[0];
  });

  const [deliverySlot, setDeliverySlot] = useState<'Lunch (10:00 AM – 2:00 PM)' | 'Dinner (5:00 PM – 7:30 PM)' | 'Both Lunch & Dinner'>(
    'Lunch (10:00 AM – 2:00 PM)'
  );
  const [paymentMethod, setPaymentMethod] = useState<'duitnow' | 'whatsapp'>('duitnow');
  const [notes, setNotes] = useState('');

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Standardized delivery fee: RM15 for order < RM100; FREE on RM100 and above or meal packages
  const deliveryFee = hasPlan ? 0 : subtotal >= 100 ? 0 : 15.0;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert(language === 'en' ? 'Please complete all required fields.' : '请填写完整联系信息与送餐地址。');
      return;
    }

    const generatedId = `CH-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(generatedId);

    // If package order, trigger package provision
    if (hasPlan && planItem && onPackageOrdered) {
      onPackageOrdered(planItem, {
        name,
        phone,
        address,
        area,
        postalCode,
        address2: hasAddress2 ? address2 : undefined,
        area2: hasAddress2 ? area2 : undefined,
        postalCode2: hasAddress2 ? postalCode2 : undefined,
      });
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
        (notes ? `*Dietary Notes (忌口备注):* ${notes}%0A` : '') +
        `*Payment Method:* DuitNow QR (Chill Healthy Trading)%0A` +
        `%0A已完成付款，附上付款水单！请为我确认配套，开启每日订餐权限！🥗%0A` +
        `Website: www.chill-healthy.com`;

      if (paymentMethod === 'whatsapp') {
        window.open(`https://wa.me/${whatsappLinkNumber}?text=${msg}`, '_blank');
      }
    } else {
      const itemsText = cart
        .map((item) => `- ${item.title} x${item.quantity} (RM ${(item.price * item.quantity).toFixed(2)})`)
        .join('%0A');

      const msg =
        `*New Order: ${generatedId}*%0A` +
        `Customer: ${name}%0A` +
        `Phone: ${phone}%0A` +
        `Type: Delivery%0A` +
        `Date: ${deliveryDate} | Slot: ${deliverySlot}%0A` +
        `Address: ${address}, ${area} ${postalCode}%0A` +
        `Items:%0A${itemsText}%0A` +
        `Subtotal: RM ${subtotal.toFixed(2)}%0A` +
        `Delivery Fee: ${deliveryFee === 0 ? 'FREE (≥RM100)' : 'RM 15.00 (<RM100)'}%0A` +
        `*Total Amount: RM ${grandTotal.toFixed(2)}*%0A` +
        (notes ? `Notes: ${notes}%0A` : '') +
        `*Payment:* DuitNow QR (Chill Healthy Trading)%0A` +
        `已完成付款，附上付款凭证，请查收并安排配送！🥗`;

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

  const confirmOrderWhatsAppMessage =
    `*📣 Confirm Order | 订单付款凭单确认*%0A` +
    `感谢您下单我们的【潮轻食健康餐】❤️%0A` +
    `*Order ID:* ${orderId}%0A` +
    `*Registered Name (注册姓名):* ${name}%0A` +
    `*Phone (联系电话):* ${phone}%0A` +
    (planItem ? `*Package (所选配套):* ${planItem.title}%0A` : '') +
    `*Delivery Slot (送餐时段):* ${deliverySlot}%0A` +
    `*Total Paid (支付金额):* RM ${grandTotal.toFixed(2)}%0A` +
    `已通过 DuitNow QR 付款给 Chill Healthy Trading，附上付款凭单水单截图，请协助确认！🥗`;

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
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Order ID: <span className="font-mono font-bold text-stone-800">{orderId}</span>
              </p>
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
                      {language === 'en' ? 'Step 2 | WhatsApp Payment Slip & Name' : '第二步 | 付款后 WhatsApp 发送凭证水单'}
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      {language === 'en'
                        ? `After payment, kindly send your receipt/slip via WhatsApp to +60126189919 with your name "${name}" so our kitchen team can activate your account.`
                        : `DuitNow 付款后，请将付款凭单截图发送到官方 WhatsApp (+60126189919)，附上注册名字「${name}」，以便我们立即为您开启订餐权限。`}
                    </p>
                    <a
                      href={`https://wa.me/${whatsappLinkNumber}?text=${confirmOrderWhatsAppMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'WhatsApp Us Now (+60126189919)' : '立即发 WhatsApp 水单 (+60126189919)'}</span>
                    </a>
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
                        ? 'Once confirmed, select your meals daily before 5:00 PM for lunch (10:00 AM – 2:00 PM) or dinner (5:00 PM – 7:30 PM).'
                        : '确认配套后，即可自选每天午餐（10:00 AM – 2:00 PM）或晚餐（5:00 PM – 7:30 PM），前一天下午 5:00 前选定。'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Receipt Box for Individual Bentos */
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between font-medium text-stone-600">
                  <span>{language === 'en' ? 'Customer:' : '收件人:'}</span>
                  <span className="font-bold text-stone-900">
                    {name} ({phone})
                  </span>
                </div>
                <div className="flex justify-between font-medium text-stone-600">
                  <span>{language === 'en' ? 'Delivery Date & Slot:' : '送达日期与时段:'}</span>
                  <span className="font-bold text-stone-900">
                    {deliveryDate} · {deliverySlot}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-stone-600">
                  <span>{language === 'en' ? 'Address:' : '送达地址:'}</span>
                  <span className="font-bold text-stone-900 text-right max-w-xs">
                    {address}, {area} {postalCode}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-stone-600">
                  <span>{language === 'en' ? 'Delivery Fee:' : '配送费用:'}</span>
                  <span className="font-bold text-emerald-700">
                    {deliveryFee === 0 ? 'FREE (≥RM100)' : 'RM 15.00 (<RM100)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-sm text-stone-900">
                  <span>{language === 'en' ? 'Total Amount:' : '支付金额:'}</span>
                  <span className="text-emerald-800 font-heading text-base">RM {grandTotal.toFixed(2)}</span>
                </div>

                {/* WhatsApp Slip notice */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${whatsappLinkNumber}?text=${confirmOrderWhatsAppMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{language === 'en' ? 'Send Payment Slip via WhatsApp (+60126189919)' : 'WhatsApp 发送付款凭证水单 (+60126189919)'}</span>
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {hasPlan && onOpenMemberPortal ? (
                <button
                  onClick={() => {
                    handleFinish();
                    onOpenMemberPortal();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'en' ? 'Go to Member Portal to Select Daily Meals' : '进入会员中心挑选每天餐点'}</span>
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
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'en' ? 'Phone / WhatsApp *' : '手机 / WhatsApp号码 *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 012-618 9919"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

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
                      e.target.value as 'Lunch (10:00 AM – 2:00 PM)' | 'Dinner (5:00 PM – 7:30 PM)' | 'Both Lunch & Dinner'
                    )
                  }
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800"
                >
                  <option value="Lunch (10:00 AM – 2:00 PM)">
                    🍱 {language === 'en' ? 'Lunch (10:00 AM – 2:00 PM)' : '午餐配送 (10:00 AM – 2:00 PM)'}
                  </option>
                  <option value="Dinner (5:00 PM – 7:30 PM)">
                    🌙 {language === 'en' ? 'Dinner (5:00 PM – 7:30 PM)' : '晚餐配送 (5:00 PM – 7:30 PM)'}
                  </option>
                  <option value="Both Lunch & Dinner">
                    🍱🌙 {language === 'en' ? 'Both Lunch & Dinner (Split)' : '午餐与晚餐分批送达'}
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
