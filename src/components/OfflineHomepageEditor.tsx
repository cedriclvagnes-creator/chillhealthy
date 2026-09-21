import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Edit3,
  Monitor,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  Clock,
  MapPin,
  MessageCircle,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { MealItem, MealPlan, SiteSettings, Language, HomepageContent } from '../types';
import { Header } from './Header';
import { HeroBanner } from './HeroBanner';
import { MenuSection } from './MenuSection';
import { MealPlansSection } from './MealPlansSection';
import { OrderGuideSection } from './OrderGuideSection';
import { BrandStorySection } from './BrandStorySection';
import { InstagramFeedSection } from './InstagramFeedSection';
import { DeliverySection } from './DeliverySection';
import { ReviewsSection } from './ReviewsSection';
import { Footer } from './Footer';

interface OfflineHomepageEditorProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  liveMenuItems: MealItem[];
  livePackages: MealPlan[];
  liveSiteSettings: SiteSettings;
  liveHomepageContent: HomepageContent;
  onPublishLive: (data: {
    menuItems: MealItem[];
    packages: MealPlan[];
    siteSettings: SiteSettings;
    homepageContent: HomepageContent;
  }) => void;
  onExitToLive: () => void;
  onOpenBackOffice: () => void;
  onSelectMealForCustomerPreview?: (meal: MealItem) => void;
}

const STORAGE_KEY_DRAFT_MEALS = 'chillhealthy_draft_meals';
const STORAGE_KEY_DRAFT_PACKAGES = 'chillhealthy_draft_packages';
const STORAGE_KEY_DRAFT_SETTINGS = 'chillhealthy_draft_settings';
const STORAGE_KEY_DRAFT_CONTENT = 'chillhealthy_draft_content';

