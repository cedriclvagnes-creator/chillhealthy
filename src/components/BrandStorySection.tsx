import React from 'react';
import { Heart, Sparkles, ShieldCheck, Flame, Leaf, AlertTriangle, CheckCircle, MessageCircle, Instagram, Edit3 } from 'lucide-react';
import { Language, SiteSettings, HomepageContent } from '../types';
import { CraftedWithCarePhoto } from './CraftedWithCarePhoto';

interface BrandStorySectionProps {
  language: Language;
  siteSettings: SiteSettings;
  content?: HomepageContent;
  isEditMode?: boolean;
  onEditStory?: () => void;
}

export const BrandStorySection: React.FC<BrandStorySectionProps> = ({
  language,
  siteSettings,
  content,
  isEditMode = false,
  onEditStory,
}) => {
  const storyTag = content
    ? (language === 'en' ? content.storyTagEn : content.storyTagZh)
    : (language === 'en' ? 'Crafted with care' : '用心手作 · 严选天然');

  const storyHeadline = content
    ? (language === 'en' ? content.storyHeadlineEn : content.storyHeadlineZh)
    : (language === 'en' ? 'Why CHILL Healthy Bento Tastes So Much Better' : '为什么潮轻食能做到 低卡却极致入味？');

  const storySubtitle = content
    ? (language === 'en' ? content.storySubtitleEn : content.storySubtitleZh)
    : (language === 'en' ? '— Crafted with care, everyday in our central kitchen' : '— 每一份，皆是用心手作的健康温度');

  const storyDescription = content
    ? (language === 'en' ? content.storyDescriptionEn : content.storyDescriptionZh)
    : (language === 'en'
        ? 'Most people give up on diets not because of lack of willpower, but because traditional diet food is dry, tasteless, and exhausting to maintain. At CHILL Healthy, we combine modern sous-vide culinary science with authentic Asian home-cooking flavors so you can eat clean consistently without feeling deprived.'
        : '绝大多数人减脂失败，不是毅力不足，而是传统减脂餐太难下咽！CHILL Healthy 潮轻食突破传统束缚，将法式低温慢煮工艺与南洋风味巧妙结合，坚持0味精、低盐低油，让每天的健康午餐成为期待已久的生活享受。');

  return (
    <section id="story" className={`py-16 sm:py-20 bg-stone-50 border-b relative ${
      isEditMode ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200'
    }`}>
      {/* Edit Story Button */}
      {isEditMode && onEditStory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button
            type="button"
            onClick={onEditStory}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md border border-amber-300 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{language === 'en' ? 'Edit Brand Story & Kitchen Photo' : '编辑品牌故事与厨房照片'}</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Visual Brand Story Collage */}
          <div className="lg:col-span-5 relative">
            <CraftedWithCarePhoto
              language={language}
              photoUrl={siteSettings?.kitchenPhotoUrl || content?.kitchenPhotoUrl}
            />

            {/* Official Instagram callout */}
            <a
              href="https://www.instagram.com/chillhealthybox/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3 shadow-xs hover:border-pink-300 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-xs shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                    <span>CHILL Healthy</span>
                    <span className="text-[11px] font-bold text-pink-600">@chillhealthybox</span>
                  </p>
                  <p className="text-[11px] text-[#3b6026] font-medium truncate">
                    {language === 'en'
                      ? 'Official Instagram · Daily Prep & Meal Posts'
                      : '官方 Instagram · 每日便当制作与真实顾客分享'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-xl border border-pink-200 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:text-white transition-all shrink-0">
                {language === 'en' ? 'Follow IG' : '关注 IG'}
              </span>
            </a>
          </div>

          {/* Right Column: Mission & Commitments */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3b6026]/10 text-[#3b6026] text-xs font-bold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Crafted with care' : '用心手作 · 严选天然'}</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              {language === 'en' ? (
                <>
                  Why CHILL Healthy Bento Tastes <span className="text-[#3b6026]">So Much Better</span>
                </>
              ) : (
                <>
                  为什么潮轻食能做到 <span className="text-[#3b6026]">低卡却极致入味</span>？
                </>
              )}
            </h2>

            <p className="text-[#3b6026] font-medium text-sm sm:text-base font-serif italic -mt-2">
              {language === 'en' ? '— Crafted with care, everyday in our central kitchen' : '— 每一份，皆是用心手作的健康温度'}
            </p>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? 'Most people give up on diets not because of lack of willpower, but because traditional diet food is dry, tasteless, and exhausting to maintain. At CHILL Healthy, we combine modern sous-vide culinary science with authentic Asian home-cooking flavors so you can eat clean consistently without feeling deprived.'
                : '绝大多数人减脂失败，不是毅力不足，而是传统减脂餐太难下咽！CHILL Healthy 潮轻食突破传统束缚，将法式低温慢煮工艺与南洋风味巧妙结合，坚持0味精、低盐低油，让每天的健康午餐成为期待已久的生活享受。'}
            </p>

            {/* 4 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? '65°C Precision Sous-Vide' : '65°C 低温真空慢煮'}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {language === 'en'
                    ? 'Chicken breast and steaks are gently cooked in their natural juices. Never rubbery, perfectly tender.'
                    : '将新鲜鸡胸肉及安格斯牛肉锁鲜慢煮数小时，保留天然水分与肌红蛋白，鲜嫩多汁。'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? '0% MSG & Zero Trans Fats' : '0% 味精 · 零反式脂肪'}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {language === 'en'
                    ? 'Only cold-pressed extra virgin olive oil, cold-pressed coconut oil, and natural sea salt.'
                    : '杜绝化学增味剂，仅使用特级初榨橄榄油与纯正草本香料提鲜，告别水肿。'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Real Whole Carbs' : '优质慢碳复合主食'}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {language === 'en'
                    ? 'Organic Andean quinoa, unpolished multi-grain brown rice, pure buckwheat soba, or grated cauliflower.'
                    : '严选原粒糙米、三色藜麦与纯荞麦面，提供平稳持久能量，杜绝下午办公犯困。'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Fresh Sourced at 5 AM' : '每日清晨5点现烹'}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {language === 'en'
                    ? 'Vegetables and farm-fresh poultry prepped daily in our Klang central kitchen. Never frozen pre-packs.'
                    : '巴生中央厨房每日清晨接收鲜采蔬菜与冷鲜禽肉，当天新鲜烹饪，绝不用过夜隔夜菜。'}
                </p>
              </div>
            </div>

            {/* Official Advisory / Scam Warning Box (faithfully matching chillhealthy's official safety message!) */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">
                  {language === 'en'
                    ? 'Official Customer Advisory (Official Channels Only):'
                    : 'CHILL Healthy 潮轻食 · 官方防伪与订餐安全警示：'}
                </span>
                <p className="leading-relaxed text-amber-800">
                  {language === 'en'
                    ? `Please ensure you only order via chill-healthy.com or our verified WhatsApp (+60 ${siteSettings.whatsappNumber}). Be cautious of fake social media ads promoting unrealistic promotions.`
                    : `请认准官方订餐平台 chill-healthy.com 及官方唯一客服 WhatsApp（${siteSettings.whatsappDisplay}）。请广大顾客警惕第三方仿冒广告及不实低价活动，官方品质用心保障。`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
