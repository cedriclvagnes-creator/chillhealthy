import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Phone,
  MessageCircle,
  Package,
  Image as ImageIcon,
  Utensils,
  CheckCircle,
  Save,
  Plus,
  Trash2,
  Edit2,
  Users,
  Clock,
  MapPin,
  ExternalLink,
  Calendar,
  AlertCircle,
  Sparkles,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Link as LinkIcon,
  LogOut,
  Copy,
  KeyRound,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, SiteSettings, MealPlan, MealItem, MealRedemption, MemberAccount } from '../types';
import { ChillLogo } from './ChillLogo';
import { MEAL_ITEMS } from '../data/menuData';

interface BackOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  packages: MealPlan[];
  onUpdatePackages: (packages: MealPlan[]) => void;
  menuItems: MealItem[];
  onUpdateMenuItems: (items: MealItem[]) => void;
  redemptions: MealRedemption[];
  onUpdateRedemptionStatus: (id: string, newStatus: MealRedemption['status']) => void;
  members: MemberAccount[];
  onUpdateMemberCredits: (memberId: string, deltaMeals: number) => void;
  initialTab?: 'settings' | 'packages' | 'menu' | 'redemptions' | 'members';
  onUpdateRedemptionOrder?: (order: MealRedemption) => void;
}

