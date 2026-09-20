import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Phone, MessageCircle, Globe, Sparkles, Clock, MapPin, User, Shield, CheckCircle } from 'lucide-react';
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

  // Robust WhatsApp link builder (+60126189919)
  const waBaseUrl = buildWhatsAppUrl(siteSettings.whatsappNumber);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div id="top-announcement-bar" className="bg-stone-900 text-stone-200 text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {language === 'en' ? 'Daily Fresh Prep' : '每日新鲜现做'}
            </span>
            <span className="hidden sm:inline text-stone-400">|</span>
            <span className="hidden sm:inline text-stone-300">
              {language === 'en' ? siteSettings.announcementEn : siteSettings.announcementZh}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
            <a
              id="whatsapp-top-link"
              href={`${waBaseUrl}?text=Hello%20CHILL%20Healthy%20team,%20I%20would%20like%20to%20inquire%20about%20meal%20orders!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: {siteSettings.whatsappDisplay}</span>
            </a>

            {/* Language switch button */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
              title="Switch Language / 切换语言"
            >
              <Globe className="w-3 h-3 text-stone-400" />
              <span className="font-semibold text-[11px]">{language === 'en' ? '华语' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div
              id="brand-logo-container"
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <ChillLogo variant="badge" size="md" className="group-hover:scale-105 transition-transform shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-2xl tracking-tight text-stone-900">
                    CHILL<span className="text-[#3b6026]">HEALTHY</span>
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold tracking-wider">
                    潮轻食
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium tracking-wide">
                  {language === 'en' ? 'Clean Eating · High Protein · Zero MSG' : '科学营养 · 低卡高蛋白 · 0添加'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav id="desktop-nav" className="hidden lg:flex items-center gap-1 xl:gap-2">
              <button
                id="nav-link-menu"
                onClick={() => scrollToSection('menu')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === 'menu' ? 'text-emerald-800 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {language === 'en' ? 'Meal Menu' : '招牌轻食'}
              </button>

              <button
                id="nav-link-plans"
                onClick={() => scrollToSection('plans')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer relative ${
                  activeSection === 'plans' ? 'text-emerald-800 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{language === 'en' ? 'Meal Plans (1–6 Persons)' : '健康餐配套 (1-6人)'}</span>
                <span className="absolute -top-1 right-0 text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  {language === 'en' ? 'From RM398' : 'RM398起'}
                </span>
              </button>

              <button
                id="nav-link-order-guide"
                onClick={() => scrollToSection('order-guide')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === 'order-guide' ? 'text-emerald-800 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {language === 'en' ? 'Confirm Order Guide' : '订单确认指南'}
              </button>

              <button
                id="nav-link-calculator"
                onClick={onOpenCalorieModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Calorie Matcher' : '热量规划计算器'}</span>
              </button>

              <button
                id="nav-link-story"
                onClick={() => scrollToSection('story')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === 'story' ? 'text-emerald-800 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {language === 'en' ? 'Our Story' : '潮品牌理念'}
              </button>

              <button
                id="nav-link-delivery"
                onClick={() => scrollToSection('delivery')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === 'delivery' ? 'text-emerald-800 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {language === 'en' ? 'Coverage' : '配送范围'}
              </button>
            </nav>

            {/* Right Action Icons: Member Portal, Cart & WhatsApp */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Member Login & Redeem Button */}
              <button
                id="member-portal-btn"
                onClick={onOpenMemberPortal}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  currentMember
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
                title="Member Package Login & Daily Meal Redemption"
              >
                <User className="w-4 h-4 text-emerald-700" />
                {currentMember ? (
                  <span className="flex items-center gap-1.5">
                    <span className="hidden sm:inline font-bold">{currentMember.name.split(' ')[0]}</span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full">
                      {currentMember.activePackage ? `${currentMember.activePackage.remainingMeals} Meals` : 'Member'}
                    </span>
                    <span className="hidden md:inline text-emerald-700 font-extrabold text-[11px]">
                      {language === 'en' ? 'Redeem' : '兑换'}
                    </span>
                  </span>
                ) : (
                  <span>
                    <span className="hidden sm:inline">{language === 'en' ? 'Member Login' : '会员登录'}</span>
                    <span className="sm:hidden">{language === 'en' ? 'Login' : '会员'}</span>
                  </span>
                )}
              </button>

              <a
                id="whatsapp-header-button"
                href={`${waBaseUrl}?text=Hi%20CHILL%20Healthy,%20I'd%20like%20to%20order%20meals!`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{language === 'en' ? 'WhatsApp' : 'WhatsApp订餐'}</span>
              </a>

              {/* Cart Button */}
              <button
                id="cart-drawer-trigger"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Cart' : '餐篮'}</span>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-extrabold animate-bounce">
                    {totalItems}
                  </span>
                )}
                {totalItems > 0 && (
                  <span className="hidden md:inline text-xs text-stone-300 font-semibold pl-1 border-l border-stone-700">
                    RM {cartTotal.toFixed(2)}
                  </span>
                )}
              </button>

              {/* Mobile menu hamburger toggle */}
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div id="mobile-menu-drawer" className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-150">
            {/* Mobile Member Portal Quick Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMemberPortal();
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>
                  {currentMember
                    ? `Hi, ${currentMember.name} (${currentMember.activePackage?.remainingMeals || 0} Meals Credit)`
                    : language === 'en'
                    ? 'Member Portal · Login & Redeem Meal'
                    : '会员中心 · 会员登录与每日餐券兑换'}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                {currentMember ? 'Redeem' : 'Login'}
              </span>
            </button>

            <button
              onClick={() => scrollToSection('menu')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-stone-800 font-medium hover:bg-stone-100 cursor-pointer"
            >
              {language === 'en' ? 'Meal Menu (招牌菜单)' : '招牌轻食菜单'}
            </button>
            <button
              onClick={() => scrollToSection('plans')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-stone-800 font-medium hover:bg-stone-100 flex items-center justify-between cursor-pointer"
            >
              <span>{language === 'en' ? 'Meal Plans (1–6 Persons)' : '健康餐配套 (单人至六人)'}</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">RM 398</span>
            </button>
            <button
              onClick={() => scrollToSection('order-guide')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-stone-800 font-medium hover:bg-stone-100 cursor-pointer"
            >
              {language === 'en' ? 'Confirm Order Guide (订单确认指南)' : '订单确认指南 ｜ Confirm Order'}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCalorieModal();
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-emerald-700 font-medium hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'en' ? 'Calorie Matcher Tool' : '热量与目标规划器'}</span>
            </button>
            <button
              onClick={() => scrollToSection('story')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-stone-800 font-medium hover:bg-stone-100 cursor-pointer"
            >
              {language === 'en' ? 'Our Story (@agneswei_wei)' : '关于潮轻食品牌故事'}
            </button>
            <button
              onClick={() => scrollToSection('delivery')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-stone-800 font-medium hover:bg-stone-100 cursor-pointer"
            >
              {language === 'en' ? 'Delivery Coverage (Klang Valley)' : '配送区域与免费送达'}
            </button>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setLanguage(language === 'en' ? 'zh' : 'en');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm font-semibold text-stone-700 px-3 py-2 rounded-lg bg-stone-100 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>{language === 'en' ? '切换为中文版 (华语)' : 'Switch to English'}</span>
              </button>

              <a
                href={waBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg cursor-pointer"
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
