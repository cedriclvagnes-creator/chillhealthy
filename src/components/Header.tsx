import React, { useState } from 'react';
import {
  ShoppingBag,
  Menu,
  X,
  Phone,
  MessageCircle,
  Globe,
  Sparkles,
  Clock,
  MapPin,
  User,
  Shield,
  CheckCircle,
  Instagram,
  Lock,
  Check,
  UtensilsCrossed,
  Package,
  FileCheck,
  Leaf,
  Truck,
} from 'lucide-react';
import { Language, CartItem, SiteSettings, MemberAccount } from '../types';
import { ChillLogo } from './ChillLogo';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenCalorieModal: () => void;
  siteSettings: SiteSettings;
  currentMember: MemberAccount | null;
  onOpenMemberPortal: () => void;
  onOpenBackOffice?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  cart,
  setIsCartOpen,
  activeSection,
  setActiveSection,
  onOpenCalorieModal,
  siteSettings,
  currentMember,
  onOpenMemberPortal,
  onOpenBackOffice,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calorie calculator is granted to customers who have purchased a meal plan
  const hasPurchasedMealPlan = Boolean(
    currentMember?.activePackage &&
    (currentMember.activePackage.totalMeals > 0 ||
      (currentMember.creditsHistory && currentMember.creditsHistory.length > 0))
  );

  // Robust WhatsApp link builder (+60126189919)
  const waBaseUrl = buildWhatsAppUrl(siteSettings.whatsappNumber);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -135;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div id="top-announcement-bar" className="bg-stone-900 text-stone-200 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {language === 'en' ? 'Daily Fresh Prep' : '每日新鲜现做'}
            </span>
            <span className="hidden sm:inline text-stone-500">|</span>
            <span className="hidden sm:inline text-stone-300 truncate max-w-xs md:max-w-md lg:max-w-xl text-[11px]">
              {language === 'en' ? siteSettings.announcementEn : siteSettings.announcementZh}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium shrink-0">
            <a
              id="instagram-top-link"
              href="https://www.instagram.com/chillhealthybox/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer whitespace-nowrap"
              title="Instagram @chillhealthybox"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@chillhealthybox</span>
            </a>

            <a
              id="whatsapp-top-link"
              href={`${waBaseUrl}?text=Hello%20CHILL%20Healthy%20team,%20I%20would%20like%20to%20inquire%20about%20meal%20orders!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">WhatsApp: </span><span>{siteSettings.whatsappDisplay}</span>
            </a>

            {/* Language switch button */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer whitespace-nowrap font-medium"
              title="Switch Language / 切换语言"
            >
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px]">{language === 'en' ? '切换华语' : 'Switch to EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Header (Two-Tier Clean Architecture) */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
        {/* Tier 1: Brand Identity & Key User Actions Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-4">
            {/* Left: Brand Logo & Tagline */}
            <div
              id="brand-logo-container"
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-3 cursor-pointer group shrink-0"
            >
              <ChillLogo variant="badge" size="md" className="group-hover:scale-105 transition-transform shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-heading font-black text-2xl sm:text-2xl tracking-tight text-stone-900 whitespace-nowrap">
                    CHILL<span className="text-[#3b6026]">HEALTHY</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold tracking-wider shrink-0">
                    潮轻食
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-stone-500 font-medium tracking-wide whitespace-nowrap">
                  {language === 'en' ? 'Clean Eating · High Protein · Zero MSG' : '科学营养 · 低卡高蛋白 · 0添加'}
                </span>
              </div>
            </div>

            {/* Right: Actions Bar (WhatsApp, Member Portal, Cart & Mobile Toggle) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* WhatsApp Direct Concierge */}
              <a
                id="whatsapp-header-button"
                href={`${waBaseUrl}?text=Hi%20CHILL%20Healthy,%20I'd%20like%20to%20order%20meals!`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 whitespace-nowrap cursor-pointer hover:shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{language === 'en' ? 'WhatsApp Order' : 'WhatsApp订餐'}</span>
              </a>

              {/* Member Login & Meal Balance Monitor Button */}
              <button
                id="member-portal-btn"
                onClick={onOpenMemberPortal}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
                  currentMember
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
                title="Member Package Login & Daily Meal Balance"
              >
                <div className="relative shrink-0">
                  <User className="w-4 h-4 text-emerald-700" />
                  {currentMember && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />
                  )}
                </div>
                {currentMember ? (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="hidden sm:inline font-bold text-stone-800">{currentMember.name.split(' ')[0]}</span>
                    <span className="hidden sm:inline text-stone-300">|</span>
                    <span className="text-[11px] bg-emerald-700 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                      {currentMember.activePackage && currentMember.activePackage.remainingMeals > 0
                        ? `${currentMember.activePackage.remainingMeals} Meals`
                        : language === 'en'
                        ? '0 Meals'
                        : '0餐额'}
                    </span>
                  </span>
                ) : (
                  <span className="whitespace-nowrap">
                    <span className="hidden sm:inline">{language === 'en' ? 'Member Portal' : '会员中心'}</span>
                    <span className="sm:hidden">{language === 'en' ? 'Login' : '会员'}</span>
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                id="cart-drawer-trigger"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">{language === 'en' ? 'Cart' : '餐篮'}</span>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-extrabold">
                    {totalItems}
                  </span>
                )}
                {totalItems > 0 && (
                  <span className="hidden sm:inline text-xs text-stone-300 font-semibold pl-1 border-l border-stone-700">
                    RM {cartTotal.toFixed(2)}
                  </span>
                )}
              </button>

              {/* Mobile menu hamburger toggle */}
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Navigation Menu Bar (Full Width, Centered, Visible & Responsive) */}
        <div className="border-t border-stone-200/80 bg-stone-50/80 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <nav
              id="desktop-nav"
              className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 py-1.5 sm:py-2"
            >
              {/* 1. Meal Menu */}
              <button
                id="nav-link-menu"
                onClick={() => scrollToSection('menu')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'menu'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'en' ? 'Meal Menu' : '招牌轻食菜单'}</span>
              </button>

              {/* 2. Meal Plans */}
              <button
                id="nav-link-plans"
                onClick={() => scrollToSection('plans')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'plans'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{language === 'en' ? 'Meal Plans' : '健康餐配套'}</span>
                <span className="hidden xl:inline text-stone-500 font-normal text-xs">
                  {language === 'en' ? '(1–6 Pax)' : '(1-6人)'}
                </span>
                <span className="ml-0.5 text-[10px] bg-amber-500/15 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-300/60 shrink-0">
                  {language === 'en' ? 'From RM398' : 'RM398起'}
                </span>
              </button>

              {/* 3. Confirm Order Guide */}
              <button
                id="nav-link-order-guide"
                onClick={() => scrollToSection('order-guide')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'order-guide'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{language === 'en' ? 'Order Guide' : '订单确认指南'}</span>
              </button>

              {/* 4. Calorie Matcher Tool */}
              <button
                id="nav-link-calculator"
                onClick={onOpenCalorieModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 hover:shadow-2xs whitespace-nowrap transition-all cursor-pointer border border-emerald-200/80"
                title={
                  hasPurchasedMealPlan
                    ? language === 'en'
                      ? 'Calorie Matcher (Subscriber Perk Unlocked)'
                      : '热量规划计算器 (配套会员已解锁)'
                    : language === 'en'
                    ? 'Calorie Matcher (Exclusive to Meal Plan Subscribers)'
                    : '热量规划计算器 (健康餐配套订购会员专属)'
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'en' ? 'Calorie Matcher' : '热量规划测算'}</span>
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0 ${
                    hasPurchasedMealPlan
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {hasPurchasedMealPlan ? (
                    'VIP'
                  ) : (
                    <>
                      <Lock className="w-2.5 h-2.5" />
                      <span>{language === 'en' ? 'VIP' : '专属'}</span>
                    </>
                  )}
                </span>
              </button>

              {/* 5. Our Story */}
              <button
                id="nav-link-story"
                onClick={() => scrollToSection('story')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'story'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{language === 'en' ? 'Our Story' : '潮品牌理念'}</span>
              </button>

              {/* 6. Delivery Coverage */}
              <button
                id="nav-link-delivery"
                onClick={() => scrollToSection('delivery')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'delivery'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span>{language === 'en' ? 'Delivery Coverage' : '配送范围'}</span>
              </button>

              {/* 7. IG Posts */}
              <button
                id="nav-link-instagram"
                onClick={() => scrollToSection('instagram')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === 'instagram'
                    ? 'bg-pink-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-pink-700 hover:bg-white hover:shadow-2xs'
                }`}
                title="Instagram @chillhealthybox"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span>{language === 'en' ? 'IG Posts' : '官方 IG'}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu-drawer"
            className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top duration-150 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain"
          >
            {/* Mobile Member Portal Quick Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMemberPortal();
              }}
              className="w-full text-left py-3 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 font-normal">
                    {currentMember ? 'Logged in / 已登录' : 'Member Account / 会员账户'}
                  </p>
                  <p className="text-sm font-extrabold text-stone-900">
                    {currentMember
                      ? `Hi, ${currentMember.name} (${currentMember.activePackage?.remainingMeals || 0} Meals)`
                      : language === 'en'
                      ? 'Member Portal · Login'
                      : '会员中心 · 会员登录与餐券'}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg shrink-0">
                {currentMember ? 'Redeem' : 'Login'}
              </span>
            </button>

            {/* Navigation links in mobile drawer */}
            <div className="space-y-1 pt-1">
              <button
                onClick={() => scrollToSection('menu')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-3 cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{language === 'en' ? 'Meal Menu (24 Choices)' : '招牌轻食菜单 (24款精选)'}</span>
              </button>

              <button
                onClick={() => scrollToSection('plans')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-stone-800 font-semibold hover:bg-stone-100 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{language === 'en' ? 'Meal Plans (1–6 Persons)' : '健康餐配套计划 (1-6人)'}</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">From RM398</span>
              </button>

              <button
                onClick={() => scrollToSection('order-guide')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-3 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{language === 'en' ? 'Confirm Order Guide' : '订单确认指南 ｜ Order Guide'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCalorieModal();
                }}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-emerald-800 font-semibold hover:bg-emerald-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{language === 'en' ? 'Calorie Matcher Tool' : '热量规划与目标测算器'}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    hasPurchasedMealPlan
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {hasPurchasedMealPlan ? (
                    'VIP'
                  ) : (
                    <>
                      <Lock className="w-2.5 h-2.5" />
                      <span>{language === 'en' ? 'Perk' : '专属'}</span>
                    </>
                  )}
                </span>
              </button>

              <button
                onClick={() => scrollToSection('story')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-3 cursor-pointer"
              >
                <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{language === 'en' ? 'Our Brand Story' : '关于潮轻食品牌故事'}</span>
              </button>

              <button
                onClick={() => scrollToSection('delivery')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-3 cursor-pointer"
              >
                <Truck className="w-4 h-4 text-stone-600 shrink-0" />
                <span>{language === 'en' ? 'Delivery Coverage' : '配送区域与免费送达'}</span>
              </button>

              <button
                onClick={() => scrollToSection('instagram')}
                className="w-full text-left py-2.5 px-3.5 rounded-xl text-pink-700 font-semibold hover:bg-pink-50 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>{language === 'en' ? 'Official Instagram' : '官方 Instagram 动态'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">@chillhealthybox</span>
              </button>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="pt-3 border-t border-stone-200/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setLanguage(language === 'en' ? 'zh' : 'en');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-stone-800 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>{language === 'en' ? '切换为中文版 (华语)' : 'Switch to English'}</span>
              </button>

              <a
                href={waBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: {siteSettings.whatsappDisplay}</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
