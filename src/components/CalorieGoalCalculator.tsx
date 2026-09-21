import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Dumbbell,
  Heart,
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
  User,
  ShoppingBag,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { Language, MealItem, MemberAccount } from '../types';
import { MEAL_ITEMS } from '../data/menuData';

interface CalorieGoalCalculatorProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendedMeal: (meal: MealItem) => void;
  currentMember?: MemberAccount | null;
  onOpenPlans?: () => void;
  onOpenMemberPortal?: () => void;
  onOpenMenu?: () => void;
}

export const CalorieGoalCalculator: React.FC<CalorieGoalCalculatorProps> = ({
  language,
  isOpen,
  onClose,
  onSelectRecommendedMeal,
  currentMember,
  onOpenPlans,
  onOpenMemberPortal,
  onOpenMenu,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [goal, setGoal] = useState<'loss' | 'maintain' | 'muscle'>('loss');
  const [weight, setWeight] = useState(62);
  const [activity, setActivity] = useState<'desk' | 'moderate' | 'active'>('desk');

  if (!isOpen) return null;

  // The meal calculator is only granted to whom has purchased a meal plan
  const hasPurchasedMealPlan = Boolean(
    currentMember?.activePackage &&
    (currentMember.activePackage.totalMeals > 0 ||
      (currentMember.creditsHistory && currentMember.creditsHistory.length > 0))
  );

  // BMR/TDEE calculation
  const bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * 172 - 5 * 28 + 5
      : 10 * weight + 6.25 * 162 - 5 * 28 - 161;
  const activityMultiplier = activity === 'desk' ? 1.2 : activity === 'moderate' ? 1.4 : 1.6;
  const tdee = Math.round(bmr * activityMultiplier);

  let targetCalories = tdee;
  let targetProtein = Math.round(weight * 1.6);

  if (goal === 'loss') {
    targetCalories = Math.max(1200, Math.round(tdee - 450));
    targetProtein = Math.round(weight * 1.8);
  } else if (goal === 'muscle') {
    targetCalories = Math.round(tdee + 300);
    targetProtein = Math.round(weight * 2.0);
  }

  // Recommended meals
  const recommendedMeals = MEAL_ITEMS.filter((meal) => {
    if (goal === 'loss') {
      return meal.calories <= 500 && meal.protein >= 35;
    } else if (goal === 'muscle') {
      return meal.protein >= 40;
    } else {
      return meal.category.includes('signature');
    }
  }).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100/90 hover:bg-stone-200 text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!hasPurchasedMealPlan ? (
          /* =========================================================================
             LOCKED STATE: THE MEAL CALCULATOR ONLY GRANTED TO WHOM HAS PURCHASED MEAL PLAN
             ========================================================================= */
          <div>
            {/* Locked Header */}
            <div className="bg-stone-900 text-white p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5 border border-amber-400/30">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'en' ? 'Meal Plan Subscriber Perk' : '健康餐配套会员专属特权'}</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {language === 'en' ? 'Calorie & Macro Matcher' : '智能热量与营养素计算器'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-lg leading-relaxed">
                {language === 'en'
                  ? 'Personalized daily calorie deficit and macro planning is exclusively granted to customers who have purchased a CHILL Healthy Meal Plan.'
                  : '量身定制的每日卡路里赤字与宏量营养规划，专为已订购潮轻食健康餐配套的顾客开放。'}
              </p>
            </div>

            {/* Locked Body: Decision for Plans vs Ala Carte */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto bg-stone-50/50">
              {/* Logged in member with 0 meals notice */}
              {currentMember && (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-700" />
                      <span>{currentMember.name}</span>
                    </span>
                    <span className="text-[11px] font-extrabold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                      {language === 'en' ? '0 Meals Balance · No Active Plan' : '剩余 0 餐券 · 暂无生效配套'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {language === 'en'
                      ? 'You are registered with 0 meals. You can decide which meal plan to subscribe to, or order ala carte on-demand.'
                      : '您的账号当前为 0 餐券状态。您可以自由决定订购哪种健康餐配套，或仅按需单点。'}
                  </p>
                </div>
              )}

              {/* Two clear decision paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Decision 1: Subscribe to a Meal Plan */}
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900">
                        {language === 'en' ? 'Subscribe to a Meal Plan' : '购买健康餐配套 (推荐)'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {language === 'en'
                          ? 'Save up to 25%, enjoy complimentary scheduled delivery, standard chef recipes, and instantly unlock this Calorie Matcher.'
                          : '最高立省 25%、免运费准时送达、主厨科学配比出品，并即刻解锁量身热量计算器。'}
                      </p>
                    </div>

                    <ul className="text-[11px] text-stone-600 space-y-1 pt-1">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'en' ? '5-Day, 10-Day, or 20-Day Plans' : '5天体验、10天或20天周期配套'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'en' ? 'Unlocks Calorie & Macro Calculator' : '完整解锁会员热量计算器'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'en' ? 'Free Klang Valley Delivery' : '巴生及雪隆区免费送餐'}</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenPlans) onOpenPlans();
                    }}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{language === 'en' ? 'View & Choose Meal Plans' : '浏览并订购健康配套'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Decision 2: Order Ala Carte Only */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-stone-300 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900">
                        {language === 'en' ? 'Order Ala Carte Only' : '仅单点轻食外卖'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {language === 'en'
                          ? 'Zero subscription commitment. Order individual signature chef bentos and custom low-carb bowls on-demand.'
                          : '无需订购套餐。随心单点每日招牌便当、花椰菜米换购、加肉加蛋与定制轻食。'}
                      </p>
                    </div>

                    <ul className="text-[11px] text-stone-600 space-y-1 pt-1">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{language === 'en' ? 'No upfront package required' : '无需预付套餐，随点随送'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{language === 'en' ? 'Full recipe customization allowed' : '支持花椰菜米/主食肉量加料'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{language === 'en' ? 'Instant checkout to WhatsApp' : '支持在线购物车与快捷结算'}</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenMenu) onOpenMenu();
                    }}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{language === 'en' ? 'Order Ala Carte Today' : '进入招牌菜单单点'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Already Subscribed? Member Login Path */}
              {!currentMember && (
                <div className="pt-2 border-t border-stone-200 text-center">
                  <p className="text-xs text-stone-500 mb-2">
                    {language === 'en'
                      ? 'Already purchased a meal plan under your phone number?'
                      : '已购买过健康餐配套？请使用手机号码登录会员账号以验证权限：'}
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenMemberPortal) onOpenMemberPortal();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'en' ? 'Log In to Member Account' : '会员登录 / 验证配套'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
             UNLOCKED STATE: GRANTED TO WHOM HAS PURCHASED MEAL PLAN
             ========================================================================= */
          <div>
            {/* Header */}
            <div className="bg-emerald-900 text-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'CHILL Smart Matcher' : '潮轻食 · 智能热量匹配'}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 text-[11px] font-semibold border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {language === 'en'
                      ? `Verified Subscriber: ${currentMember?.activePackage?.remainingMeals || 0} Meals Balance`
                      : `配套特权已解锁：剩余 ${currentMember?.activePackage?.remainingMeals || 0} 餐`}
                  </span>
                </div>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
                {language === 'en' ? 'Find Your Perfect Meal Box' : '量身定制您的减脂/增肌卡路里'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-lg">
                {language === 'en'
                  ? 'Calculate your daily energy expenditure and instantly match meal boxes designed for your body goal.'
                  : '输入您的身体数据与生活目标，系统将自动核算推荐每日摄入及契合度最高的轻食餐盒。'}
              </p>
            </div>

            {/* Form Inputs */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Goal selection */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  {language === 'en' ? '1. Your Primary Goal' : '1. 您的首要目标'}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => setGoal('loss')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      goal === 'loss'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Flame className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <span className="text-xs sm:text-sm block">
                      {language === 'en' ? 'Fat Loss / Cut' : '轻体减脂'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">-450 kcal deficit</span>
                  </button>

                  <button
                    onClick={() => setGoal('maintain')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      goal === 'maintain'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Heart className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs sm:text-sm block">
                      {language === 'en' ? 'Maintain Health' : '维持日常活力'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Balanced fuel</span>
                  </button>

                  <button
                    onClick={() => setGoal('muscle')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      goal === 'muscle'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Dumbbell className="w-5 h-5 mx-auto mb-1 text-sky-600" />
                    <span className="text-xs sm:text-sm block">
                      {language === 'en' ? 'Muscle Gain' : '增肌塑形'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">High protein</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    {language === 'en' ? 'Gender' : '性别'}
                  </label>
                  <div className="flex rounded-xl border border-stone-200 overflow-hidden">
                    <button
                      onClick={() => setGender('female')}
                      className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        gender === 'female' ? 'bg-emerald-700 text-white' : 'bg-white text-stone-600'
                      }`}
                    >
                      {language === 'en' ? 'Female' : '女性'}
                    </button>
                    <button
                      onClick={() => setGender('male')}
                      className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        gender === 'male' ? 'bg-emerald-700 text-white' : 'bg-white text-stone-600'
                      }`}
                    >
                      {language === 'en' ? 'Male' : '男性'}
                    </button>
                  </div>
                </div>

                {/* Current Weight */}
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    {language === 'en' ? 'Weight (kg)' : '体重 (公斤)'}
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Daily Activity */}
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    {language === 'en' ? 'Activity Level' : '日常活动强度'}
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="desk">{language === 'en' ? 'Desk Job / Sedentary' : '办公室静坐久坐'}</option>
                    <option value="moderate">{language === 'en' ? 'Light Workouts 2-3x' : '每周运动2-3次'}</option>
                    <option value="active">{language === 'en' ? 'Heavy Training / Gym' : '高强度健身训练'}</option>
                  </select>
                </div>
              </div>

              {/* Results Display */}
              <div className="bg-stone-900 rounded-3xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    {language === 'en' ? 'Target Daily Energy' : '建议每日目标热量'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-heading text-3xl font-black text-white">{targetCalories}</span>
                    <span className="text-xs text-stone-400">kcal / day</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-stone-700 hidden sm:block" />

                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    {language === 'en' ? 'Daily Protein Goal' : '每日蛋白质目标'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-heading text-3xl font-black text-amber-400">{targetProtein}</span>
                    <span className="text-xs text-stone-400">g / day</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-stone-700 hidden sm:block" />

                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    {language === 'en' ? 'Ideal Lunch Portion' : '理想午餐热量'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-heading text-xl font-extrabold text-stone-200">
                      {Math.round(targetCalories * 0.35)} - {Math.round(targetCalories * 0.42)}
                    </span>
                    <span className="text-xs text-stone-400">kcal</span>
                  </div>
                </div>
              </div>

              {/* Matched Meal Recommendations */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                  {language === 'en' ? 'Top Matched Bento Boxes for You' : '为您精选的最优轻食餐盒'}
                </h4>

                <div className="space-y-3">
                  {recommendedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => {
                        onSelectRecommendedMeal(meal);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={meal.image}
                          alt={meal.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                          }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-emerald-800 transition-colors">
                            {language === 'en' ? meal.name : meal.nameZh}
                          </h5>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            <span className="text-emerald-700 font-bold">{meal.calories} kcal</span>
                            <span>·</span>
                            <span className="text-amber-700 font-bold">{meal.protein}g Protein</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          RM {meal.price.toFixed(2)}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