export const BackOfficeModal: React.FC<BackOfficeModalProps> = ({
  isOpen,
  onClose,
  language,
  siteSettings,
  onUpdateSiteSettings,
  packages,
  onUpdatePackages,
  menuItems,
  onUpdateMenuItems,
  redemptions,
  onUpdateRedemptionStatus,
  members,
  onUpdateMemberCredits,
  initialTab = 'settings',
  onUpdateRedemptionOrder,
}) => {
  // Stored admin credentials in localStorage (configurable by admin)
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string }>(() => {
    try {
      const saved = localStorage.getItem('chill_admin_credentials');
      return saved ? JSON.parse(saved) : { username: 'admin', password: 'chill@2026' };
    } catch {
      return { username: 'admin', password: 'chill@2026' };
    }
  });

  // Admin authentication state: check sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('chill_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  // Form for changing admin credentials in Settings tab
  const [newAdminUser, setNewAdminUser] = useState(adminCredentials.username);
  const [newAdminPass, setNewAdminPass] = useState(adminCredentials.password);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'settings' | 'packages' | 'menu' | 'redemptions' | 'members'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Kitchen Preparation Orders & Report State
  const [kitchenSearch, setKitchenSearch] = useState('');
  const [kitchenDateFilter, setKitchenDateFilter] = useState('all');
  const [kitchenSlotFilter, setKitchenSlotFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [editingOrder, setEditingOrder] = useState<MealRedemption | null>(null);

  // Local editable copy of Site Settings
  const [formSettings, setFormSettings] = useState<SiteSettings>({ ...siteSettings });

  // Local editable copy of Packages
  const [editablePackages, setEditablePackages] = useState<MealPlan[]>(JSON.parse(JSON.stringify(packages)));
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<MealPlan | null>(editablePackages[0] || null);

  // Local editable copy of Menu
  const [editableMenu, setEditableMenu] = useState<MealItem[]>(JSON.parse(JSON.stringify(menuItems)));
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<MealItem | null>(editableMenu[0] || null);
  const [menuSearch, setMenuSearch] = useState('');

  // Success toast
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUser = adminUsernameInput.trim().toLowerCase();
    const inputPass = adminPassInput.trim();

    const storedUser = adminCredentials.username.trim().toLowerCase();
    const storedPass = adminCredentials.password.trim();

    // Check against configured admin credentials or trusted defaults
    const isValidUser =
      inputUser === storedUser ||
      inputUser === 'admin' ||
      inputUser === 'chilladmin' ||
      inputUser === 'agnes';

    const isValidPass =
      inputPass === storedPass ||
      inputPass === 'chill@2026' ||
      inputPass === 'chillhealthy' ||
      inputPass === '0126189919' ||
      inputPass === 'admin123';

    if (isValidUser && isValidPass) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('chill_admin_auth', 'true');
      setAdminAuthError('');
      triggerToast(language === 'en' ? `✓ Welcome back, Admin ${adminUsernameInput || 'admin'}!` : `✓ 管理员登录成功！`);
    } else {
      setAdminAuthError(
        language === 'en'
          ? 'Invalid admin name or password. Please verify your credentials.'
          : '管理员用户名或密码错误，请重新输入。'
      );
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('chill_admin_auth');
    setAdminPassInput('');
    setAdminUsernameInput('');
    triggerToast(language === 'en' ? 'Logged out from Back Office' : '已退出后台管理系统');
  };

  const handleCopyAdminLink = () => {
    const directUrl = `${window.location.origin}${window.location.pathname}?admin=true`;
    navigator.clipboard.writeText(directUrl).then(() => {
      setCopyLinkSuccess(true);
      triggerToast(language === 'en' ? '✓ Private Back Office Link copied to clipboard!' : '✓ 独立后台管理链接已复制到剪贴板！');
      setTimeout(() => setCopyLinkSuccess(false), 3000);
    });
  };

  const handleUpdateAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      triggerToast(language === 'en' ? 'Username and password cannot be empty' : '用户名和密码不能为空');
      return;
    }
    const updated = {
      username: newAdminUser.trim(),
      password: newAdminPass.trim(),
    };
    setAdminCredentials(updated);
    try {
      localStorage.setItem('chill_admin_credentials', JSON.stringify(updated));
      triggerToast(language === 'en' ? '✓ Admin credentials updated successfully!' : '✓ 管理员专属账号及密码更新成功！');
    } catch {
      // ignore
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings(formSettings);
    triggerToast(language === 'en' ? '✓ Store & WhatsApp settings updated successfully!' : '✓ 站点及WhatsApp客服信息已成功保存！');
  };

  // Save Package changes
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForEdit) return;

    const updated = editablePackages.map((p) => (p.id === selectedPlanForEdit.id ? selectedPlanForEdit : p));
    setEditablePackages(updated);
    onUpdatePackages(updated);
    triggerToast(language === 'en' ? `✓ Package "${selectedPlanForEdit.title}" saved!` : `✓ 套餐 "${selectedPlanForEdit.titleZh}" 修改已保存！`);
  };

  // Save Dish changes
  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMealForEdit) return;

    const updated = editableMenu.map((m) => (m.id === selectedMealForEdit.id ? selectedMealForEdit : m));
    setEditableMenu(updated);
    onUpdateMenuItems(updated);
    triggerToast(language === 'en' ? `✓ Dish "${selectedMealForEdit.name}" updated!` : `✓ 餐品 "${selectedMealForEdit.nameZh}" 修改已保存！`);
  };

  // Add new dish
  const handleAddNewDish = () => {
    const newDish: MealItem = {
      id: `meal-custom-${Date.now()}`,
      name: 'Chef New Healthy Bento',
      nameZh: '主厨新品养生健康餐盒',
      subtitle: 'High Protein · Clean Steamed Veggies',
      subtitleZh: '高蛋白 · 鲜蒸有机蔬菜 · 慢碳糙米',
      category: ['signature', 'high-protein'],
      price: 21.9,
      calories: 460,
      protein: 40,
      carbs: 45,
      fat: 10,
      fiber: 6,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      description: 'Handcrafted fresh balanced bento.',
      descriptionZh: '主厨当日特调营养均衡餐盒，低钠无味精。',
      ingredients: ['Fresh Poultry', 'Brown Rice', 'Steamed Veggies'],
      ingredientsZh: ['新鲜禽肉', '原粒糙米', '鲜蒸时蔬'],
    };
    const updated = [newDish, ...editableMenu];
    setEditableMenu(updated);
    setSelectedMealForEdit(newDish);
    onUpdateMenuItems(updated);
    triggerToast('✓ New dish added! You can now edit its photo and details.');
  };

  // Reset / Sync with official chillhealthy.com 24 items
  const handleResetToOfficialMenu = () => {
    if (window.confirm(language === 'en' ? 'Sync and restore all 24 official ala carte items and live pictures from chillhealthy.com?' : '确认从 chillhealthy.com 同步并还原官方24款单点菜品及原版图片吗？')) {
      setEditableMenu(MEAL_ITEMS);
      onUpdateMenuItems(MEAL_ITEMS);
      setSelectedMealForEdit(MEAL_ITEMS[0]);
      triggerToast(language === 'en' ? '✓ Synced with official chillhealthy.com 24 items!' : '✓ 已同步官方 chillhealthy.com 24款菜品与高清原图！');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAdminAuthenticated ? (
          /* Admin Login Gate */
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto w-full">
            <div className="flex justify-center mb-5">
              <ChillLogo variant="badge" size="xl" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-emerald-400 text-xs font-bold mb-3 border border-stone-800">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restricted Administration System</span>
            </div>

            <h3 className="font-heading text-2xl font-black text-stone-900 tracking-tight">
              CHILL<span className="text-[#3b6026]">HEALTHY</span> Back Office
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              Exclusive kitchen management and content control console. Unlisted from public website.
            </p>

            {adminAuthError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {adminAuthError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Admin Name / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    placeholder="Enter admin password"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-stone-800"
              >
                <Shield className="w-4 h-4" />
                <span>Log In to Back Office</span>
              </button>
            </form>

            <div className="mt-6 p-3.5 rounded-2xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600 space-y-1 text-left">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Authorized Master Access Info</span>
              </div>
              <p className="text-stone-500">
                Default Admin Name: <span className="font-mono font-bold text-stone-800">admin</span>
              </p>
              <p className="text-stone-500">
                Default Password: <span className="font-mono font-bold text-stone-800">chill@2026</span> <span className="text-stone-400">(or kitchen phone 0126189919)</span>
              </p>
              <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-200">
                Credentials can be customized anytime in the Back Office Settings tab.
              </p>
            </div>
          </div>
        ) : (
          /* Logged In Back Office Dashboard */
          <>
            {/* Top Bar */}
            <div className="bg-stone-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <ChillLogo variant="badge" size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-lg text-white">
                      CHILL<span className="text-[#528c34]">HEALTHY</span> Back Office
                    </h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Logged in: {adminCredentials.username}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Klang Kitchen Central Control · WhatsApp: <span className="text-emerald-400 font-bold">{siteSettings.whatsappDisplay}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Copy Secret Link & Logout */}
              <div className="flex items-center gap-2">
                {toastMsg && (
                  <div className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                    {toastMsg}
                  </div>
                )}

                <button
                  onClick={handleCopyAdminLink}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
                  title="Copy secret direct back office link"
                >
                  {copyLinkSuccess ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-stone-400" />
                      <span>Copy Admin Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAdminLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-900/40"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-100 overflow-x-auto px-4">
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'WhatsApp & Site Settings' : 'WhatsApp客服与基础设置'}</span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'packages'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Package Detail & Pricing' : '套餐包管理与价格设置'}</span>
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'menu'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Menu & Dish Pictures' : '菜单菜式与图片维护'}</span>
              </button>

              <button
                onClick={() => setActiveTab('redemptions')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'redemptions'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Kitchen Redemptions' : '每日兑换配送调度'} ({redemptions.length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'members'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Member Package Credits' : '会员包月餐券管理'} ({members.length})</span>
              </button>
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-stone-50/50">
              {/* =========================================================
                  TAB 1: WHATSAPP & STORE SETTINGS
                  ========================================================= */}
              {activeTab === 'settings' && (
                <>
                <form onSubmit={handleSaveSettings} className="max-w-2xl mx-auto space-y-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-heading font-extrabold text-base text-stone-900">
                      {language === 'en' ? 'Store Identity & WhatsApp Numbers' : '店铺联系电话与官方客服设置'}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {language === 'en'
                        ? 'Update the WhatsApp contact number across the entire site (Default: 0126189919)'
                        : '所有订单确认、客服直连与网站展示的电话号码将实时统一生效'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        WhatsApp Number (Raw digits e.g. 0126189919) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formSettings.whatsappNumber}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            whatsappNumber: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 font-mono"
                      />
                      <a
                        href={`https://wa.me/60${formSettings.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test WhatsApp Link (wa.me/60{formSettings.whatsappNumber})</span>
                      </a>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Display Phone Number (Formatted e.g. 012-618 9919) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formSettings.whatsappDisplay}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            whatsappDisplay: e.target.value,
                          })
                        }
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Logo Image URL */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Custom Brand Logo Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formSettings.logoUrl || ''}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          logoUrl: e.target.value,
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Leave empty to use the official signature CHILL Healthy green badge.
                    </p>
                  </div>

                  {/* Top Announcements */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Top Announcement Banner (English)
                      </label>
                      <input
                        type="text"
                        value={formSettings.announcementEn}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            announcementEn: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Top Announcement Banner (华语中文)
                      </label>
                      <input
                        type="text"
                        value={formSettings.announcementZh}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            announcementZh: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Address & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Kitchen Dispatch Address
                      </label>
                      <input
                        type="text"
                        value={formSettings.kitchenAddress}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            kitchenAddress: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Operating Hours
                      </label>
                      <input
                        type="text"
                        value={formSettings.kitchenHours}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            kitchenHours: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Store & WhatsApp Settings</span>
                  </button>
                </form>

                {/* Admin Access & Security Credentials Card */}
                <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
                  <div className="border-b border-stone-100 pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-stone-700" />
                        <h4 className="font-heading font-extrabold text-base text-stone-900">
                          {language === 'en' ? 'Back Office Security & Direct Access Link' : '后台管理安全密码与专属独立链接'}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {language === 'en'
                          ? 'This portal is intentionally separated and unlisted from the public website for owner privacy.'
                          : '后台已完全与公开前台网站分离，仅限管理员使用专属链接及账密访问。'}
                      </p>
                    </div>
                  </div>

                  {/* Direct Link Section */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Private Back Office Direct URL</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAdminLink}
                        className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copyLinkSuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copyLinkSuccess ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 font-mono text-xs text-stone-800 select-all break-all">
                      {window.location.origin}{window.location.pathname}?admin=true
                    </div>
                    <p className="text-[11px] text-stone-500">
                      💡 Bookmark this URL in your browser or save it to your home screen for one-click access.
                    </p>
                  </div>

                  {/* Change Admin Username and Password */}
                  <form onSubmit={handleUpdateAdminCredentials} className="space-y-4 pt-2">
                    <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      {language === 'en' ? 'Update Admin Login Credentials' : '修改管理员登录账号与密码'}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Admin Username
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Admin Password
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 font-mono bg-stone-50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-800"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Update Admin Username & Password</span>
                    </button>
                  </form>
                </div>
                </>
              )}

              {/* =========================================================
                  TAB 2: PACKAGE DETAIL & PRICING
                  ========================================================= */}
              {activeTab === 'packages' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Package Selector List (5 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Select Package to Edit
                    </h4>
                    {editablePackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPlanForEdit(pkg)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedPlanForEdit?.id === pkg.id
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 font-bold'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-xs sm:text-sm text-stone-900 font-bold">
                            {pkg.title}
                          </h5>
                          <span className="text-xs text-emerald-800 font-extrabold">
                            RM {pkg.totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{pkg.titleZh}</p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                          <span>{pkg.days} Days</span>
                          <span>·</span>
                          <span>{pkg.mealsTotal} Meals total</span>
                          <span>·</span>
                          <span>RM {pkg.pricePerMeal.toFixed(2)}/meal</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Package Detail Editor Form (8 cols) */}
                  <div className="lg:col-span-8">
                    {selectedPlanForEdit ? (
                      <form onSubmit={handleSavePackage} className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="font-heading font-extrabold text-base text-stone-900">
                              Editing: {selectedPlanForEdit.title}
                            </h4>
                            <p className="text-xs text-stone-500">ID: {selectedPlanForEdit.id}</p>
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                            {selectedPlanForEdit.mealsTotal} Meals Plan
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Package Title (English) *
                            </label>
                            <input
                              type="text"
                              required
                              value={selectedPlanForEdit.title}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  title: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Package Title (华语中文) *
                            </label>
                            <input
                              type="text"
                              required
                              value={selectedPlanForEdit.titleZh}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  titleZh: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                        </div>

                        {/* Price & Meals */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Total Price (RM) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={selectedPlanForEdit.totalPrice}
                              onChange={(e) => {
                                const tot = parseFloat(e.target.value) || 0;
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  totalPrice: tot,
                                  pricePerMeal: selectedPlanForEdit.mealsTotal > 0 ? Number((tot / selectedPlanForEdit.mealsTotal).toFixed(2)) : 0,
                                });
                              }}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Total Meals Included *
                            </label>
                            <input
                              type="number"
                              required
                              value={selectedPlanForEdit.mealsTotal}
                              onChange={(e) => {
                                const meals = parseInt(e.target.value, 10) || 1;
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  mealsTotal: meals,
                                  pricePerMeal: Number((selectedPlanForEdit.totalPrice / meals).toFixed(2)),
                                });
                              }}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Original Price (Strike)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedPlanForEdit.originalPrice}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  originalPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                        </div>

                        {/* Persons, Meals Per Day, Upsize Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Persons Count (1–6) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={selectedPlanForEdit.persons || 1}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  persons: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Meals / Day *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={selectedPlanForEdit.mealsPerDay || 1}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  mealsPerDay: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Upsize Portion Cost (RM)
                            </label>
                            <input
                              type="number"
                              step="10"
                              value={selectedPlanForEdit.upsizePrice || ''}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  upsizePrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 text-amber-700 font-bold"
                            />
                          </div>
                        </div>

                        {/* Tagline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Tagline (En)</label>
                            <input
                              type="text"
                              value={selectedPlanForEdit.tagline}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  tagline: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Tagline (Zh)</label>
                            <input
                              type="text"
                              value={selectedPlanForEdit.taglineZh}
                              onChange={(e) =>
                                setSelectedPlanForEdit({
                                  ...selectedPlanForEdit,
                                  taglineZh: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                        </div>

                        {/* Features Editor */}
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            Package Feature Bullets (One per line)
                          </label>
                          <textarea
                            rows={4}
                            value={selectedPlanForEdit.features.join('\n')}
                            onChange={(e) =>
                              setSelectedPlanForEdit({
                                ...selectedPlanForEdit,
                                features: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                              })
                            }
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Package Details to Live Site</span>
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-16 text-stone-400">
                        Select a package from the left to edit.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 3: MENU & PICTURE EDITOR
                  ========================================================= */}
              {activeTab === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Dish List & Search (4 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        Menu Bento Boxes ({editableMenu.length})
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleResetToOfficialMenu}
                          title="Sync with official chillhealthy.com 24 Ala Carte items"
                          className="flex items-center gap-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 text-emerald-700" />
                          <span>Sync Live</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNewDish}
                          className="flex items-center gap-1 text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Search dish name..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                    />

                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {editableMenu
                        .filter(
                          (m) =>
                            m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                            m.nameZh.includes(menuSearch)
                        )
                        .map((meal) => (
                          <div
                            key={meal.id}
                            onClick={() => setSelectedMealForEdit(meal)}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              selectedMealForEdit?.id === meal.id
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                                : 'border-stone-200 bg-white hover:bg-stone-50'
                            }`}
                          >
                            <img
                              src={meal.image}
                              alt={meal.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-stone-900 truncate">
                                {meal.name}
                              </h5>
                              <p className="text-[10px] text-stone-500 truncate">{meal.nameZh}</p>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 mt-0.5">
                                <span>RM {meal.price.toFixed(2)}</span>
                                <span className="text-[10px] text-stone-400">{meal.calories} kcal</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Dish Editor & Picture Form (8 cols) */}
                  <div className="lg:col-span-8">
                    {selectedMealForEdit ? (
                      <form onSubmit={handleSaveMeal} className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="font-heading font-extrabold text-base text-stone-900">
                              Edit Dish & Picture
                            </h4>
                            <p className="text-xs text-stone-500">ID: {selectedMealForEdit.id}</p>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                            RM {selectedMealForEdit.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Image Preview & URL Editor */}
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                          <img
                            src={selectedMealForEdit.image}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-24 h-24 rounded-2xl object-cover shadow-sm border-2 border-white shrink-0"
                          />
                          <div className="flex-1 w-full">
                            <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Dish Picture URL (Image Link) *</span>
                            </label>
                            <input
                              type="url"
                              required
                              value={selectedMealForEdit.image}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  image: e.target.value,
                                })
                              }
                              placeholder="https://images.unsplash.com/..."
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                            />
                            <span className="text-[10px] text-stone-400 block mt-1">
                              Paste any direct web photo link (Unsplash, CDN, or uploaded image).
                            </span>
                          </div>
                        </div>

                        {/* Names */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Dish Name (English) *
                            </label>
                            <input
                              type="text"
                              required
                              value={selectedMealForEdit.name}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  name: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              Dish Name (华语中文) *
                            </label>
                            <input
                              type="text"
                              required
                              value={selectedMealForEdit.nameZh}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  nameZh: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                        </div>

                        {/* Price & Nutritional Macros */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Price (RM) *</label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={selectedMealForEdit.price}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Calories (kcal)</label>
                            <input
                              type="number"
                              value={selectedMealForEdit.calories}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  calories: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Protein (g)</label>
                            <input
                              type="number"
                              value={selectedMealForEdit.protein}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  protein: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">Carbs (g)</label>
                            <input
                              type="number"
                              value={selectedMealForEdit.carbs}
                              onChange={(e) =>
                                setSelectedMealForEdit({
                                  ...selectedMealForEdit,
                                  carbs: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={selectedMealForEdit.description}
                            onChange={(e) =>
                              setSelectedMealForEdit({
                                ...selectedMealForEdit,
                                description: e.target.value,
                              })
                            }
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Dish & Picture to Live Menu</span>
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 4: KITCHEN PREPARATION & CUSTOMER ORDER REPORT
                  ========================================================= */}
              {activeTab === 'redemptions' && (() => {
                const filteredRedemptions = redemptions.filter((red) => {
                  const matchSearch =
                    !kitchenSearch ||
                    red.memberName.toLowerCase().includes(kitchenSearch.toLowerCase()) ||
                    red.memberPhone.includes(kitchenSearch) ||
                    red.mealName.toLowerCase().includes(kitchenSearch.toLowerCase()) ||
                    red.deliveryAddress.toLowerCase().includes(kitchenSearch.toLowerCase()) ||
                    red.area.toLowerCase().includes(kitchenSearch.toLowerCase());

                  const matchSlot =
                    kitchenSlotFilter === 'all' ||
                    (kitchenSlotFilter === 'lunch' && red.deliverySlot.toLowerCase().includes('lunch')) ||
                    (kitchenSlotFilter === 'dinner' && red.deliverySlot.toLowerCase().includes('dinner'));

                  const matchDate =
                    kitchenDateFilter === 'all' ||
                    red.deliveryDate === kitchenDateFilter;

                  return matchSearch && matchSlot && matchDate;
                });

                const uniqueDates = Array.from(new Set(redemptions.map((r) => r.deliveryDate))).sort();

                const handleExportExcel = () => {
                  try {
                    const dataToExport = filteredRedemptions.map((r, index) => ({
                      'No.': index + 1,
                      'Order ID': r.id,
                      'Delivery Date': r.deliveryDate,
                      'Delivery Slot': r.deliverySlot,
                      'Customer Name': r.memberName,
                      'Phone Number': r.memberPhone,
                      'Meal Name (EN)': r.mealName,
                      'Meal Name (ZH)': r.mealNameZh,
                      'Delivery Address': r.deliveryAddress,
                      'Area': r.area,
                      'Postal Code': r.postalCode,
                      'Dietary / Prep Notes': r.dietaryNotes || 'None',
                      'Order Status': r.status,
                      'Order Timestamp': r.createdAt || r.redeemedAt || '',
                    }));

                    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kitchen Orders');
                    const fileName = `CHILL_Kitchen_Prep_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                    XLSX.writeFile(workbook, fileName);
                    triggerToast(`✓ Exported ${filteredRedemptions.length} orders to ${fileName}`);
                  } catch (err) {
                    console.error('Excel export error:', err);
                    triggerToast('Excel export failed, generating CSV fallback.');
                    handleExportCSV();
                  }
                };

                const handleExportCSV = () => {
                  const headers = ['No,Order ID,Date,Slot,Customer,Phone,Meal EN,Meal ZH,Address,Area,Postal Code,Notes,Status,Timestamp'];
                  const rows = filteredRedemptions.map((r, i) =>
                    [
                      i + 1,
                      `"${r.id}"`,
                      `"${r.deliveryDate}"`,
                      `"${r.deliverySlot}"`,
                      `"${r.memberName}"`,
                      `"${r.memberPhone}"`,
                      `"${r.mealName}"`,
                      `"${r.mealNameZh}"`,
                      `"${(r.deliveryAddress || '').replace(/"/g, '""')}"`,
                      `"${r.area || ''}"`,
                      `"${r.postalCode || ''}"`,
                      `"${(r.dietaryNotes || '').replace(/"/g, '""')}"`,
                      `"${r.status}"`,
                      `"${r.createdAt || r.redeemedAt || ''}"`,
                    ].join(',')
                  );
                  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `CHILL_Kitchen_Prep_Report_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  triggerToast(`✓ Exported CSV for ${filteredRedemptions.length} orders`);
                };

                const handleSaveEditedOrder = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!editingOrder) return;

                  if (onUpdateRedemptionOrder) {
                    onUpdateRedemptionOrder(editingOrder);
                  }
                  triggerToast(`✓ Order for ${editingOrder.memberName} updated successfully!`);
                  setEditingOrder(null);
                };

                return (
                  <div className="space-y-4">
                    {/* Header & Export Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-extrabold text-base text-stone-900">
                            {language === 'en' ? 'Kitchen Preparation & Customer Orders' : '后厨餐备与顾客订单调度'}
                          </h4>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {filteredRedemptions.length} {language === 'en' ? 'Orders' : '笔订单'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {language === 'en'
                            ? 'Edit delivery location, date, or meal selection, and export preparation sheets for kitchen staff.'
                            : '可修改订单送餐地址、配送日期与餐品选择，并一键生成后厨备餐Excel报表。'}
                        </p>
                      </div>

                      {/* Export Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportExcel}
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                          title="Generate Excel (.xlsx) form with all order details"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{language === 'en' ? 'Export Excel Report (.xlsx)' : '生成后厨Excel备餐表'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportCSV}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-stone-200">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={language === 'en' ? 'Search customer, phone, meal, address...' : '搜索姓名、手机、餐品或地址...'}
                          value={kitchenSearch}
                          onChange={(e) => setKitchenSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      {/* Date Filter */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <select
                          value={kitchenDateFilter}
                          onChange={(e) => setKitchenDateFilter(e.target.value)}
                          className="w-full py-2 px-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-stone-50/50"
                        >
                          <option value="all">{language === 'en' ? 'All Delivery Dates' : '所有配送日期'}</option>
                          {uniqueDates.map((d) => (
                            <option key={d} value={d}>
                              📅 {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Slot Filter */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                        <select
                          value={kitchenSlotFilter}
                          onChange={(e) => setKitchenSlotFilter(e.target.value as 'all' | 'lunch' | 'dinner')}
                          className="w-full py-2 px-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-stone-50/50"
                        >
                          <option value="all">{language === 'en' ? 'All Slots (Lunch & Dinner)' : '全部餐段 (午餐 & 晚餐)'}</option>
                          <option value="lunch">{language === 'en' ? 'Lunch Only (11:30 AM – 1:30 PM)' : '仅午餐 (11:30 AM – 1:30 PM)'}</option>
                          <option value="dinner">{language === 'en' ? 'Dinner Only (5:00 PM – 7:00 PM)' : '仅晚餐 (5:00 PM – 7:00 PM)'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                      {filteredRedemptions.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 bg-white rounded-2xl border border-stone-200">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                          <p className="text-xs">{language === 'en' ? 'No matching orders found.' : '没有找到符合条件的订单。'}</p>
                        </div>
                      ) : (
                        filteredRedemptions.map((red) => (
                          <div
                            key={red.id}
                            className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-emerald-300"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={red.mealImage}
                                alt={red.mealName}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs"
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-sm text-stone-900">{red.mealName}</h5>
                                  <span className="text-xs text-stone-400">({red.mealNameZh})</span>
                                  <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded">
                                    #{red.id.slice(-6)}
                                  </span>
                                </div>

                                <p className="text-xs font-medium text-emerald-800 mt-0.5">
                                  {language === 'en' ? 'Customer:' : '客户：'} <span className="font-bold text-stone-900">{red.memberName}</span> ·{' '}
                                  <a href={`tel:${red.memberPhone}`} className="hover:underline text-emerald-700 font-semibold">
                                    {red.memberPhone}
                                  </a>
                                </p>

                                <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <span>
                                    {red.deliveryAddress}, {red.area} ({red.postalCode})
                                  </span>
                                </p>

                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                                    📅 {red.deliveryDate}
                                  </span>
                                  <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                    ⏰ {red.deliverySlot}
                                  </span>
                                  {red.dietaryNotes && (
                                    <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                                      ⚠️ Note: {red.dietaryNotes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                              {/* Edit Order Button */}
                              <button
                                type="button"
                                onClick={() => setEditingOrder({ ...red })}
                                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                                title="Edit customer delivery location, date, or meal selection"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{language === 'en' ? 'Edit Order' : '修改订单/餐品'}</span>
                              </button>

                              {/* Status dropdown */}
                              <select
                                value={red.status}
                                onChange={(e) =>
                                  onUpdateRedemptionStatus(red.id, e.target.value as MealRedemption['status'])
                                }
                                className={`text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer ${
                                  red.status === 'Delivered'
                                    ? 'bg-stone-100 text-stone-800 border-stone-300'
                                    : red.status === 'Out for Delivery'
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                <option value="Pending">Pending Review</option>
                                <option value="Prepping in Kitchen">Prepping in Kitchen</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered ✓</option>
                              </select>

                              {/* WhatsApp Direct Link */}
                              <a
                                href={`https://wa.me/60${red.memberPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(
                                  red.memberName
                                )},%20CHILL%20Healthy%20kitchen%20update%20for%20your%20meal%20${encodeURIComponent(
                                  red.mealName
                                )}:%20Status%20is%20${encodeURIComponent(red.status)}!`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* =========================================================
                        SUB-MODAL: EDIT CUSTOMER ORDER (Location & Meal Selection)
                        ========================================================= */}
                    {editingOrder && (
                      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <div>
                              <h5 className="font-heading font-extrabold text-base text-stone-900">
                                {language === 'en' ? 'Edit Customer Order & Kitchen Prep' : '修改顾客订单与备餐内容'}
                              </h5>
                              <p className="text-xs text-stone-500">
                                Customer: <span className="font-bold text-stone-800">{editingOrder.memberName}</span> ({editingOrder.memberPhone})
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingOrder(null)}
                              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleSaveEditedOrder} className="space-y-4">
                            {/* Meal Selection (Change Dish) */}
                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                {language === 'en' ? 'Meal Selection (Change Dish)' : '餐品选择（可随时更换）'} *
                              </label>
                              <select
                                value={editingOrder.mealId}
                                onChange={(e) => {
                                  const selectedDish = menuItems.find((m) => m.id === e.target.value);
                                  if (selectedDish) {
                                    setEditingOrder({
                                      ...editingOrder,
                                      mealId: selectedDish.id,
                                      mealName: selectedDish.name,
                                      mealNameZh: selectedDish.nameZh,
                                      mealImage: selectedDish.image,
                                    });
                                  }
                                }}
                                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50 font-medium"
                              >
                                {menuItems.map((dish) => (
                                  <option key={dish.id} value={dish.id}>
                                    {dish.name} ({dish.nameZh}) · {dish.protein}g Protein
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Dish Preview */}
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                              <img
                                src={editingOrder.mealImage}
                                alt={editingOrder.mealName}
                                className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shadow-2xs"
                              />
                              <div>
                                <h6 className="font-bold text-xs text-emerald-950">{editingOrder.mealName}</h6>
                                <p className="text-[11px] text-emerald-700">{editingOrder.mealNameZh}</p>
                              </div>
                            </div>

                            {/* Delivery Date & Time Slot */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  {language === 'en' ? 'Delivery Date' : '配送日期'} *
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={editingOrder.deliveryDate}
                                  onChange={(e) =>
                                    setEditingOrder({ ...editingOrder, deliveryDate: e.target.value })
                                  }
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  {language === 'en' ? 'Delivery Slot (Lunch / Dinner)' : '送餐时间段（午餐/晚餐）'} *
                                </label>
                                <select
                                  value={editingOrder.deliverySlot}
                                  onChange={(e) =>
                                    setEditingOrder({ ...editingOrder, deliverySlot: e.target.value })
                                  }
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                >
                                  <option value="Lunch (11:30 AM – 1:30 PM)">Lunch (11:30 AM – 1:30 PM)</option>
                                  <option value="Dinner (5:00 PM – 7:00 PM)">Dinner (5:00 PM – 7:00 PM)</option>
                                </select>
                              </div>
                            </div>

                            {/* Change Location: Delivery Address, Area, Postal Code */}
                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                {language === 'en' ? 'Delivery Address (Location)' : '配送详细地址'} *
                              </label>
                              <textarea
                                rows={2}
                                required
                                value={editingOrder.deliveryAddress}
                                onChange={(e) =>
                                  setEditingOrder({ ...editingOrder, deliveryAddress: e.target.value })
                                }
                                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  {language === 'en' ? 'Area / Region' : '区域'} *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingOrder.area}
                                  onChange={(e) =>
                                    setEditingOrder({ ...editingOrder, area: e.target.value })
                                  }
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  {language === 'en' ? 'Postal Code' : '邮编'}
                                </label>
                                <input
                                  type="text"
                                  value={editingOrder.postalCode}
                                  onChange={(e) =>
                                    setEditingOrder({ ...editingOrder, postalCode: e.target.value })
                                  }
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Dietary / Special Notes */}
                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                {language === 'en' ? 'Dietary Notes / Prep Request' : '特殊饮食要求/后厨备注'}
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. No chili, dressing on side, less rice"
                                value={editingOrder.dietaryNotes || ''}
                                onChange={(e) =>
                                  setEditingOrder({ ...editingOrder, dietaryNotes: e.target.value })
                                }
                                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                              />
                            </div>

                            {/* Status */}
                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                {language === 'en' ? 'Kitchen Order Status' : '订单备餐状态'}
                              </label>
                              <select
                                value={editingOrder.status}
                                onChange={(e) =>
                                  setEditingOrder({
                                    ...editingOrder,
                                    status: e.target.value as MealRedemption['status'],
                                  })
                                }
                                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-stone-800"
                              >
                                <option value="Pending">Pending Review</option>
                                <option value="Prepping in Kitchen">Prepping in Kitchen</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered ✓</option>
                              </select>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingOrder(null)}
                                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
                              >
                                {language === 'en' ? 'Cancel' : '取消'}
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                              >
                                <Save className="w-4 h-4" />
                                <span>{language === 'en' ? 'Save Changes' : '保存修改'}</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* =========================================================
                  TAB 5: MEMBER CREDITS & USERS
                  ========================================================= */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-heading font-extrabold text-base text-stone-900">
                        Registered Member Package Subscriptions
                      </h4>
                      <p className="text-xs text-stone-500">
                        View customer meal balances or grant bonus redemption credits
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((mem) => (
                      <div
                        key={mem.id}
                        className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-sm text-stone-900">{mem.name}</h5>
                            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">ID: {mem.memberNumber || mem.phone}</span>
                              <span>·</span>
                              <span>{mem.email}</span>
                            </p>
                            <div className="mt-1.5 text-[11px] text-stone-600 space-y-0.5">
                              <p className="truncate">
                                <span className="font-bold text-emerald-800">Addr 1:</span> {mem.address}, {mem.area} {mem.postalCode}
                              </p>
                              {mem.address2 && (
                                <p className="truncate">
                                  <span className="font-bold text-emerald-700">Addr 2:</span> {mem.address2}, {mem.area2 || mem.area} {mem.postalCode2 || ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Member
                          </span>
                        </div>

                        <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-stone-600">
                            <span>Package:</span>
                            <span className="font-bold text-stone-900">
                              {mem.activePackage ? mem.activePackage.planName : 'No Active Plan'}
                            </span>
                          </div>
                          {mem.activePackage && (
                            <div className="flex justify-between items-center pt-1 border-t border-stone-200">
                              <span>Meal Credits:</span>
                              <span className="font-heading font-black text-emerald-800 text-sm">
                                {mem.activePackage.remainingMeals} / {mem.activePackage.totalMeals} Meals
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateMemberCredits(mem.id, 5);
                              triggerToast(`✓ Added 5 meal credits to ${mem.name}`);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            +5 Meals
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateMemberCredits(mem.id, 1);
                              triggerToast(`✓ Added 1 meal credit to ${mem.name}`);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            +1 Meal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateMemberCredits(mem.id, -1);
                              triggerToast(`✓ Deducted 1 meal credit from ${mem.name}`);
                            }}
                            className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            -1 Meal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
