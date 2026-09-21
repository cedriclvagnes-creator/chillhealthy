import React from 'react';
import { MessageCircle, Phone, MapPin, Clock, Heart, ShieldCheck, Instagram, Facebook, User, Settings, Shield } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { ChillLogo } from './ChillLogo';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface FooterProps {
  language: Language;
  siteSettings: SiteSettings;
  onNavigate: (sectionId: string) => void;
  onOpenCalorie: () => void;
  onOpenMemberPortal: () => void;
  onOpenBackOffice?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  siteSettings,
  onNavigate,
  onOpenCalorie,
  onOpenMemberPortal,
  onOpenBackOffice,
}) => {
  return (
    <footer id="footer" className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <ChillLogo variant="badge" size="md" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-2xl tracking-tight text-white">
                    CHILL<span className="text-[#528c34]">HEALTHY</span>
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold">
                    潮轻食
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">chill-healthy.com</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              {language === 'en'
                ? 'CHILL Healthy (潮轻食) believes in the power of wholesome, delicious food to transform your energy, body composition, and daily lifestyle. Cooked fresh daily in Klang.'
                : 'CHILL Healthy 潮轻食坚信健康饮食也可以极致美味。从低温真空慢煮鲜肉到每日新鲜配菜，专注为巴生河流域提供高品质健康工作午餐与轻食外卖。'}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={buildWhatsAppUrl(siteSettings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 hover:bg-emerald-800 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={`WhatsApp: ${siteSettings.whatsappDisplay}`}
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={siteSettings.facebookUrl || "https://www.facebook.com/chillhealthy88"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 text-stone-300 hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="Facebook: @chillhealthy88"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={siteSettings.instagramUrl || "https://www.instagram.com/chillhealthybox/"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 text-stone-300 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Instagram @chillhealthybox"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
              {language === 'en' ? 'Healthy Meal Services' : '轻食菜单与定制'}
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigate('menu')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  {language === 'en' ? 'Signature Bento Menu' : '招牌营养餐盒单点'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('plans')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  {language === 'en' ? 'Meal Plans (1–6 Persons)' : '健康餐配套 (单人至六人)'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('order-guide')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  {language === 'en' ? 'Confirm Order Guide' : '订单确认指南 ｜ Confirm Order'}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenCalorie}
                  className="hover:text-emerald-400 transition-colors text-left text-emerald-400 font-semibold cursor-pointer"
                >
                  {language === 'en' ? 'Calorie & TDEE Matcher' : '热量与宏量营养计算器'}
                </button>
              </li>
              <li className="pt-2 border-t border-stone-800 flex flex-col gap-2">
                <button
                  onClick={onOpenMemberPortal}
                  className="hover:text-white transition-colors text-left text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Member Portal · Redeem Meals' : '会员中心 · 兑换每日餐盒'}</span>
                </button>

                {onOpenBackOffice && (
                  <a
                    href="#admin"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = '#admin';
                      onOpenBackOffice();
                    }}
                    className="hover:text-amber-400 text-stone-400 transition-colors text-left text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Owner Admin (#admin)' : '店主后台 (#admin)'}</span>
                  </a>
                )}
              </li>
            </ul>
          </div>

          {/* Col 3: Kitchen & Delivery Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
              {language === 'en' ? 'Kitchen & Ordering Contact' : '中央厨房与客服信息'}
            </h4>

            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{siteSettings.kitchenAddress}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  WhatsApp:{' '}
                  <a
                    href={buildWhatsAppUrl(siteSettings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-emerald-400 font-bold underline decoration-stone-600 cursor-pointer"
                  >
                    {siteSettings.whatsappDisplay}
                  </a>{' '}
                  (Official Concierge)
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? (siteSettings.kitchenHours || 'Monday to Friday: 8:30 AM – 7:30 PM')
                    : '营业时间：周一至周五 8:30 AM – 7:30 PM'}
                </span>
              </div>
            </div>

            {/* Official note */}
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/80 text-[11px] text-stone-300">
              <span className="font-bold text-amber-400 block mb-0.5">
                {language === 'en' ? 'Official Channels Advisory:' : '认准官方唯一订餐通道:'}
              </span>
              {language === 'en'
                ? `Official orders are processed exclusively through chill-healthy.com and our verified WhatsApp at ${siteSettings.whatsappDisplay}. Follow our daily meal creations on Instagram: @chillhealthybox.`
                : `请注意仅通过官方网站 chill-healthy.com 及官方客服 WhatsApp ${siteSettings.whatsappDisplay} 订餐，谨防网络第三方仿冒链接。关注官方 Instagram：@chillhealthybox。`}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} CHILL Healthy (潮轻食) · chill-healthy.com. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span>Halal-Sourced Poultry</span>
            <span>·</span>
            <span>0% MSG Certified</span>
            <span>·</span>
            <span>WhatsApp: {siteSettings.whatsappDisplay}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