export const OfflineHomepageEditor: React.FC<OfflineHomepageEditorProps> = ({
  language,
  onLanguageChange,
  liveMenuItems,
  livePackages,
  liveSiteSettings,
  liveHomepageContent,
  onPublishLive,
  onExitToLive,
  onOpenBackOffice,
  onSelectMealForCustomerPreview,
}) => {
  // Staging Draft State
  const [draftMenuItems, setDraftMenuItems] = useState<MealItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT_MEALS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return liveMenuItems;
  });

  const [draftPackages, setDraftPackages] = useState<MealPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT_PACKAGES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return livePackages;
  });

  const [draftSiteSettings, setDraftSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return liveSiteSettings;
  });

  const [draftHomepageContent, setDraftHomepageContent] = useState<HomepageContent>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT_CONTENT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return liveHomepageContent;
  });

  // Editor controls
  const [isStagingEditMode, setIsStagingEditMode] = useState<boolean>(true); // true = visual edit handles, false = pristine clean preview
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [activeModal, setActiveModal] = useState<'meal' | 'hero' | 'story' | 'delivery' | 'packages' | 'publishConfirm' | 'discardConfirm' | 'publishSuccess' | null>(null);
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<MealItem | null>(null);

  // Auto-save drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT_MEALS, JSON.stringify(draftMenuItems));
    } catch {
      // ignore
    }
  }, [draftMenuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT_PACKAGES, JSON.stringify(draftPackages));
    } catch {
      // ignore
    }
  }, [draftPackages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT_SETTINGS, JSON.stringify(draftSiteSettings));
    } catch {
      // ignore
    }
  }, [draftSiteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT_CONTENT, JSON.stringify(draftHomepageContent));
    } catch {
      // ignore
    }
  }, [draftHomepageContent]);

  // Calculate pending staged changes count
  const changesCount = React.useMemo(() => {
    let count = 0;
    // Check meals
    draftMenuItems.forEach((dm) => {
      const lm = liveMenuItems.find((m) => m.id === dm.id);
      if (!lm) {
        count++;
      } else if (
        lm.name !== dm.name ||
        lm.nameZh !== dm.nameZh ||
        lm.subtitle !== dm.subtitle ||
        lm.subtitleZh !== dm.subtitleZh ||
        lm.description !== dm.description ||
        lm.descriptionZh !== dm.descriptionZh ||
        lm.image !== dm.image ||
        lm.price !== dm.price ||
        lm.isOutOfStock !== dm.isOutOfStock
      ) {
        count++;
      }
    });

    // Check content
    if (JSON.stringify(draftHomepageContent) !== JSON.stringify(liveHomepageContent)) {
      count++;
    }
    if (JSON.stringify(draftSiteSettings) !== JSON.stringify(liveSiteSettings)) {
      count++;
    }
    if (JSON.stringify(draftPackages) !== JSON.stringify(livePackages)) {
      count++;
    }

    return count;
  }, [draftMenuItems, liveMenuItems, draftHomepageContent, liveHomepageContent, draftSiteSettings, liveSiteSettings, draftPackages, livePackages]);

  // Quick Stock Toggle on card
  const handleToggleStock = (mealId: string) => {
    setDraftMenuItems((prev) =>
      prev.map((item) => (item.id === mealId ? { ...item, isOutOfStock: !item.isOutOfStock } : item))
    );
  };

  // Open Meal Editor
  const handleOpenMealEditor = (meal: MealItem) => {
    setSelectedMealForEdit(meal);
    setActiveModal('meal');
  };

  // Save edited meal into draft
  const handleSaveMeal = (updatedMeal: MealItem) => {
    setDraftMenuItems((prev) =>
      prev.map((item) => (item.id === updatedMeal.id ? updatedMeal : item))
    );
    setActiveModal(null);
    setSelectedMealForEdit(null);
  };

  // Discard draft: restore from live
  const handleConfirmDiscard = () => {
    setDraftMenuItems(liveMenuItems);
    setDraftPackages(livePackages);
    setDraftSiteSettings(liveSiteSettings);
    setDraftHomepageContent(liveHomepageContent);
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT_MEALS);
      localStorage.removeItem(STORAGE_KEY_DRAFT_PACKAGES);
      localStorage.removeItem(STORAGE_KEY_DRAFT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_DRAFT_CONTENT);
    } catch {
      // ignore
    }
    setActiveModal(null);
  };

  // Publish to Live
  const handleConfirmPublish = () => {
    onPublishLive({
      menuItems: draftMenuItems,
      packages: draftPackages,
      siteSettings: draftSiteSettings,
      homepageContent: draftHomepageContent,
    });
    // clear draft storage since it's now live
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT_MEALS);
      localStorage.removeItem(STORAGE_KEY_DRAFT_PACKAGES);
      localStorage.removeItem(STORAGE_KEY_DRAFT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_DRAFT_CONTENT);
    } catch {
      // ignore
    }
    setActiveModal('publishSuccess');
  };

  // Section navigation helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-900 flex flex-col antialiased">
      {/* ================= STICKY OFFLINE STAGING CONTROL BAR ================= */}
      <header className="sticky top-0 z-50 bg-stone-900 border-b border-stone-800 shadow-2xl px-3 sm:px-6 py-2.5 text-white">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mode Title & Staging Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{language === 'en' ? 'Offline Staging Mode' : '离线草稿预览与编辑'}</span>
            </div>

            {changesCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{changesCount} {language === 'en' ? 'Staged Changes' : '项待发布改动'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 text-[11px] font-medium flex items-center gap-1 border border-stone-700">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{language === 'en' ? 'In Sync with Live' : '已与前台实时同步'}</span>
              </span>
            )}
          </div>

          {/* Center: Mode Toggle & Viewport Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Visual Edit vs Clean Preview */}
            <div className="bg-stone-800 p-0.5 rounded-xl flex items-center border border-stone-700">
              <button
                type="button"
                onClick={() => setIsStagingEditMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isStagingEditMode
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Shows edit buttons on photos and text"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Visual Edit' : '可视化编辑'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStagingEditMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isStagingEditMode
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="View clean homepage as customers see it"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Clean Preview' : '真实实景预览'}</span>
              </button>
            </div>

            {/* Viewport: Desktop vs Mobile */}
            <div className="bg-stone-800 p-0.5 rounded-xl flex items-center border border-stone-700">
              <button
                type="button"
                onClick={() => setDeviceViewport('desktop')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  deviceViewport === 'desktop'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceViewport('mobile')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  deviceViewport === 'mobile'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Mobile View (390px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Section Jumper */}
            <div className="hidden lg:flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => scrollToSection('menu')}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors cursor-pointer"
              >
                🍱 {language === 'en' ? 'Menu Bento' : '菜单便当'}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('hero')}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors cursor-pointer"
              >
                🖼️ {language === 'en' ? 'Hero' : '首屏'}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('plans')}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors cursor-pointer"
              >
                📦 {language === 'en' ? 'Packages' : '套餐'}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('story')}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors cursor-pointer"
              >
                📜 {language === 'en' ? 'Story' : '故事'}
              </button>
            </div>
          </div>

          {/* Right Actions: Discard, Publish Live, Back to Admin */}
          <div className="flex items-center gap-2">
            {changesCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveModal('discardConfirm')}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Discard draft and restore live data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'en' ? 'Discard Draft' : '放弃草稿'}</span>
              </button>
            )}

            <button
              type="button"
              id="admin-btn-publish-live"
              onClick={() => setActiveModal('publishConfirm')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Publish Live' : '🚀 发布到前台正式上线'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenBackOffice}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              title="Return to Back Office Dashboard"
            >
              {language === 'en' ? 'Admin Panel' : '管理后台'}
            </button>

            <button
              type="button"
              onClick={onExitToLive}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Exit Offline Staging Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN HOMEPAGE WRAPPER ================= */}
      <main className="flex-1 bg-stone-100 flex flex-col items-center justify-start overflow-x-hidden">
        {deviceViewport === 'mobile' ? (
          /* Mobile Device Mockup Frame */
          <div className="py-8 px-4 w-full flex justify-center">
            <div className="w-[410px] bg-stone-950 rounded-[48px] p-3 shadow-2xl ring-8 ring-stone-800/80 border border-stone-700 flex flex-col overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="h-6 w-full flex items-center justify-center relative mb-1">
                <div className="w-24 h-4 bg-stone-900 rounded-full flex items-center justify-center">
                  <div className="w-10 h-1 bg-stone-800 rounded-full" />
                </div>
              </div>

              {/* Scrollable Mobile Screen */}
              <div className="w-full h-[820px] bg-white rounded-[36px] overflow-y-auto overflow-x-hidden relative shadow-inner">
                {renderFullHomepage()}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Full Width */
          <div className="w-full bg-white">
            {renderFullHomepage()}
          </div>
        )}
      </main>

      {/* ================= MODAL: IN-PLACE MEAL DISH PHOTO & WORD EDITOR ================= */}
      {activeModal === 'meal' && selectedMealForEdit && (
        <MealDishEditorModal
          language={language}
          meal={selectedMealForEdit}
          onSave={handleSaveMeal}
          onClose={() => {
            setActiveModal(null);
            setSelectedMealForEdit(null);
          }}
        />
      )}

      {/* ================= MODAL: HERO BANNER WORD & PHOTO EDITOR ================= */}
      {activeModal === 'hero' && (
        <HeroEditorModal
          language={language}
          content={draftHomepageContent}
          onSave={(updated) => {
            setDraftHomepageContent(updated);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ================= MODAL: BRAND STORY & KITCHEN PHOTO EDITOR ================= */}
      {activeModal === 'story' && (
        <StoryEditorModal
          language={language}
          content={draftHomepageContent}
          onSave={(updated) => {
            setDraftHomepageContent(updated);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ================= MODAL: DELIVERY & ANNOUNCEMENT EDITOR ================= */}
      {activeModal === 'delivery' && (
        <DeliveryEditorModal
          language={language}
          settings={draftSiteSettings}
          onSave={(updated) => {
            setDraftSiteSettings(updated);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ================= MODAL: PACKAGES & PRICING EDITOR ================= */}
      {activeModal === 'packages' && (
        <PackagesEditorModal
          language={language}
          packages={draftPackages}
          onSave={(updated) => {
            setDraftPackages(updated);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ================= MODAL: CONFIRM PUBLISH TO LIVE ================= */}
      {activeModal === 'publishConfirm' && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-xl font-bold text-stone-900">
              {language === 'en' ? 'Publish Staged Homepage Changes Live?' : '确认将离线草稿正式发布到前台？'}
            </h3>

            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {language === 'en'
                ? `You have staged updates. Once published, all visitors and customers browsing the live homepage will immediately see the updated photos, word descriptions, pricing, and stock availability.`
                : '您当前已在离线模式中编辑并预览了相关内容。点击确认发布后，正式前台将立即同步更新所有餐点照片、文案描述、价格及库存状态。'}
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
              <p className="font-bold text-stone-900">
                {language === 'en' ? 'Summary of Staged Changes:' : '待发布改动概览：'}
              </p>
              <p>• {draftMenuItems.length} {language === 'en' ? 'Dishes checked (including photos, words & stock)' : '份餐点（包含照片、文案及库存状态）'}</p>
              <p>• {draftMenuItems.filter((m) => m.isOutOfStock).length} {language === 'en' ? 'Dishes marked as Sold Out' : '份餐点标记为售罄'}</p>
              <p>• {language === 'en' ? 'Hero headline, brand story & announcements' : '首屏文案、品牌故事与公告配送信息'}</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-bold transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Keep Editing' : '返回继续编辑'}
              </button>

              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Yes, Publish Live Now' : '确认上线发布'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DISCARD DRAFT ================= */}
      {activeModal === 'discardConfirm' && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-xl font-bold text-stone-900">
              {language === 'en' ? 'Discard All Offline Draft Changes?' : '放弃所有离线草稿改动？'}
            </h3>

            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {language === 'en'
                ? 'This will revert all offline edits back to the current published live version of the homepage. This action cannot be undone.'
                : '这将把所有尚未发布的离线照片与文字改动重置回当前正式前台的最新版本。'}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-bold transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : '取消'}
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'en' ? 'Discard Changes' : '确认放弃'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PUBLISH SUCCESS CELEBRATION ================= */}
      {activeModal === 'publishSuccess' && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-4 shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="font-heading text-2xl font-black text-stone-900">
              {language === 'en' ? 'Successfully Published Live!' : '🎉 已成功发布到前台！'}
            </h3>

            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {language === 'en'
                ? 'Your changes to photos, word descriptions, pricing, and dish stock statuses are now 100% LIVE for all customers to enjoy.'
                : '您修改的餐点照片、文案描述、价格与库存状态已全部生效，所有进站顾客均可实时浏览选购。'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  onExitToLive();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>{language === 'en' ? 'View Live Customer Store' : '前往正式前台查看'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Continue in Staging' : '继续留在编辑台'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render the complete homepage components
  function renderFullHomepage() {
    return (
      <div className="w-full">
        {/* Top Announcement Bar */}
        <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 text-center border-b border-stone-800 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span className="truncate flex-1 text-center">
              {language === 'en' ? draftSiteSettings.announcementEn : draftSiteSettings.announcementZh}
            </span>
            {isStagingEditMode && (
              <button
                type="button"
                onClick={() => setActiveModal('delivery')}
                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-stone-950 text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                title="Edit top announcement"
              >
                <Edit3 className="w-3 h-3" />
                <span>{language === 'en' ? 'Edit' : '编辑'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <Header
          language={language}
          setLanguage={onLanguageChange}
          cart={[]}
          setIsCartOpen={() => {}}
          activeSection="hero"
          setActiveSection={() => {}}
          onOpenCalorieModal={() => {}}
          siteSettings={draftSiteSettings}
          currentMember={null}
          onOpenMemberPortal={() => {}}
          onOpenBackOffice={onOpenBackOffice}
        />

        {/* Hero Banner with Content & Edit hooks */}
        <HeroBanner
          language={language}
          onExploreMenu={() => scrollToSection('menu')}
          onViewPlans={() => scrollToSection('plans')}
          onViewOrderGuide={() => scrollToSection('order-guide')}
          content={draftHomepageContent}
          isEditMode={isStagingEditMode}
          onEditHero={() => setActiveModal('hero')}
        />

        {/* Menu Section with Draft Items & In-place card edit */}
        <MenuSection
          language={language}
          onSelectMeal={(meal) => {
            if (isStagingEditMode) {
              handleOpenMealEditor(meal);
            } else if (onSelectMealForCustomerPreview) {
              onSelectMealForCustomerPreview(meal);
            }
          }}
          onQuickAdd={(meal) => {
            if (isStagingEditMode) {
              handleOpenMealEditor(meal);
            }
          }}
          menuItems={draftMenuItems}
          isEditMode={isStagingEditMode}
          onEditMeal={handleOpenMealEditor}
          onToggleStock={handleToggleStock}
        />

        {/* Meal Packages Section */}
        <MealPlansSection
          language={language}
          onAddPlanToCart={() => {}}
          packages={draftPackages}
          onOpenMemberPortal={() => {}}
          isEditMode={isStagingEditMode}
          onEditPackages={() => setActiveModal('packages')}
        />

        {/* Order Guide Section */}
        <div id="order-guide">
          <OrderGuideSection
            language={language}
            siteSettings={draftSiteSettings}
            onSelectPlansClick={() => scrollToSection('plans')}
            onOpenMemberPortal={() => {}}
          />
        </div>

        {/* Brand Story Section */}
        <BrandStorySection
          language={language}
          siteSettings={draftSiteSettings}
          content={draftHomepageContent}
          isEditMode={isStagingEditMode}
          onEditStory={() => setActiveModal('story')}
        />

        {/* Instagram Feed Section */}
        <InstagramFeedSection
          language={language}
          siteSettings={draftSiteSettings}
        />

        {/* Delivery Section */}
        <DeliverySection
          language={language}
          isEditMode={isStagingEditMode}
          onEditDelivery={() => setActiveModal('delivery')}
        />

        {/* Customer Reviews Section */}
        <ReviewsSection language={language} />

        {/* Footer */}
        <Footer
          language={language}
          siteSettings={draftSiteSettings}
          onNavigate={scrollToSection}
          onOpenCalorie={() => {}}
          onOpenMemberPortal={() => {}}
          onOpenBackOffice={onOpenBackOffice}
        />
      </div>
    );
  }
};

/* =========================================================================
   SUB-COMPONENT: IN-PLACE MEAL DISH PHOTO & WORD DESCRIPTION EDITOR MODAL
========================================================================= */
interface MealDishEditorModalProps {
  language: Language;
  meal: MealItem;
  onSave: (meal: MealItem) => void;
  onClose: () => void;
}

const MealDishEditorModal: React.FC<MealDishEditorModalProps> = ({
  language,
  meal,
  onSave,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<MealItem>({ ...meal });
  const [imagePreview, setImagePreview] = useState<string>(meal.image);

  // File upload reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImagePreview(result);
        setFormData((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold uppercase">
              {language === 'en' ? 'Dish Photo & Content Editor' : '餐点照片与文案编辑器'}
            </span>
            <h3 className="font-heading text-xl font-bold text-stone-900 mt-1">
              {language === 'en' ? formData.name : formData.nameZh}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Photo Section */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              {language === 'en' ? 'Dish Photo (Upload or URL)' : '餐点照片（本地上传或输入图片链接）'}
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Frame */}
              <div className="relative w-36 h-28 rounded-2xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 shadow-inner">
                <img
                  src={imagePreview}
                  alt={formData.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {formData.isOutOfStock && (
                  <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded">
                      {language === 'en' ? 'Sold Out' : '已售罄'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Trigger & URL Input */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Upload Photo from Device' : '从手机/电脑上传新照片'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const demoPhoto = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      setImagePreview(demoPhoto);
                      setFormData((p) => ({ ...p, image: demoPhoto }));
                    }}
                    className="px-2.5 py-2 rounded-xl text-stone-500 hover:text-stone-800 bg-stone-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Reset Photo' : '重置'}
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Status Controller */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">
                {language === 'en' ? 'Stock Availability' : '库存供应状态'}
              </p>
              <p className="text-[11px] text-stone-500">
                {language === 'en'
                  ? 'Marking as Sold Out will show a badge on the homepage and prevent ordering.'
                  : '设为已售罄时，前台将展示“已售罄”遮罩并禁止加购。'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isOutOfStock: false })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !formData.isOutOfStock
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                🟢 {language === 'en' ? 'In Stock' : '正常供应'}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isOutOfStock: true })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.isOutOfStock
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                🔴 {language === 'en' ? 'Sold Out / Out of Stock' : '已售罄 (缺货)'}
              </button>
            </div>
          </div>

          {/* Names (English & Chinese) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'Dish Name (English)' : '英文餐点名称'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'Dish Name (Chinese)' : '中文餐点名称 (华语)'}
              </label>
              <input
                type="text"
                required
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Subtitles (English & Chinese) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'Subtitle / Highlight (English)' : '英文特色标签 / 副标题'}
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'Subtitle / Highlight (Chinese)' : '中文特色标签 / 副标题'}
              </label>
              <input
                type="text"
                value={formData.subtitleZh}
                onChange={(e) => setFormData({ ...formData, subtitleZh: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Full Word Descriptions (English & Chinese) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Full Word Description (English)' : '英文完整文案描述'}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Full Word Description (Chinese 华中文案)' : '中文完整文案描述 (华语)'}
            </label>
            <textarea
              rows={3}
              value={formData.descriptionZh}
              onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          {/* Price & Nutritional Macros */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-stone-200">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Price (RM)</label>
              <input
                type="number"
                step="0.1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Fat (g)</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Save to Offline Draft' : '保存至离线草稿'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: HERO BANNER WORD & PHOTO EDITOR MODAL
========================================================================= */
interface HeroEditorModalProps {
  language: Language;
  content: HomepageContent;
  onSave: (content: HomepageContent) => void;
  onClose: () => void;
}

const HeroEditorModal: React.FC<HeroEditorModalProps> = ({
  language,
  content,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<HomepageContent>({ ...content });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold uppercase">
              {language === 'en' ? 'Hero Section Editor' : '主页首屏标题与文案编辑'}
            </span>
            <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">
              {language === 'en' ? 'Hero Headline & Description' : '编辑主页首屏文案'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Main Headline (English)' : '主标题 (英文)'}
            </label>
            <input
              type="text"
              required
              value={formData.heroHeadlineEn}
              onChange={(e) => setFormData({ ...formData, heroHeadlineEn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Main Headline (Chinese)' : '主标题 (华语)'}
            </label>
            <input
              type="text"
              required
              value={formData.heroHeadlineZh}
              onChange={(e) => setFormData({ ...formData, heroHeadlineZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Description Paragraph (English)' : '详细文案段落 (英文)'}
            </label>
            <textarea
              rows={3}
              value={formData.heroDescriptionEn}
              onChange={(e) => setFormData({ ...formData, heroDescriptionEn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 leading-relaxed outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Description Paragraph (Chinese)' : '详细文案段落 (华语)'}
            </label>
            <textarea
              rows={3}
              value={formData.heroDescriptionZh}
              onChange={(e) => setFormData({ ...formData, heroDescriptionZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 leading-relaxed outline-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Update Draft' : '更新至草稿'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: BRAND STORY & KITCHEN PHOTO EDITOR MODAL
========================================================================= */
interface StoryEditorModalProps {
  language: Language;
  content: HomepageContent;
  onSave: (content: HomepageContent) => void;
  onClose: () => void;
}

const StoryEditorModal: React.FC<StoryEditorModalProps> = ({
  language,
  content,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<HomepageContent>({ ...content });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold uppercase">
              {language === 'en' ? 'Brand Story & Kitchen' : '品牌故事与厨房手作'}
            </span>
            <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">
              {language === 'en' ? 'Edit Brand Philosophy' : '编辑品牌初心文案'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Heading (English)' : '故事大标题 (英文)'}
            </label>
            <input
              type="text"
              required
              value={formData.storyHeadlineEn}
              onChange={(e) => setFormData({ ...formData, storyHeadlineEn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Heading (Chinese)' : '故事大标题 (华语)'}
            </label>
            <input
              type="text"
              required
              value={formData.storyHeadlineZh}
              onChange={(e) => setFormData({ ...formData, storyHeadlineZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Subtitle / Quote (Chinese)' : '副标引言 (华语)'}
            </label>
            <input
              type="text"
              value={formData.storySubtitleZh}
              onChange={(e) => setFormData({ ...formData, storySubtitleZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Full Story Text (Chinese)' : '品牌正文故事 (华语)'}
            </label>
            <textarea
              rows={4}
              value={formData.storyDescriptionZh}
              onChange={(e) => setFormData({ ...formData, storyDescriptionZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 leading-relaxed outline-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Update Draft' : '更新至草稿'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: DELIVERY & ANNOUNCEMENT EDITOR MODAL
========================================================================= */
interface DeliveryEditorModalProps {
  language: Language;
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => void;
  onClose: () => void;
}

const DeliveryEditorModal: React.FC<DeliveryEditorModalProps> = ({
  language,
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<SiteSettings>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold uppercase">
              {language === 'en' ? 'Delivery & Announcements' : '公告与配送信息设置'}
            </span>
            <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">
              {language === 'en' ? 'Edit Announcements & Contact' : '编辑前台公告与配送咨询'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Top Announcement Bar (English)' : '顶部公告栏 (英文)'}
            </label>
            <input
              type="text"
              value={formData.announcementEn}
              onChange={(e) => setFormData({ ...formData, announcementEn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Top Announcement Bar (Chinese)' : '顶部公告栏 (华语)'}
            </label>
            <input
              type="text"
              value={formData.announcementZh}
              onChange={(e) => setFormData({ ...formData, announcementZh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'WhatsApp Number' : '官方 WhatsApp 号码'}
              </label>
              <input
                type="text"
                value={formData.whatsappDisplay}
                onChange={(e) => setFormData({ ...formData, whatsappDisplay: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'en' ? 'Operating Kitchen Hours' : '厨房营业时段'}
              </label>
              <input
                type="text"
                value={formData.kitchenHours}
                onChange={(e) => setFormData({ ...formData, kitchenHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'en' ? 'Central Kitchen Address' : '中央厨房地址'}
            </label>
            <input
              type="text"
              value={formData.kitchenAddress}
              onChange={(e) => setFormData({ ...formData, kitchenAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Update Draft' : '更新至草稿'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: PACKAGES & PRICING EDITOR MODAL
========================================================================= */
interface PackagesEditorModalProps {
  language: Language;
  packages: MealPlan[];
  onSave: (packages: MealPlan[]) => void;
  onClose: () => void;
}

const PackagesEditorModal: React.FC<PackagesEditorModalProps> = ({
  language,
  packages,
  onSave,
  onClose,
}) => {
  const [pkgList, setPkgList] = useState<MealPlan[]>([...packages]);

  const handlePriceChange = (id: string, newPrice: number) => {
    setPkgList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, totalPrice: newPrice } : p))
    );
  };

  const handleTitleZhChange = (id: string, newTitleZh: string) => {
    setPkgList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, titleZh: newTitleZh } : p))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold uppercase">
              {language === 'en' ? 'Packages & Plans' : '月度套餐与定价管理'}
            </span>
            <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">
              {language === 'en' ? 'Meal Package Plans & Prices' : '健康餐配套价格与名称'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {pkgList.map((pkg) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                  {pkg.persons} {language === 'en' ? 'Person' : '人套餐'} · {pkg.mealsTotal} {language === 'en' ? 'Meals' : '餐'}
                </span>
                <span className="text-xs text-stone-400">ID: {pkg.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {language === 'en' ? 'Package Title (Chinese)' : '套餐标题 (中文)'}
                  </label>
                  <input
                    type="text"
                    value={pkg.titleZh}
                    onChange={(e) => handleTitleZhChange(pkg.id, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {language === 'en' ? 'Total Price (RM)' : '套餐总价 (RM)'}
                  </label>
                  <input
                    type="number"
                    value={pkg.totalPrice}
                    onChange={(e) => handlePriceChange(pkg.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : '取消'}
          </button>
          <button
            type="button"
            onClick={() => onSave(pkgList)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Update Draft' : '更新至草稿'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
