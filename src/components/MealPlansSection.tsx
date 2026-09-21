import React, { useState } from 'react';
import { Check, Sparkles, Clock, Calendar, ShieldCheck, ArrowRight, UserCheck, Users, HeartPulse, Plus, Edit3 } from 'lucide-react';
import { MealPlan, Language, CartItem } from '../types';
import { MEAL_PLANS } from '../data/menuData';

interface MealPlansSectionProps {
  language: Language;
  onAddPlanToCart: (item: CartItem) => void;
  packages?: MealPlan[];
  onOpenMemberPortal?: () => void;
  isEditMode?: boolean;
  onEditPackages?: () => void;
}

export const MealPlansSection: React.FC<MealPlansSectionProps> = ({
  language,
  onAddPlanToCart,
  packages = MEAL_PLANS,
  onOpenMemberPortal,
  isEditMode = false,
  onEditPackages,
}) => {
  const isEn = language === 'en';
  // Track upsize choice per plan ID
  const [upsizeSelections, setUpsizeSelections] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'solo' | 'team' | 'all'>('solo');

  const toggleUpsize = (planId: string) => {
    setUpsizeSelections((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handleSubscribe = (plan: MealPlan) => {
    const isUpsized = Boolean(upsizeSelections[plan.id]);
    const upsizeCost = isUpsized && plan.upsizePrice ? plan.upsizePrice : 0;
    const finalPrice = plan.totalPrice + upsizeCost;

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
        upsizeCost,
      },
      notes: isUpsized ? 'Portion Upsized (+RM' + upsizeCost + ')' : undefined,
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
              ? 'Choose from 5-Day Workday Passes, 10-Day Fat-Loss Kickstarts, and 20-Day Monthly Plans for 1 to 6 persons. Free Klang Valley delivery included.'
              : '精选单人 5 天工作日午餐卡、10 天轻体减脂冲刺、20 天蜕变月计划，以及 2 至 6 人团订配套。包含巴生谷全境免运费。'}
          </p>

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
                      <span className="text-stone-400 font-normal">
                        {isEn ? `${plan.validityDays} Days Validity` : `${plan.validityDays}天有效期`}
                      </span>
                    </div>
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
                          ? `Enjoy ${plan.mealsTotal} meals within ${plan.validityDays} days (Mon–Fri, excl. public holidays & weekends)`
                          : `${plan.validityDays} 天内享用 ${plan.mealsTotal} 餐，星期一至五（公假周末除外）`}
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
                          ? `Delivers ${plan.mealsPerDay} meal${plan.mealsPerDay > 1 ? 's' : ''} per day to 1 address (10:00 AM – 5:00 PM)`
                          : `一天送${plan.mealsPerDay === 1 ? '一' : plan.mealsPerDay === 2 ? '两' : plan.mealsPerDay === 3 ? '三' : plan.mealsPerDay === 4 ? '四' : '六'}餐一个地址（10:00 AM – 5:00 PM）`}
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

        {/* Value Guarantees footer */}
        <div className="bg-stone-800/60 rounded-3xl p-6 sm:p-8 border border-stone-700/80 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">
              {isEn ? '30 Days Flexible Validity' : '30 天内弹性享用 20 餐'}
            </h4>
            <p className="text-xs text-stone-400">
              {isEn
                ? 'Mon–Fri schedule. Outstation or busy? Pause anytime via WhatsApp.'
                : '工作日送达，公假及周末除外。出差聚餐可随时在 WhatsApp 报备顺延。'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">
              {isEn ? 'Lunch: 10:00 AM – 2:00 PM' : '午餐配送：10:00 AM – 2:00 PM'}
            </h4>
            <p className="text-xs text-stone-400">
              {isEn
                ? 'Daily lunch delivered fresh. Daily meal selection cutoff before 5:00 PM.'
                : '每日健康午餐准时送达。每天请在下午 5:00 前完成隔天餐点选择。'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">
              {isEn ? 'Klang Valley Free Delivery' : '巴生谷全境免费送达'}
            </h4>
            <p className="text-xs text-stone-400">
              {isEn
                ? 'Coverage across Klang Valley. 1 account supports up to 2 addresses.'
                : '包含运费无附加收费，一个会员账户支持设置办公室与家两个常用地址。'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
