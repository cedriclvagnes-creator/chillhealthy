import React, { useState } from 'react';
import { 
  Instagram, 
  Facebook, 
  ExternalLink, 
  Sparkles, 
  CheckCircle, 
  Share2, 
  MessageCircle, 
  Copy, 
  Check, 
  Heart, 
  Camera, 
  Gift, 
  ArrowUpRight 
} from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface InstagramFeedSectionProps {
  language: Language;
  siteSettings: SiteSettings;
  onSelectMealByName?: (mealName: string) => void;
}

export const InstagramFeedSection: React.FC<InstagramFeedSectionProps> = ({
  language,
  siteSettings,
}) => {
  const [copiedLink, setCopiedLink] = useState<'ig' | 'fb' | null>(null);

  const instagramUrl = siteSettings.instagramUrl || 'https://www.instagram.com/chillhealthybox/';
  const instagramHandle = siteSettings.instagramHandle || '@chillhealthybox';
  const facebookUrl = siteSettings.facebookUrl || 'https://www.facebook.com/chillhealthy88';
  const waBaseUrl = buildWhatsAppUrl(
    siteSettings.whatsappNumber,
    'Hi CHILL Healthy, I tagged you on social media with my bento photo! Would love to claim my follower perk.'
  );

  const handleCopy = (type: 'ig' | 'fb', url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const isEn = language === 'en';

  return (
    <section id="instagram" className="py-16 sm:py-20 bg-stone-100/80 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Official Social Media' : '官方社交媒体'}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isEn ? 'Follow Us on Facebook & Instagram' : '关注我们的 Facebook 与 Instagram'}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isEn
              ? 'Stay updated with our daily kitchen prep, seasonal healthy specials, member perks, and customer reviews. Follow our official channels below!'
              : '第一时间获取每日低温慢煮实况、招牌轻食新品、专属会员福利与真实顾客晒单。欢迎关注我们的官方社群账号！'}
          </p>
        </div>

        {/* Dual Social Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-10">
          
          {/* 1. Instagram Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600" />

            <div>
              {/* Header: Logo & Badge */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  {/* IG Story Gradient Ring */}
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-sm shrink-0">
                    <div className="w-14 h-14 rounded-full bg-white p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={siteSettings.logoUrl || '/chill-healthy-logo.svg'}
                        alt="CHILL Healthy Instagram"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                      <Instagram className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-stone-900">
                        chillhealthybox
                      </h3>
                      <CheckCircle className="w-4 h-4 fill-blue-600 text-white shrink-0" />
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      Instagram · {isEn ? 'Official Account' : '官方认证账号'}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-bold shrink-0">
                  {instagramHandle}
                </span>
              </div>

              {/* Bio & Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                {isEn
                  ? '🌿 Daily fresh healthy bentos in Klang Valley · 0% MSG · High protein sous-vide craft · Office & home delivery. Tag us @chillhealthybox in your meal stories to get featured!'
                  : '🌿 巴生河流域法式低温慢煮健康餐盒 · 0味精 · 高蛋白营养配比 · 每日新鲜现做配送。在 IG 晒图 @chillhealthybox 即享专属优惠！'}
              </p>

              {/* Feature Points */}
              <div className="space-y-2 mb-6 text-xs text-stone-700 bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  <span className="font-medium">
                    {isEn ? 'Daily fresh meal photos & cooking reels' : '每日新鲜轻食美图与慢煮短视频'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  <span className="font-medium">
                    {isEn ? 'Customer story reposts & monthly giveaways' : '会员打卡晒图转发与月度抽奖福利'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="font-medium">
                    {isEn ? 'Nutrition facts & weekly menu drops' : '热量与三大营养素解析及每周新菜'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>{isEn ? 'Follow on Instagram' : '关注官方 Instagram'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={() => handleCopy('ig', instagramUrl)}
                className="p-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer border border-stone-200 shrink-0"
                title={isEn ? 'Copy Instagram URL' : '复制 Instagram 链接'}
              >
                {copiedLink === 'ig' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 2. Facebook Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top blue accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1877F2]" />

            <div>
              {/* Header: Logo & Badge */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  {/* FB Blue Ring */}
                  <div className="relative p-0.5 rounded-full bg-[#1877F2] shadow-sm shrink-0">
                    <div className="w-14 h-14 rounded-full bg-white p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={siteSettings.logoUrl || '/chill-healthy-logo.svg'}
                        alt="CHILL Healthy Facebook"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#1877F2] text-white p-1 rounded-full border-2 border-white shadow-xs">
                      <Facebook className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-stone-900">
                        CHILL Healthy 潮轻食
                      </h3>
                      <CheckCircle className="w-4 h-4 fill-[#1877F2] text-white shrink-0" />
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      Facebook · {isEn ? 'Official Page' : '官方主页'}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-[11px] font-bold shrink-0">
                  @chillhealthy88
                </span>
              </div>

              {/* Bio & Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                {isEn
                  ? 'Connect with our Facebook community for official announcements, public holiday delivery schedules, corporate big group orders (>100 boxes), and genuine customer reviews.'
                  : '加入我们的 Facebook 官方社群，获取最新营业公告、银行公假配送安排、大宗企业团餐定制（100盒以上免运费）及会员真实评价。'}
              </p>

              {/* Feature Points */}
              <div className="space-y-2 mb-6 text-xs text-stone-700 bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]"></span>
                  <span className="font-medium">
                    {isEn ? 'Official holiday schedule & delivery advisories' : '官方银行公假与厨房配送日程公告'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="font-medium">
                    {isEn ? 'Corporate bulk orders & catering consultation' : '企业大宗订餐与定制活动团餐咨询'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="font-medium">
                    {isEn ? 'Customer reviews & direct messenger concierge' : '顾客真实评价与专属客服在线咨询'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Facebook className="w-4 h-4" />
                <span>{isEn ? 'Follow on Facebook' : '关注官方 Facebook'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={() => handleCopy('fb', facebookUrl)}
                className="p-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer border border-stone-200 shrink-0"
                title={isEn ? 'Copy Facebook URL' : '复制 Facebook 链接'}
              >
                {copiedLink === 'fb' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Community Tag & Reward Callout Banner */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-700/80 p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white">
                {isEn ? 'Tag @chillhealthybox in Your Story!' : '在 IG / FB 晒单 @chillhealthybox'}
              </h4>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                {isEn
                  ? 'Snap a photo of your fresh lunch bento, tag us on Instagram or Facebook, and send us a screenshot on WhatsApp for a special reward!'
                  : '收到热腾腾的健康便当后，拍照并在 IG 或 FB 标记我们，截图发给 WhatsApp 客服即可领取专属惊喜！'}
              </p>
            </div>
          </div>

          <a
            href={waBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-stone-950" />
            <span>{isEn ? 'Send Us Your Tag' : '联系客服领福利'}</span>
          </a>
        </div>

      </div>
    </section>
  );
};
