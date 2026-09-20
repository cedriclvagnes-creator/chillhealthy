import React, { useState } from 'react';
import { MapPin, Truck, Check, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { DELIVERY_AREAS } from '../data/menuData';

interface DeliverySectionProps {
  language: Language;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({ language }) => {
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
                      ? '✓ Daily Lunch delivery slot: 11:30 AM – 12:45 PM'
                      : '✓ 支持午餐与晚餐派送，中午12:45前准时送达'}
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
                    {language === 'en' ? 'Lunch Arrival:' : '午餐预计到达:'}
                  </span>
                  <span className="font-medium text-stone-800">{area.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Self Pickup Option Notice */}
        <div className="mt-8 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-xs text-emerald-950">
            <span className="font-bold block text-sm">
              {language === 'en' ? 'Self Pickup Available in Klang Kitchen' : '支持巴生中央厨房自取 (Self Pickup)'}
            </span>
            <span className="text-emerald-800">
              {language === 'en'
                ? 'No delivery fee & enjoy RM 2 off per bento box when picking up in person.'
                : '免除配送费，到店自取每盒再享 RM 2.00 专属折扣。'}
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold whitespace-nowrap">
            {language === 'en' ? 'Mon – Sat 11am–7pm' : '周一至周六 11:00-19:00'}
          </span>
        </div>
      </div>
    </section>
  );
};
