import React from 'react';
import { ArrowRight, ShieldCheck, Flame, Leaf, Clock, Sparkles, Star, Award, HeartHandshake, UtensilsCrossed, Edit3 } from 'lucide-react';
import { Language, HomepageContent } from '../types';
import { AlaCarteCombinationPhoto } from './AlaCarteCombinationPhoto';

interface HeroBannerProps {
  language: Language;
  onExploreMenu: () => void;
  onViewPlans: () => void;
  onViewOrderGuide?: () => void;
  content?: HomepageContent;
  isEditMode?: boolean;
  onEditHero?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onExploreMenu,
  onViewPlans,
  onViewOrderGuide,
  content,
  isEditMode = false,
  onEditHero,
}) => {
  const heroTag = content
    ? (language === 'en' ? content.heroTagEn : content.heroTagZh)
    : (language === 'en' ? 'Official CHILL Healthy (潮轻食) Kitchen' : 'CHILL Healthy 潮轻食 · 官方健康轻食厨房');

  const heroHeadline = content
    ? (language === 'en' ? content.heroHeadlineEn : content.heroHeadlineZh)
    : (language === 'en' ? "Eating Clean Shouldn't Be Boring." : '潮味轻食，让健康生活 毫不费力又美味');

  const heroDescription = content
    ? (language === 'en' ? content.heroDescriptionEn : content.heroDescriptionZh)
    : (language === 'en'
        ? 'Chef-crafted high-protein meal boxes, sous-vide tender meats, and whole-grain nutrition. Cooked fresh daily in Klang Valley with zero MSG, low sodium, and clean healthy oils. Fuel your body without sacrificing taste.'
        : '拒绝寡淡水煮菜！CHILL Healthy 潮轻食坚持每日清晨现做，以65°C低温真空慢煮鲜嫩鸡胸肉、现煎深海三文鱼排与有机原粒糙米，严格控制热量与三大营养素，准时热腾腾配送至您的办公桌与家中。');

  return (
    <section id="hero" className={`relative overflow-hidden bg-stone-100/70 pt-8 pb-16 lg:py-20 border-b ${
      isEditMode ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200/60'
    }`}>
      {/* Decorative background ambient circles */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

      {/* Edit Overlay Button */}
      {isEditMode && onEditHero && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <button
            type="button"
            onClick={onEditHero}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md border border-amber-300 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{language === 'en' ? 'Edit Hero Headline & Text' : '编辑主页首图与标题文案'}</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text / CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Brand Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800 text-white text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{heroTag}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15]">
              {heroHeadline}
            </h1>

            {/* Subheading / Description */}
            <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              {heroDescription}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-cta-plans"
                onClick={onViewPlans}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-700/20 transition-all hover:translate-y-[-1px] cursor-pointer"
              >
                <span>{language === 'en' ? 'View 1–6 Person Packages (RM398)' : '查看1至6人健康餐配套 (RM398起)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-cta-menu"
                onClick={onExploreMenu}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-sm sm:text-base shadow-xs transition-colors cursor-pointer"
              >
                <span>{language === 'en' ? 'Daily 26 Meal Menu' : '26款招牌菜单'}</span>
              </button>

              {onViewOrderGuide && (
                <button
                  id="hero-cta-guide"
                  onClick={onViewOrderGuide}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 font-bold text-sm sm:text-base transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Confirm Order Guide' : '订餐确认流程'}</span>
                </button>
              )}
            </div>

            {/* Quality Pillars */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">{language === 'en' ? '0% MSG' : '0% 味精添加'}</p>
                  <p className="text-stone-500">{language === 'en' ? 'Low sodium sea salt' : '天然海盐减钠'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">{language === 'en' ? '40g+ Protein' : '高蛋白低油脂'}</p>
                  <p className="text-stone-500">{language === 'en' ? 'Lean meat portions' : '足量优质蛋白'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-800 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">{language === 'en' ? 'Daily Fresh Prep' : '每日新鲜现做'}</p>
                  <p className="text-stone-500">{language === 'en' ? 'Cooked from 5:00 AM' : '拒绝预制冷冻包'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">{language === 'en' ? 'Klang Valley' : '全巴生谷配送'}</p>
                  <p className="text-stone-500">{language === 'en' ? 'Prompt hot delivery' : '准时送达办公室'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Bento Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Dish Frame: Combination of Ala Carte Bento Showcase */}
              <AlaCarteCombinationPhoto
                language={language}
                onExploreMenu={onExploreMenu}
                allowEdit={isEditMode}
              />

              {/* Floating Highlight Card 1: 24 Ala Carte Choices */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-stone-200/80 flex items-center gap-3 max-w-[220px] z-30 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    {language === 'en' ? '24 Ala Carte Choices' : '24款单点精选'}
                  </p>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {language === 'en' ? 'Clean daily meals from RM13.90' : '营养减脂餐 RM13.90 起'}
                  </p>
                </div>
              </div>

              {/* Floating Highlight Card 2: Social Proof Rating */}
              <div className="absolute -bottom-5 -right-3 sm:-right-5 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-stone-200/80 flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="Customer"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="Customer"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80"
                    alt="Customer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-xs font-bold text-stone-900">4.9 / 5.0</span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    {language === 'en' ? '120k+ Meals Delivered' : '巴生谷超12万份口碑见证'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
