import React, { useState } from 'react';
import { MapPin, Truck, Check, Clock, Sparkles, AlertCircle, Edit3 } from 'lucide-react';
import { Language } from '../types';
import { DELIVERY_AREAS } from '../data/menuData';

interface DeliverySectionProps {
  language: Language;
  isEditMode?: boolean;
  onEditDelivery?: () => void;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({
  language,
  isEditMode = false,
  onEditDelivery,
}) => {
  const [postalCode, setPostalCode] = useState('');
  const [postalResult, setPostalResult] = useState<{
    checked: boolean;
    covered: boolean;
    areaName?: string;
    feeText?: string;
  } | null>(null);

  const handleCheckPostal = (e: React.FormEvent) => {
    e.preventDefault();
    const code = postalCode.trim();
    if (!code) return;

    // Klang Valley postal code check (e.g. 40xxx - 43xxx Selangor, 50xxx - 60xxx KL)
    const prefix2 = code.substring(0, 2);
    const prefix = parseInt(prefix2, 10);

    const isSelangor = prefix >= 40 && prefix <= 48;
    const isKL = prefix >= 50 && prefix <= 60;

    if (isSelangor || isKL) {
      let area = 'Klang Valley / Selangor & KL Area';
      if (prefix === 41 || prefix === 42) area = 'Klang / Port Klang / Bukit Tinggi';
      else if (prefix === 40) area = 'Shah Alam / Kota Kemuning';
      else if (prefix === 47) area = 'Subang Jaya / USJ / Petaling Jaya / Puchong';
      else if (prefix >= 50 && prefix <= 55) area = 'Kuala Lumpur CBD / Bangsar / Sentral';
      else if (prefix === 56 || prefix === 57) area = 'Cheras / Sri Petaling / Bukit Jalil';

      setPostalResult({
        checked: true,
        covered: true,
        areaName: area,
        feeText: 'Eligible for FREE Delivery with min. spend',
      });
    } else {
      setPostalResult({
        checked: true,
        covered: false,
        areaName: 'Outside Standard Delivery Zone',
        feeText: 'Special long-distance arrangement may be available via WhatsApp concierge.',
      });
    }
  };

  return (
    <section id="delivery" className="py-16 sm:py-20 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {isEditMode && onEditDelivery && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onEditDelivery}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md border border-amber-300 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{language === 'en' ? 'Edit Delivery Info & Hotline' : '编辑配送区域与咨询专线'}</span>
              </button>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Fresh Daily Delivery' : '巴生河流域准时配送'}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {language === 'en' ? 'Delivery Coverage & Timings' : '配送区域与每日派送时段'}
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
            {language === 'en'
              ? 'We deliver fresh warm lunch and dinner boxes across Klang Valley, Petaling Jaya, Subang, Puchong, and Kuala Lumpur.'
              : '专业恒温配送团队每日将新鲜制作的健康餐盒准时送达。覆盖巴生、莎阿南、梳邦、八打灵再也、蒲种及吉隆坡各主要商区与住宅。'}
          </p>
        </div>

        {/* Postal Code Interactive Checker */}
        <div className="max-w-xl mx-auto bg-stone-50 rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs mb-12">
          <h3 className="font-heading text-base font-bold text-stone-900 text-center mb-1">
            {language === 'en' ? 'Check Your Postal Code' : '邮区速查 · 是否支持送达'}
          </h3>
          <p className="text-xs text-stone-500 text-center mb-4">
            {language === 'en'
              ? 'Enter your 5-digit Malaysian postal code (e.g. 41200, 47500, 50450)'
              : '输入马来西亚5位数邮编（如：41200、47500、50450）即可即时查询'}
          </p>

          <form onSubmit={handleCheckPostal} className="flex gap-2">
            <input
              type="text"
              maxLength={5}
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value.replace(/\D/g, ''));
                setPostalResult(null);
              }}
              placeholder="e.g. 41200"
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-center tracking-widest"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Check Now' : '立即查询'}
            </button>
          </form>

          {postalResult && (
            <div
              className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 text-xs animate-in fade-in duration-200 ${
                postalResult.covered
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {postalResult.covered ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">{postalResult.areaName}</span>
                <p className="mt-0.5">{postalResult.feeText}</p>
                {postalResult.covered && (
                  <p className="text-emerald-700 font-semibold mt-1">
                    {language === 'en'
                      ? '✓ Lunch: 10:00 AM – 2:00 PM | Dinner: 3:00 PM – 7:00 PM'
                      : '✓ 午餐派送：10:00 AM – 2:00 PM ｜ 晚餐派送：3:00 PM – 7:00 PM'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {DELIVERY_AREAS.map((area, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm mb-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{area.name}</span>
              </div>
              <div className="space-y-1 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span className="text-stone-400">
                    {language === 'en' ? 'Delivery Fee:' : '配送费:'}
                  </span>
                  <span className="font-bold text-emerald-800">{area.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">
                    {language === 'en' ? 'Delivery Slots:' : '配送时段:'}
                  </span>
                  <span className="font-medium text-stone-800">{area.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Schedule & Klang Valley Free Delivery Highlights (No Self Pickup) */}
        <div className="mt-10 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm mb-1.5">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{language === 'en' ? 'Delivery Time ｜ 配送时间' : '配送时间 ｜ Delivery Time'}</span>
            </div>
            <p className="text-xs text-stone-600 mb-2">
              {language === 'en'
                ? 'Monday to Friday (Excluding Public Holidays & Weekends)'
                : '星期一至星期五（公假及周末除外）'}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <span className="font-semibold text-emerald-900">{language === 'en' ? 'Lunch Delivery:' : '午餐配送：'}</span>
                <span className="font-bold text-emerald-700">10:00 AM – 2:00 PM</span>
              </div>
              <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <span className="font-semibold text-amber-900">{language === 'en' ? 'Dinner Delivery:' : '晚餐配送：'}</span>
                <span className="font-bold text-amber-700">3:00 PM – 7:00 PM</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-stone-500">
              {language === 'en'
                ? 'Daily meals delivered fresh. Daily meal selection cutoff before 5:00 PM.'
                : '每日新鲜现做送达。隔天餐点请在每天下午 5:00 前完成选择。'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-sky-950 text-sm mb-1.5">
                <Truck className="w-4 h-4 text-sky-700 shrink-0" />
                <span>{language === 'en' ? 'Klang Valley Free Delivery' : '巴生谷全境免运费配送'}</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {language === 'en'
                  ? 'Coverage across Klang Valley. 1 account supports up to 2 addresses. One day deliver one address for each account.'
                  : '覆盖整个巴生河流域免运费。1 个账户支持最多 2 个地址，每个账户一天派送一个地址。'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-sky-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-sky-800">
              <Check className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'en' ? 'Daily meals delivered fresh' : '每日新鲜午餐现做准时配送'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
