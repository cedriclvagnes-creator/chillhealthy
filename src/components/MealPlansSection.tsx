import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Clock,
  Calendar,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Users,
  HeartPulse,
  Plus,
  Edit3,
  MessageCircle,
  Building2,
  Truck,
  Landmark,
  Calculator,
  Info,
  CalendarDays,
} from 'lucide-react';
import { MealPlan, Language, CartItem, SiteSettings } from '../types';
import { MEAL_PLANS } from '../data/menuData';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  calculateMonFriExpiryDate,
  getPlanValidityDays,
  getTodayStr,
  getDetailedPackageValidity,
} from '../utils/packageExpiry';

interface MealPlansSectionProps {
  language: Language;
  onAddPlanToCart: (item: CartItem) => void;
  packages?: MealPlan[];
  onOpenMemberPortal?: () => void;
  isEditMode?: boolean;
  onEditPackages?: () => void;
  siteSettings?: SiteSettings;
}

export const MealPlansSection: React.FC<MealPlansSectionProps> = ({
  language,
  onAddPlanToCart,
  packages = MEAL_PLANS,
  onOpenMemberPortal,
  isEditMode = false,
  onEditPackages,
  siteSettings,
}) => {
  const isEn = language === 'en';
  // Track upsize choice per plan ID
  const [upsizeSelections, setUpsizeSelections] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'solo' | 'team' | 'all'>('solo');

  // Customer Reference: Interactive Validity & Holiday Checker
  const [calcSelectedPlanId, setCalcSelectedPlanId] = useState<string>('plan-20-day-transformation');
  const [calcStartDate, setCalcStartDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    if (day === 6) d.setDate(d.getDate() + 2); // Saturday -> next Monday
    else if (day === 0) d.setDate(d.getDate() + 1); // Sunday -> next Monday
    return d.toISOString().split('T')[0];
  });
  const [showValidityCalculator, setShowValidityCalculator] = useState<boolean>(true);

  // WhatsApp concierge for Big Group orders
  const bigGroupWhatsAppUrl = buildWhatsAppUrl(
    siteSettings?.whatsappNumber,
    'Hi CHILL Healthy, we would like to enquire about a big group order (above 100 boxes per delivery) on top with free delivery!'
  );

  const toggleUpsize = (planId: string) => {
    setUpsizeSelections((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handleSubscribe = (plan: MealPlan) => {
    const isUpsized = Boolean(upsizeSelections[plan.id]);
    const planUpsizeRate = plan.upsizePrice || plan.mealsTotal * 5;
    const finalPrice = plan.totalPrice + (isUpsized ? planUpsizeRate : 0);

    const cartItem: CartItem = {
      cartItemId: `plan-${plan.id}-${Date.now()}`,
      type: 'plan',
      title: isEn
        ? `${plan.title}${isUpsized ? ' (Upsized Portion)' : ''}`
        : `${plan.titleZh}${isUpsized ? '（加大分量版）' : ''}`,
      titleZh: `${plan.titleZh}${isUpsized ? '（加大分量版）' : ''}`,
      price: finalPrice,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      planDetails: {
        days: plan.days,
        mealsTotal: plan.mealsTotal,
        deliveryTime: 'lunch',
        persons: plan.persons,
        isUpsized,
        upsizeCost: planUpsizeRate,
        basePrice: plan.totalPrice,
        planId: plan.id,
      },
      notes: isUpsized ? `Portion Upsized (+RM${planUpsizeRate})` : undefined,
    };
    onAddPlanToCart(cartItem);
  };

  const filteredPackages = packages.filter((pkg) => {
    if (activeFilter === 'solo') return pkg.persons === 1;
    if (activeFilter === 'team') return pkg.persons >= 2;
    return true;
  });

  return (
    <section id="plans" className="py-16 sm:py-20 bg-stone-900 text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          {isEditMode && onEditPackages && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onEditPackages}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md border border-amber-300 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEn ? 'Edit Packages & Pricing' : '编辑月度套餐计划与价格'}</span>
              </button>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Official CHILL Healthy Meal Packages' : '潮轻食官方包月健康餐配套'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {isEn ? 'Healthy Meal Plans · Single Person & Teams' : '健康餐配套 ｜ 单人与团队餐食'}
          </h2>
          <p className="mt-3 text-stone-300 text-sm sm:text-base leading-relaxed">
            {isEn
              ? 'Choose from 5-Day Workday Passes (8 days validity), 10-Day Fat-Loss Kickstarts (15 days validity), and 20-Day Monthly Plans (30 days validity) for 1 to 6 persons. Free Klang Valley delivery included.'
              : '精选单人 5 天工作日午餐卡（8天有效期）、10 天轻体减脂冲刺（15天有效期）、20 天蜕变月计划（30天有效期），以及 2 至 6 人团订配套。包含巴生谷全境免运费。'}
          </p>

          {/* Validity Policy & Malaysia Klang Valley Public Holiday Synchronization Reference */}
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-stone-900/90 to-emerald-950/80 border border-emerald-500/50 text-left sm:text-center shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs">
              <span className="font-extrabold flex items-center gap-1.5 text-emerald-300 shrink-0 text-sm">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? 'Package Validity Standard & Holiday Schedule:' : '配套有效期官方标准与公假顺延规则：'}</span>
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="bg-emerald-900/90 px-3 py-1 rounded-xl border border-emerald-500/60 text-white shadow-xs">
                  🍱 20 Meals → <strong className="text-emerald-300">30 Days Validity</strong>
                </span>
                <span className="bg-emerald-900/90 px-3 py-1 rounded-xl border border-emerald-500/60 text-white shadow-xs">
                  🥗 10 Meals → <strong className="text-emerald-300">15 Days Validity</strong>
                </span>
                <span className="bg-emerald-900/90 px-3 py-1 rounded-xl border border-emerald-500/60 text-white shadow-xs">
                  🥢 5 Meals → <strong className="text-emerald-300">8 Days Validity</strong>
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-300 mt-2.5 sm:mt-2 leading-relaxed max-w-3xl mx-auto">
              {isEn
                ? '🇲🇾 Deliveries are scheduled Monday to Friday only. All official Malaysia Klang Valley public holidays (Federal & Selangor) are automatically synchronized and excluded, auto-extending your package validity date by +1 day so you never lose meal days.'
                : '🇲🇾 仅限周一至周五工作日配送。系统已全自动同步马来西亚巴生谷官方公共假期（吉隆坡与雪兰莪法定公假停送，并自动顺延 +1 天工作日，绝不扣减餐期）。'}
            </p>

            {/* Toggle Interactive Validity Date Checker */}
            <div className="mt-3.5 pt-3 border-t border-emerald-500/30 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowValidityCalculator(!showValidityCalculator)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {showValidityCalculator
                    ? (isEn ? 'Hide Validity Date Reference Tool' : '收起有效期参考测算工具')
                    : (isEn ? 'Open Package Validity Date Reference Tool' : '展开客户专属：配套有效期至参考测算')}
                </span>
              </button>
            </div>

            {/* Interactive Package Validity & Holiday Date Checker Tool */}
            {showValidityCalculator && (() => {
              const currentSelectedPlan = packages.find((p) => p.id === calcSelectedPlanId) || packages[0];
              const validityDetails = getDetailedPackageValidity(
                calcStartDate,
                currentSelectedPlan,
                siteSettings?.disabledDeliveryDates || []
              );

              return (
                <div className="mt-4 p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/40 text-left shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading font-extrabold text-white text-sm">
                          {isEn ? 'Customer Reference: Package Validity Date Checker' : '客户参考：配套有效截止日期即时查询'}
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          {isEn
                            ? 'Check the exact validity cutoff date for any meal plan based on your chosen start date'
                            : '选择任意餐标及预计首餐送餐日，系统自动计算排除周末及巴生谷公假后的准确到期日'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-400 text-[11px] font-semibold">{isEn ? 'Start Date:' : '首餐日期：'}</span>
                      <input
                        type="date"
                        value={calcStartDate}
                        onChange={(e) => setCalcStartDate(e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Plan Selector Buttons */}
                  <div className="mt-3.5">
                    <div className="text-[11px] font-bold text-stone-300 mb-1.5">
                      {isEn ? '1. Select Package Plan:' : '1. 选择订购配套：'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {packages
                        .filter((p) => p.persons === 1 || !p.persons)
                        .slice(0, 3)
                        .map((p) => {
                          const isSelected = p.id === calcSelectedPlanId;
                          const vDays = p.validityDays || getPlanValidityDays(p);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setCalcSelectedPlanId(p.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-xs ring-1 ring-emerald-400/50'
                                  : 'bg-stone-850/80 border-stone-800 text-stone-300 hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-xs">
                                <span>{isEn ? p.title : p.titleZh}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isSelected ? 'bg-emerald-400 text-stone-950 font-black' : 'bg-stone-750 text-stone-300'}`}>
                                  {vDays} {isEn ? 'Days' : '天'}
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                                {p.mealsTotal} {isEn ? 'Meals' : '餐'} · RM {p.pricePerMeal.toFixed(2)}/餐
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Real-time Calculation Result Display */}
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold block">
                        {isEn ? 'OFFICIAL VALIDITY CUTOFF DATE' : '官方有效截止日期 (CUSTOMER REFERENCE)'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {validityDetails.expiryDate}
                        </span>
                        <span className="text-xs text-emerald-300 font-bold">
                          ({validityDetails.validityDays} {isEn ? 'Mon–Fri Workdays' : '天工作日'})
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1">
                        {isEn
                          ? `Starting from ${validityDetails.startDate} · Available Monday to Friday only`
                          : `自 ${validityDetails.startDate} 首餐起算 · 仅限周一至五工作日送达`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-700/80 text-stone-200">
                        <span className="text-[10px] text-stone-400 block font-bold">{isEn ? 'Weekends Protected' : '周末免扣'}</span>
                        <span className="font-mono font-bold text-emerald-400">{validityDetails.weekendDaysExcluded} {isEn ? 'Weekend Days' : '个周末日'}</span>
                      </div>
                      <div className="bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-700/80 text-stone-200">
                        <span className="text-[10px] text-stone-400 block font-bold">{isEn ? 'Klang Valley Holidays' : '巴生谷公假'}</span>
                        <span className="font-mono font-bold text-amber-300">
                          {validityDetails.extendedHolidaysCount > 0
                            ? `+${validityDetails.extendedHolidaysCount} ${isEn ? 'Days Extended' : '天公假顺延'}`
                            : (isEn ? 'Synchronized' : '已自动同步')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Holidays Encountered List */}
                  {validityDetails.holidaysEncountered.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span>🇲🇾</span>
                        <span>
                          {isEn
                            ? `Public Holiday(s) synchronized during this period (validity extended by +${validityDetails.extendedHolidaysCount} workdays):`
                            : `此周期内已自动同步的巴生谷官方公假（有效期顺延 +${validityDetails.extendedHolidaysCount} 个工作日）：`}
                        </span>
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {validityDetails.holidaysEncountered.map((h, idx) => (
                          <span
                            key={`${h.date}-${idx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900/80 border border-amber-500/50 text-white text-[11px] font-medium"
                          >
                            <span className="font-mono text-amber-200 font-bold">{h.date}</span>
                            <span>•</span>
                            <span>{isEn ? h.nameEn : h.nameZh}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded ml-1 font-bold">+1天</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 text-[11px] text-stone-400 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {isEn
                        ? 'Customer Protection Guarantee: Your package validity clock officially begins only on your 1st ordered meal date, never upon purchase date. Enjoy your healthy meals with complete flexibility!'
                        : '客户权益保障：您的配套有效期倒计时仅在您“首餐实际送达日”开始计算，购买当天不扣期。出差休假可弹性顺延，公假零损耗！'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <button
              onClick={() => setActiveFilter('solo')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFilter === 'solo'
                  ? 'bg-emerald-500 text-stone-950 shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isEn ? 'Single Person (5 / 10 / 20 Days)' : '单人计划 (5天 / 10天 / 20天)'}</span>
            </button>
            <button
              onClick={() => setActiveFilter('team')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFilter === 'team'
                  ? 'bg-emerald-500 text-stone-950 shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isEn ? 'Duo & Teams (2 – 6 Persons)' : '双人 / 多人拼团 (2-6人)'}</span>
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-500 text-stone-950 shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              {isEn ? 'All Packages (7 Plans)' : '全部配套 (7款)'}
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('big-group-catering');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm"
            >
              <span>🏢</span>
              <span>{isEn ? 'Big Group (>100 Boxes Free Delivery)' : '大宗团餐 (100盒以上享免运)'}</span>
            </button>
          </div>
        </div>

        {/* Existing Member Callout */}
        {onOpenMemberPortal && (
          <div className="max-w-3xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  {isEn ? 'Already Subscribed to a Package?' : '已拥有【潮轻食】健康餐配套？'}
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  {isEn
                    ? 'Log in to your Member Portal to redeem tomorrow’s lunch before 5:00 PM!'
                    : '登录会员系统，每天下午 5:00 前完成隔天餐点自选与地址确认！'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenMemberPortal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs transition-colors shrink-0 shadow-md cursor-pointer"
            >
              {isEn ? 'Member Portal Login →' : '会员系统选餐入口 →'}
            </button>
          </div>
        )}

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-14">
          {filteredPackages.map((plan) => {
            const isUpsized = Boolean(upsizeSelections[plan.id]);
            const upsizeCost = isUpsized && plan.upsizePrice ? plan.upsizePrice : 0;
            const currentTotal = plan.totalPrice + upsizeCost;

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-stone-800 to-stone-850 border-2 border-amber-500 shadow-2xl scale-[1.02]'
                    : 'bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-xs font-black uppercase px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    {plan.persons === 1
                      ? isEn ? '★ Best Value · Lifestyle Habit' : '★ 长期蜕变 · 超值首选'
                      : isEn ? '★ Most Popular Duo Choice' : '★ 超值双人搭档 · 热门首选'}
                  </div>
                )}

                <div>
                  {/* Top Badge: Person count & Meals per day */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {plan.persons === 1
                          ? isEn ? `Single Person · ${plan.days} Days` : `单人 · ${plan.days}天计划`
                          : plan.persons === 2
                          ? isEn ? '2 Persons (Duo)' : '双人餐食'
                          : plan.persons === 3
                          ? isEn ? '3 Persons (Trio)' : '三人餐食'
                          : plan.persons === 4
                          ? isEn ? '4 Persons (Family/Team)' : '四人餐食'
                          : isEn ? '6 Persons (Corporate)' : '六人餐食'}
                      </span>
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {isEn ? `${plan.mealsTotal} Meals Total` : `共 ${plan.mealsTotal} 餐`}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {isEn ? plan.title : plan.titleZh}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 font-medium leading-relaxed">
                    {isEn ? plan.tagline : plan.taglineZh}
                  </p>

                  {/* Price Banner */}
                  <div className="mt-5 pt-4 border-t border-stone-700/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        RM {currentTotal.toFixed(0)}
                      </span>
                      {plan.originalPrice && plan.originalPrice > 0 && !isUpsized && (
                        <span className="text-sm line-through text-stone-500">
                          RM {plan.originalPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mt-1">
                      <span>
                        {isEn
                          ? `RM ${plan.pricePerMeal.toFixed(2)} / meal`
                          : `每餐约 RM ${plan.pricePerMeal.toFixed(2)}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                        {isEn ? `📅 ${plan.validityDays} Days Validity (Mon–Fri)` : `📅 ${plan.validityDays}天工作日有效期`}
                      </span>
                    </div>

                    {/* Customer Reference: Estimated Validity Date Box */}
                    {(() => {
                      const todayStr = getTodayStr();
                      const valDetails = getDetailedPackageValidity(todayStr, plan, siteSettings?.disabledDeliveryDates || []);
                      return (
                        <div className="mt-3 p-2.5 rounded-xl bg-stone-900/90 border border-emerald-500/40 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{isEn ? 'Estimated Validity Date:' : '预估有效截止日期：'}</span>
                            </span>
                            <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-white font-extrabold border border-emerald-500/40">
                              {valDetails.expiryDate}
                            </span>
                          </div>
                          <div className="mt-1.5 space-y-0.5 text-[10px] text-stone-300 leading-snug">
                            <div>
                              {isEn
                                ? `• ${valDetails.validityDays} Mon–Fri weekdays (${valDetails.validityDays === 30 ? '20 Meals' : valDetails.validityDays === 15 ? '10 Meals' : '5 Meals'} standard)`
                                : `• ${valDetails.validityDays}个工作日（${valDetails.validityDays === 30 ? '20餐' : valDetails.validityDays === 15 ? '10餐' : '5餐'}官方有效期）`}
                            </div>
                            <div className="text-emerald-300/90">
                              {isEn
                                ? '• Malaysia Klang Valley public holidays auto-extend +1 day'
                                : '• 自动同步巴生谷公假，遇公假顺延 +1 天工作日'}
                            </div>
                            {valDetails.extendedHolidaysCount > 0 && (
                              <div className="text-amber-300 font-semibold pt-0.5">
                                {isEn
                                  ? `🇲🇾 +${valDetails.extendedHolidaysCount} Klang Valley holiday extension applied (${valDetails.holidaysEncountered[0]?.nameEn})`
                                  : `🇲🇾 期间包含 ${valDetails.extendedHolidaysCount} 天巴生谷公假顺延（${valDetails.holidaysEncountered[0]?.nameZh}）`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Portion Upsize Option (From Attached Flyer) */}
                  {plan.upsizePrice && (
                    <div
                      onClick={() => toggleUpsize(plan.id)}
                      className={`mt-4 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isUpsized
                          ? 'bg-amber-500/15 border-amber-500/80 text-amber-200'
                          : 'bg-stone-900/60 hover:bg-stone-900/80 border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isUpsized}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 h-4 w-4 bg-stone-800 border-stone-600"
                          />
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1">
                              <span>{isEn ? 'Portion Upsize Option' : '加大分量选项'}</span>
                              <span className="text-amber-400 font-extrabold">
                                +RM {plan.upsizePrice}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {isEn
                                ? `Extra protein & veggies (NP: RM ${plan.upsizeOriginalPrice || plan.upsizePrice + 20})`
                                : `肉量蔬菜加量升级 (原价: RM ${plan.upsizeOriginalPrice || plan.upsizePrice + 20})`}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${isUpsized ? 'bg-amber-500 text-stone-950' : 'bg-stone-700 text-stone-300'}`}>
                          {isUpsized ? (isEn ? 'Active' : '已升级') : (isEn ? 'Add' : '升级')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Core 5 Key Inclusions (Matching the 5 flyer points) */}
                  <div className="mt-5 space-y-2 text-xs text-stone-200">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        1
                      </span>
                      <span>{isEn ? '26 Healthy Meal Choices rotating daily' : '26 种餐食选择自由搭配'}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        2
                      </span>
                      <span>
                        {isEn
                          ? `Enjoy ${plan.mealsTotal} meals within ${plan.validityDays} days, Mon–Fri only (Klang Valley public holidays automatically extend validity +1 day)`
                          : `${plan.validityDays} 天内弹性享用 ${plan.mealsTotal} 餐，仅限周一至五（巴生谷公假停送并自动顺延 +1 天工作日）`}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        3
                      </span>
                      <span>
                        {isEn
                          ? 'Free Klang Valley delivery · 1 Account supports 2 addresses'
                          : '包含巴生谷运费 · 一个户口可填两个常用地址'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        4
                      </span>
                      <span>
                        {isEn
                          ? 'Online computer & mobile system for easy meal ordering'
                          : '电脑系统自助订餐与每日餐点兑换'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        5
                      </span>
                      <span>
                        {isEn
                          ? `Delivers ${plan.mealsPerDay} meal${plan.mealsPerDay > 1 ? 's' : ''}/day (Lunch 10:00 AM – 2:00 PM / Dinner 3:00 PM – 7:00 PM)`
                          : `一天送${plan.mealsPerDay === 1 ? '一' : plan.mealsPerDay === 2 ? '两' : plan.mealsPerDay === 3 ? '三' : plan.mealsPerDay === 4 ? '四' : '六'}餐（午餐 10:00 AM – 2:00 PM / 晚餐 3:00 PM – 7:00 PM）`}
                      </span>
                    </div>

                    {/* Special Consultation for 3-Highs */}
                    <div className="flex items-start gap-2 pt-1 text-rose-300">
                      <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">
                        {isEn
                          ? 'Special consultation service for 3-Highs risk groups (BP / Sugar / Lipids)'
                          : '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-6 pt-4 border-t border-stone-700/80">
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      plan.popular
                        ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <span>
                      {isEn
                        ? `Select ${plan.title} · RM ${currentTotal.toFixed(0)}`
                        : `选购【${plan.titleZh}】· RM ${currentTotal.toFixed(0)}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Group Catering Everyday Banner (>100 Boxes with Free Delivery) */}
        <div id="big-group-catering" className="mt-8 mb-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950/70 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Everyday Big Group & Corporate Catering' : '每日大型团体 / 企业团餐定制'}</span>
                </div>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                  {isEn ? (
                    <>
                      We Cater for <span className="text-emerald-400">Big Groups Everyday</span>!
                    </>
                  ) : (
                    <>
                      我们<span className="text-emerald-400">每天均承接大宗团餐</span>定制服务！
                    </>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {isEn
                    ? 'We do cater for big groups on everyday! Planning corporate lunches, department wellness days, training seminars, production crews, or family celebrations? Contact us for big group orders above 100 boxes per delivery on top with 100% FREE delivery, custom bulk menu curation, and dedicated delivery timing.'
                    : '我们每天均承接大宗团餐！无论企业午餐、员工健康日、大型培训讲座、活动剧组或团体聚会，欢迎随时联系我们洽询 100 盒以上大宗团餐订单，在原有优惠基础上更专享 100% 全免运费配送与专属菜单搭配服务。'}
                </p>

                {/* Highlight Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800/90 text-stone-200 border border-stone-700/80 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {isEn ? 'Cater Everyday (Mon–Sun)' : '每天承接（周一至周日）'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    {isEn ? '>100 Boxes = FREE Delivery on top' : '单次满100盒 · 额外享免费配送'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {isEn ? 'Custom Corporate Menus' : '专属营养配比 · 正规发票'}
                  </span>
                </div>
              </div>

              {/* Direct WhatsApp Call to Action */}
              <div className="shrink-0 flex flex-col items-center gap-2 w-full sm:w-auto">
                <a
                  href={bigGroupWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-stone-950" />
                  <span>
                    {isEn ? 'Contact Us for Big Group (>100 Boxes)' : '联系洽询大宗团餐（>100盒享免运）'}
                  </span>
                </a>
                <span className="text-[11px] text-stone-400">
                  {isEn ? 'Above 100 boxes per delivery on top with free delivery' : '单次 100 盒以上大宗订单专享免运费配送'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dinner & Lunch Delivery Time Timetable (Directly After Meal Plan Selection) */}
        <div className="mt-8 mb-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Daily Delivery Schedule · Monday to Friday' : '每日送餐时段 · 周一至周五'}</span>
                </div>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                  {isEn ? 'Lunch (10:00 AM – 2:00 PM) & Dinner (3:00 PM – 7:00 PM)' : '午餐 (10:00 AM – 2:00 PM) & 晚餐 (3:00 PM – 7:00 PM)'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {isEn
                    ? 'All CHILL Healthy meal plans support both Lunch and Dinner delivery options. Easily assign your preferred time slot each day in your Member Portal before the 5:00 PM cutoff.'
                    : '潮轻食所有健康餐配套均支持【午餐】及【晚餐】双时段配送。会员可自由在会员中心为每个工作日指定送达时段，每天下午 5:00 前完成隔日选餐。'}
                </p>
                <div className="pt-1 text-xs text-amber-300/90 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>{isEn ? 'Daily cutoff before 5:00 PM.' : '每天请于下午 5:00 前完成隔天选餐。'}</span>
                </div>
              </div>

              {/* Delivery Slots Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full md:w-auto shrink-0">
                {/* Lunch Slot */}
                <div className="p-4 rounded-2xl bg-stone-800/90 border border-stone-700/80 flex items-center gap-3.5 min-w-[220px]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xl">
                    🍱
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      {isEn ? 'Lunch Slot' : '午餐时段'}
                    </span>
                    <span className="font-heading font-extrabold text-base text-white block">
                      10:00 AM – 2:00 PM
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {isEn ? 'Fresh office & home lunch' : '准时送达写字楼/住家'}
                    </span>
                  </div>
                </div>

                {/* Dinner Slot */}
                <div className="p-4 rounded-2xl bg-stone-800/90 border border-amber-500/40 flex items-center gap-3.5 min-w-[220px] relative">
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
                    {isEn ? 'Popular for Dinner' : '晚饭/健身热门'}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xl">
                    🍲
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      {isEn ? 'Dinner Slot' : '晚餐时段'}
                    </span>
                    <span className="font-heading font-extrabold text-base text-white block">
                      3:00 PM – 7:00 PM
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {isEn ? 'Fresh warm dinner & post-workout' : '下班享用热餐·低卡无负担'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Guarantees footer */}
        <div className="bg-stone-800/60 rounded-3xl p-6 sm:p-8 border border-stone-700/80 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? '30 Days Flexible Validity' : '30 天内弹性享用 20 餐'}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isEn
                  ? 'Monday to Friday only. Outstation or busy? Pause anytime via WhatsApp.'
                  : '仅限周一至周五工作日送达，公假除外。出差聚餐可随时在会员中心顺延。'}
              </p>
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {isEn ? 'Lunch & Dinner Delivery' : '午餐与晚餐双时段配送'}
                </h4>
                <p className="text-[11px] text-amber-300/90 font-medium mt-0.5">
                  {isEn ? 'Lunch (10:00 AM – 2:00 PM) & Dinner (3:00 PM – 7:00 PM)' : '午餐 (10:00 AM – 2:00 PM) & 晚餐 (3:00 PM – 7:00 PM)'}
                </p>
              </div>
            </div>

            {/* Tidy structured lines with clean vertical spacing */}
            <div className="space-y-1.5 pt-1 text-xs text-stone-300">
              <div className="bg-stone-900/80 border border-stone-700/80 rounded-xl px-2.5 py-1 text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <span>🍱</span>
                <span>{isEn ? 'Lunch Delivery: 10:00 AM – 2:00 PM' : '午餐配送：10:00 AM – 2:00 PM'}</span>
              </div>
              <div className="bg-stone-900/80 border border-stone-700/80 rounded-xl px-2.5 py-1 text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                <span>🍲</span>
                <span>{isEn ? 'Dinner Delivery: 3:00 PM – 7:00 PM' : '晚餐配送：3:00 PM – 7:00 PM'}</span>
              </div>
              <div className="text-[11px] text-stone-400 pt-0.5 font-medium">
                {isEn ? '⏰ Daily cutoff before 5:00 PM.' : '⏰ 每天截单时间：下午 5:00 前'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? 'Klang Valley Free Delivery' : '巴生谷全境免费送达'}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isEn
                  ? 'Coverage across Klang Valley. 1 account supports up to 2 addresses.'
                  : '包含运费无附加收费，一个会员账户支持设置办公室与家两个常用地址。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
