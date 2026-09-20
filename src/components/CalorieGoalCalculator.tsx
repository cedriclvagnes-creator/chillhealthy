import React, { useState } from 'react';
import { X, Sparkles, Flame, Dumbbell, Heart, ArrowRight, Check } from 'lucide-react';
import { Language, MealItem } from '../types';
import { MEAL_ITEMS } from '../data/menuData';

interface CalorieGoalCalculatorProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendedMeal: (meal: MealItem) => void;
}

export const CalorieGoalCalculator: React.FC<CalorieGoalCalculatorProps> = ({
  language,
  isOpen,
  onClose,
  onSelectRecommendedMeal,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [goal, setGoal] = useState<'loss' | 'maintain' | 'muscle'>('loss');
  const [weight, setWeight] = useState(62);
  const [activity, setActivity] = useState<'desk' | 'moderate' | 'active'>('desk');

  if (!isOpen) return null;

  // Simple, robust BMR/TDEE calculation
  const bmr = gender === 'male' ? 10 * weight + 6.25 * 172 - 5 * 28 + 5 : 10 * weight + 6.25 * 162 - 5 * 28 - 161;
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
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'CHILL Smart Matcher' : '潮轻食 · 智能热量匹配'}</span>
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
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
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
    </div>
  );
};
