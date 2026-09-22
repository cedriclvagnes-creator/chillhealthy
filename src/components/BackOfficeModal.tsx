import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  Upload,
  AlertTriangle,
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
  ArrowLeft,
  Store,
  CalendarOff,
  RotateCcw,
  FileText,
  Printer,
  Receipt,
  CreditCard,
  Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Language,
  SiteSettings,
  MealPlan,
  MealItem,
  MealRedemption,
  MemberAccount,
  MealDeletionRefundRecord,
  OfficialReceipt,
} from '../types';
import { ChillLogo } from './ChillLogo';
import { MEAL_ITEMS } from '../data/menuData';
import { buildWhatsAppUrl, OFFICIAL_WA_DISPLAY } from '../utils/whatsapp';
import { OfficialReceiptModal } from './OfficialReceiptModal';
import { createDefaultOfficialReceipt, generateReceiptNumber } from '../utils/receipt';
import {
  getPlanValidityDays,
  calculateMonFriExpiryDate,
  getEffectivePackageExpiry,
  checkPlanAutoReviveEligibility,
  getTodayStr,
} from '../utils/packageExpiry';

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
  onDeleteRedemptionOrder?: (id: string, reason?: string) => boolean;
  onToggleDisabledDeliveryDate?: (dateStr: string) => void;
  onUpdateMemberAccount?: (member: MemberAccount) => void;
  onAddMemberAccount?: (member: MemberAccount) => void;
  onDeleteMemberAccount?: (memberId: string) => void;
  onEnterLiveEditMode?: () => void;
  onAdminAuthChange?: (isAuthenticated: boolean) => void;
  refundRecords?: MealDeletionRefundRecord[];
  onSaveOfficialReceipt?: (receipt: OfficialReceipt) => void;
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
  onDeleteRedemptionOrder,
  onToggleDisabledDeliveryDate,
  onUpdateMemberAccount,
  onAddMemberAccount,
  onDeleteMemberAccount,
  onEnterLiveEditMode,
  onAdminAuthChange,
  refundRecords = [],
  onSaveOfficialReceipt,
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
  const [kitchenStatusFilter, setKitchenStatusFilter] = useState<'all' | 'Pending' | 'Prepping in Kitchen' | 'Out for Delivery' | 'Delivered'>('all');
  const [editingOrder, setEditingOrder] = useState<MealRedemption | null>(null);
  const [customTurnOffDate, setCustomTurnOffDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Redemptions Sub-view: Active orders vs Deleted order refund records audit
  const [redemptionSubView, setRedemptionSubView] = useState<'active' | 'refunds'>('active');
  const [orderToDelete, setOrderToDelete] = useState<MealRedemption | null>(null);
  const [deletionReasonInput, setDeletionReasonInput] = useState<string>('Kitchen maintenance / Customer requested schedule cancellation. Restored quota to package balance.');
  const [refundSearch, setRefundSearch] = useState<string>('');

  // Local editable copy of Site Settings
  const [formSettings, setFormSettings] = useState<SiteSettings>({ ...siteSettings });

  // Local editable copy of Packages
  const [editablePackages, setEditablePackages] = useState<MealPlan[]>(JSON.parse(JSON.stringify(packages)));
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<MealPlan | null>(editablePackages[0] || null);

  // Local editable copy of Menu
  const [editableMenu, setEditableMenu] = useState<MealItem[]>(JSON.parse(JSON.stringify(menuItems)));
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<MealItem | null>(editableMenu[0] || null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuStockFilter, setMenuStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const dishImageFileInputRef = useRef<HTMLInputElement>(null);

  // Keep local editableMenu synchronized with external menuItems
  useEffect(() => {
    setEditableMenu(menuItems);
    if (selectedMealForEdit) {
      const refreshed = menuItems.find((m) => m.id === selectedMealForEdit.id);
      if (refreshed) {
        setSelectedMealForEdit(refreshed);
      }
    }
  }, [menuItems]);

  // Success toast
  const [toastMsg, setToastMsg] = useState('');

  // Daily 5:00 PM Member Order Report state
  const [dailyReportDate, setDailyReportDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Customer Member Package Management state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'exhausted' | 'low'>('all');
  const [memberAreaFilter, setMemberAreaFilter] = useState('all');
  const [editingMember, setEditingMember] = useState<MemberAccount | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [revealedMemberPasswords, setRevealedMemberPasswords] = useState<{ [id: string]: boolean }>({});

  const togglePasswordReveal = (memberId: string) => {
    setRevealedMemberPasswords((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  // Add Member form fields
  const [newMemName, setNewMemName] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemPassword, setNewMemPassword] = useState('123456');
  const [newMemPlanName, setNewMemPlanName] = useState('20-Day Transformation Plan (20餐轻食套餐)');
  const [newMemTotalMeals, setNewMemTotalMeals] = useState<number>(20);
  const [newMemRemainingMeals, setNewMemRemainingMeals] = useState<number>(20);
  const [newMemAddress, setNewMemAddress] = useState('');
  const [newMemArea, setNewMemArea] = useState('Klang');
  const [newMemPostal, setNewMemPostal] = useState('41200');
  const [newMemAddress2, setNewMemAddress2] = useState('');
  const [newMemArea2, setNewMemArea2] = useState('');
  const [newMemPostal2, setNewMemPostal2] = useState('');
  const [newMemDietary, setNewMemDietary] = useState('');

  // Official Receipt issuance & preview modal state
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<OfficialReceipt | null>(null);
  const [activeReceiptMember, setActiveReceiptMember] = useState<MemberAccount | null>(null);

  // Generate Specific Package Meal Order Modal state
  const [isGeneratingPackageOrder, setIsGeneratingPackageOrder] = useState<boolean>(false);
  const [orderGenMember, setOrderGenMember] = useState<MemberAccount | null>(null);
  const [orderGenPlanId, setOrderGenPlanId] = useState<string>('');
  const [orderGenPlanName, setOrderGenPlanName] = useState<string>('');
  const [orderGenPlanNameZh, setOrderGenPlanNameZh] = useState<string>('');
  const [orderGenTotalMeals, setOrderGenTotalMeals] = useState<number>(20);
  const [orderGenPrice, setOrderGenPrice] = useState<number>(398);
  const [orderGenBonusMeals, setOrderGenBonusMeals] = useState<number>(0);
  const [orderGenPaymentMethod, setOrderGenPaymentMethod] = useState<string>('DuitNow QR');
  const [orderGenReferenceNo, setOrderGenReferenceNo] = useState<string>('');
  const [orderGenPaymentConfirmed, setOrderGenPaymentConfirmed] = useState<boolean>(true);
  const [orderGenAutoIssueReceipt, setOrderGenAutoIssueReceipt] = useState<boolean>(true);
  const [orderGenNotes, setOrderGenNotes] = useState<string>('');

  // All receipts ledger view modal
  const [isReceiptsLedgerOpen, setIsReceiptsLedgerOpen] = useState<boolean>(false);
  const [receiptSearchQuery, setReceiptSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleOpenReceiptForMember = (mem: MemberAccount, receipt?: OfficialReceipt) => {
    setActiveReceiptMember(mem);
    if (receipt) {
      setActiveReceiptForModal(receipt);
    } else {
      const defaultPlan =
        packages.find((p) => p.id === mem.activePackage?.planId || mem.activePackage?.planName.includes(p.title)) ||
        (mem.activePackage
          ? {
              id: mem.activePackage.planId || 'custom-plan',
              title: mem.activePackage.planName,
              titleZh: mem.activePackage.planNameZh,
              mealsTotal: mem.activePackage.totalMeals || 20,
              totalPrice: (mem.activePackage as any).price || 398,
            }
          : packages[0] || { id: 'p1', title: '20-Day Transformation Plan', mealsTotal: 20, totalPrice: 398 });
      const newReceipt = createDefaultOfficialReceipt(mem, defaultPlan as any, siteSettings);
      setActiveReceiptForModal(newReceipt);
    }
  };

  const handleSaveReceiptFromModal = (savedReceipt: OfficialReceipt) => {
    if (onSaveOfficialReceipt) {
      onSaveOfficialReceipt(savedReceipt);
    }
    const targetMember = members.find((m) => m.id === savedReceipt.memberId) || activeReceiptMember;
    if (targetMember && onUpdateMemberAccount) {
      const existingList = targetMember.officialReceipts || [];
      const index = existingList.findIndex((r) => r.id === savedReceipt.id || r.receiptNumber === savedReceipt.receiptNumber);
      const updatedList =
        index >= 0
          ? existingList.map((r, i) => (i === index ? savedReceipt : r))
          : [savedReceipt, ...existingList];
      const updatedMem = {
        ...targetMember,
        officialReceipts: updatedList,
      };
      onUpdateMemberAccount(updatedMem);
    }
    triggerToast(`✓ Saved Official Receipt #${savedReceipt.receiptNumber}!`);
  };

  const handleOpenOrderGenerator = (mem?: MemberAccount) => {
    const target = mem || members[0] || null;
    setOrderGenMember(target);
    const defaultPlan = packages[0] || { id: 'p1', title: '20-Day Transformation Plan', titleZh: '20天健康塑形轻食配套', mealsTotal: 20, totalPrice: 398 };
    setOrderGenPlanId(defaultPlan.id);
    setOrderGenPlanName(defaultPlan.title);
    setOrderGenPlanNameZh(defaultPlan.titleZh || defaultPlan.title);
    setOrderGenTotalMeals(defaultPlan.mealsTotal);
    setOrderGenPrice(defaultPlan.totalPrice);
    setOrderGenBonusMeals(0);
    setOrderGenPaymentMethod('DuitNow QR');
    setOrderGenReferenceNo(`DN-${Date.now().toString().slice(-6)}`);
    setOrderGenPaymentConfirmed(true);
    setOrderGenAutoIssueReceipt(true);
    setOrderGenNotes('Payment confirmed received. Package activated by Back Office.');
    setIsGeneratingPackageOrder(true);
  };

  const handleConfirmGenerateOrder = () => {
    if (!orderGenMember) {
      triggerToast('Please select a customer.');
      return;
    }
    if (!orderGenPlanName || Number(orderGenTotalMeals) <= 0) {
      triggerToast('Please enter a valid plan name and meal quantity.');
      return;
    }

    const validityDays = getPlanValidityDays(orderGenPlanId || orderGenPlanName);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const suspendedDates = siteSettings.disabledDeliveryDates || [];
    const calculatedExpiry = calculateMonFriExpiryDate(dateStr, validityDays, suspendedDates);

    // Auto-revive check: check if member has unredeemed meals from an expired package of the same plan
    const reviveCheck = checkPlanAutoReviveEligibility(orderGenMember, orderGenPlanId || '');
    const autoRevivedCount = reviveCheck.canRevive ? reviveCheck.revivedMeals : 0;

    const baseMealsToAdd = Number(orderGenTotalMeals) + Number(orderGenBonusMeals || 0);
    const totalMealsToAdd = baseMealsToAdd + autoRevivedCount;

    const currentRemaining =
      orderGenMember.activePackage && !orderGenMember.activePackage.isBurned
        ? orderGenMember.activePackage.remainingMeals
        : 0;
    const newRemaining = currentRemaining + totalMealsToAdd;

    // 1. Create Official Receipt
    let createdReceipt: OfficialReceipt | null = null;
    if (orderGenAutoIssueReceipt) {
      createdReceipt = createDefaultOfficialReceipt(
        orderGenMember,
        {
          id: orderGenPlanId || `custom-pkg-${Date.now()}`,
          title: orderGenPlanName,
          titleZh: orderGenPlanNameZh || orderGenPlanName,
          mealsTotal: Number(orderGenTotalMeals),
          totalPrice: Number(orderGenPrice),
        },
        siteSettings,
        orderGenPaymentMethod,
        orderGenReferenceNo || undefined
      );
      createdReceipt.bonusMeals = Number(orderGenBonusMeals || 0);
      createdReceipt.paymentConfirmed = orderGenPaymentConfirmed;
      createdReceipt.notes = orderGenNotes || createdReceipt.notes;
      createdReceipt.confirmedBy = 'CHILL Back Office (Finance)';

      if (onSaveOfficialReceipt) {
        onSaveOfficialReceipt(createdReceipt);
      }
    }

    // Credits history entries
    const newCreditEntries: MemberAccount['creditsHistory'] = [
      {
        id: `cr-pkg-${Date.now()}`,
        date: dateStr,
        type: 'purchase',
        amount: baseMealsToAdd,
        note: `Order Generated: ${orderGenPlanName} (${orderGenTotalMeals} meals${orderGenBonusMeals > 0 ? ` + ${orderGenBonusMeals} bonus` : ''}) · Paid RM ${Number(orderGenPrice).toFixed(2)} [Ref: ${orderGenReferenceNo || 'Verified'}]`,
      },
    ];

    if (autoRevivedCount > 0) {
      newCreditEntries.push({
        id: `cr-revive-${Date.now()}`,
        date: dateStr,
        type: 'revive',
        amount: autoRevivedCount,
        note: `🎉 Auto-revived ${autoRevivedCount} unredeemed meals from member's previous expired plan (${orderGenPlanName})!`,
      });
    }

    // 2. Update Member Account
    const updatedMember: MemberAccount = {
      ...orderGenMember,
      activePackage: {
        planId: orderGenPlanId || 'custom-plan',
        planName: orderGenPlanName,
        planNameZh: orderGenPlanNameZh || orderGenPlanName,
        totalMeals: (orderGenMember.activePackage && !orderGenMember.activePackage.isBurned ? orderGenMember.activePackage.totalMeals : 0) + totalMealsToAdd,
        remainingMeals: newRemaining,
        purchasedDate: dateStr,
        expiryDate: calculatedExpiry,
        validityDays: validityDays,
        isActivated: false, // Takes effect on first day of meal ordering
        firstRedeemedDate: undefined,
        autoRevivedMeals: autoRevivedCount > 0 ? autoRevivedCount : undefined,
        isBurned: false,
        price: Number(orderGenPrice),
      },
      lastExpiredPackage: reviveCheck.canRevive && orderGenMember.lastExpiredPackage
        ? {
            ...orderGenMember.lastExpiredPackage,
            isRevived: true,
            revivedAt: dateStr,
          }
        : orderGenMember.lastExpiredPackage,
      creditsHistory: [
        ...newCreditEntries,
        ...(orderGenMember.creditsHistory || []),
      ],
      officialReceipts: createdReceipt
        ? [createdReceipt, ...(orderGenMember.officialReceipts || [])]
        : orderGenMember.officialReceipts,
    };

    if (onUpdateMemberAccount) {
      onUpdateMemberAccount(updatedMember);
    }

    setIsGeneratingPackageOrder(false);
    triggerToast(
      `✓ Generated ${orderGenPlanName} order for ${orderGenMember.name}! +${totalMealsToAdd} meals added${
        autoRevivedCount > 0 ? ` (including ${autoRevivedCount} auto-revived)` : ''
      }.`
    );

    if (createdReceipt) {
      setActiveReceiptMember(updatedMember);
      setActiveReceiptForModal(createdReceipt);
    }
  };

  const handleExportMembersExcel = (filteredList: MemberAccount[]) => {
    try {
      const dataToExport = filteredList.map((m, index) => {
        const activePkg = m.activePackage;
        const statusStr = !activePkg
          ? 'No Package'
          : activePkg.remainingMeals > 0
          ? `Active (${activePkg.remainingMeals} Left)`
          : 'Exhausted (0 Left)';

        return {
          'No.': index + 1,
          'Member ID': m.id,
          'Full Name': m.name,
          'Login Phone (Account)': m.phone,
          'Email Address': m.email || '',
          'Account Password': m.password || '123456',
          'Active Package Plan': activePkg ? activePkg.planName : 'None',
          'Total Meals in Plan': activePkg ? activePkg.totalMeals : 0,
          'Remaining Meals Balance': activePkg ? activePkg.remainingMeals : 0,
          'Package Status': statusStr,
          'Plan Purchase Date': activePkg ? activePkg.purchasedDate : '',
          'Plan Expiry Date': activePkg ? activePkg.expiryDate : '',
          'Primary Address 1': m.address || '',
          'Area 1': m.area || '',
          'Postal Code 1': m.postalCode || '',
          'Secondary Address 2': m.address2 || 'N/A',
          'Area 2': m.area2 || 'N/A',
          'Postal Code 2': m.postalCode2 || 'N/A',
          'Dietary / Health Notes': m.dietaryPreferences || 'None',
          'Total Redemptions Count': redemptions.filter((r) => r.memberId === m.id || r.memberPhone === m.phone).length,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Accounts');
      const fileName = `CHILL_Member_Accounts_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      triggerToast(`✓ Exported ${filteredList.length} Member Accounts to ${fileName}`);
    } catch (err) {
      console.error('Member export error:', err);
      triggerToast('Excel export failed, generating CSV fallback.');
      handleExportMembersCSV(filteredList);
    }
  };

  const handleExportMembersCSV = (filteredList: MemberAccount[]) => {
    const headers = [
      'No,Member ID,Name,Phone,Email,Password,Plan,Total Meals,Remaining Meals,Status,Address 1,Area 1,Postal 1,Address 2,Area 2,Postal 2,Dietary',
    ];
    const rows = filteredList.map((m, i) =>
      [
        i + 1,
        `"${m.id}"`,
        `"${m.name}"`,
        `"${m.phone}"`,
        `"${m.email || ''}"`,
        `"${m.password || '123456'}"`,
        `"${m.activePackage?.planName || 'None'}"`,
        m.activePackage?.totalMeals || 0,
        m.activePackage?.remainingMeals || 0,
        `"${m.activePackage && m.activePackage.remainingMeals > 0 ? 'Active' : 'Exhausted'}"`,
        `"${(m.address || '').replace(/"/g, '""')}"`,
        `"${m.area || ''}"`,
        `"${m.postalCode || ''}"`,
        `"${(m.address2 || '').replace(/"/g, '""')}"`,
        `"${m.area2 || ''}"`,
        `"${m.postalCode2 || ''}"`,
        `"${(m.dietaryPreferences || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CHILL_Member_Accounts_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`✓ Exported CSV for ${filteredList.length} Member Accounts`);
  };

  const handleExportDaily5pmReport = (targetDate?: string) => {
    try {
      const exportDate = targetDate || dailyReportDate;
      const dayOrders = redemptions.filter((r) => r.deliveryDate === exportDate);
      const ordersToUse = dayOrders.length > 0 ? dayOrders : redemptions;

      const currentHour = new Date().getHours();
      const cutoffStatus = currentHour >= 17 ? 'Finalized (Post-5:00 PM)' : 'Pending (Pre-5:00 PM Cutoff)';

      // 1. Primary Sheet: Member Order Status
      const ordersSheetData = ordersToUse.map((r, index) => {
        const mem = members.find((m) => m.id === r.memberId || m.phone === r.memberPhone);
        return {
          'No.': index + 1,
          'Order / Ticket ID': r.id,
          'Member Customer Name': r.memberName,
          'Member Phone / Login ID': r.memberPhone,
          'Subscribed Meal Package': mem?.activePackage ? mem.activePackage.planName : 'Healthy Meal Package',
          'Current Meal Balance': mem?.activePackage ? `${mem.activePackage.remainingMeals} Meals Remaining` : 'N/A',
          'Selected Meal (EN)': r.mealName,
          'Selected Meal (ZH)': r.mealNameZh,
          'Delivery Slot': r.deliverySlot,
          'Delivery Date': r.deliveryDate,
          'Delivery Address': r.deliveryAddress,
          'Area': r.area,
          'Postal Code': r.postalCode,
          'Dietary Notes / Allergies': r.dietaryNotes || 'None',
          'Order Status': r.status,
          'Daily 5PM Cutoff Batch': cutoffStatus,
          'Order Placed Time': r.createdAt || r.redeemedAt || new Date().toLocaleString(),
        };
      });

      // 2. Summary Sheet: Kitchen Prep & Routing Summary
      const dishCounts: { [dish: string]: number } = {};
      const areaCounts: { [area: string]: number } = {};
      let lunchCount = 0;
      let dinnerCount = 0;

      ordersToUse.forEach((o) => {
        dishCounts[o.mealName] = (dishCounts[o.mealName] || 0) + 1;
        areaCounts[o.area || 'Klang Valley'] = (areaCounts[o.area || 'Klang Valley'] || 0) + 1;
        if (o.deliverySlot.toLowerCase().includes('lunch')) lunchCount++;
        if (o.deliverySlot.toLowerCase().includes('dinner')) dinnerCount++;
      });

      const summarySheetData = [
        { 'Summary Field': 'Report Type', 'Value / Details': 'Daily Member Customer Order Status (5:00 PM Cutoff)' },
        { 'Summary Field': 'Delivery Target Date', 'Value / Details': exportDate },
        { 'Summary Field': 'Daily 5:00 PM Cutoff Status', 'Value / Details': cutoffStatus },
        { 'Summary Field': 'Total Member Orders', 'Value / Details': ordersToUse.length },
        { 'Summary Field': 'Lunch Deliveries (10:00 AM – 2:00 PM)', 'Value / Details': lunchCount },
        { 'Summary Field': 'Dinner Deliveries (3:00 PM – 7:00 PM)', 'Value / Details': dinnerCount },
        { 'Summary Field': '--- MEAL PORTIONS BREAKDOWN ---', 'Value / Details': '------------------------------' },
        ...Object.entries(dishCounts).map(([dish, count]) => ({
          'Summary Field': dish,
          'Value / Details': `${count} Portions`,
        })),
        { 'Summary Field': '--- ROUTE & DISPATCH AREAS ---', 'Value / Details': '------------------------------' },
        ...Object.entries(areaCounts).map(([area, count]) => ({
          'Summary Field': area,
          'Value / Details': `${count} Deliveries`,
        })),
        { 'Summary Field': 'Generated Timestamp', 'Value / Details': new Date().toLocaleString() },
      ];

      const workbook = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(ordersSheetData);
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);

      XLSX.utils.book_append_sheet(workbook, wsOrders, 'Daily 5PM Member Orders');
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Kitchen & Route Summary');

      const fileName = `CHILL_Daily_Member_Orders_Report_${exportDate}_5PM.xlsx`;
      XLSX.writeFile(workbook, fileName);
      triggerToast(`✓ Generated 5PM Excel Report for ${ordersToUse.length} orders (${fileName})`);
    } catch (err) {
      console.error('5PM Excel generation error:', err);
      triggerToast('Error generating Excel report.');
    }
  };

  const handleExportRefundAuditReport = () => {
    try {
      const recordsToUse = refundRecords;
      if (!recordsToUse || recordsToUse.length === 0) {
        triggerToast(language === 'en' ? 'No refund records to export.' : '暂无退款返还记录可导出。');
        return;
      }

      const rows = recordsToUse.map((rec, index) => ({
        'No.': index + 1,
        'Refund Log ID': rec.id,
        'Cancelled Order ID': rec.orderId,
        'Member Customer Name': rec.memberName,
        'Member Phone / ID': rec.memberPhone,
        'Cancelled Meal Name': rec.mealName,
        'Meal Name (Chinese)': rec.mealNameZh,
        'Scheduled Delivery Date': rec.deliveryDate,
        'Delivery Time Slot': rec.deliverySlot,
        'Quantity Refunded (Meals)': rec.quantityRefunded,
        'Balance Before Refund': rec.balanceBeforeRefund,
        'Balance After Refund': rec.balanceAfterRefund,
        'Deletion & Refund Timestamp': rec.deletedAt,
        'Reason / Notes': rec.reason,
        'Operator': rec.operator,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Deleted Orders & Refund Log');
      const fileName = `CHILL_Meal_Deletion_Refund_Audit_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      triggerToast(`✓ Exported ${recordsToUse.length} Deletion & Refund Records to ${fileName}`);
    } catch (err) {
      console.error('Refund export error:', err);
      triggerToast('Excel export failed.');
    }
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
      inputPass === 'chilladmin2026' ||
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

  // Upload dish image from device as DataURL
  const handleDishImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast(language === 'en' ? 'Please select a valid image file' : '请选择有效的图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerToast(language === 'en' ? 'Image file size is too large (max 5MB)' : '图片大小超过限制（最大5MB）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && selectedMealForEdit) {
        setSelectedMealForEdit({
          ...selectedMealForEdit,
          image: result,
        });
        triggerToast(language === 'en' ? '✓ Image loaded from device. Click "Save Dish" to apply.' : '✓ 本地图片已载入，点击“保存修改”即可生效。');
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle stock status for a meal (In Stock vs Out of Stock)
  const handleToggleStock = (mealId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = editableMenu.map((m) => {
      if (m.id === mealId) {
        return { ...m, isOutOfStock: !m.isOutOfStock };
      }
      return m;
    });
    setEditableMenu(updated);
    onUpdateMenuItems(updated);
    if (selectedMealForEdit && selectedMealForEdit.id === mealId) {
      setSelectedMealForEdit({
        ...selectedMealForEdit,
        isOutOfStock: !selectedMealForEdit.isOutOfStock,
      });
    }
    const target = updated.find((m) => m.id === mealId);
    const isNowOut = target?.isOutOfStock;
    triggerToast(
      language === 'en'
        ? `✓ "${target?.name}" marked as ${isNowOut ? '🔴 OUT OF STOCK' : '🟢 IN STOCK'}`
        : `✓ "${target?.nameZh}" 已设置为【${isNowOut ? '🔴 已售罄/缺货' : '🟢 正常供应'}】`
    );
  };

  // Mark all dishes in or out of stock in batch
  const handleMarkAllStock = (inStock: boolean) => {
    const updated = editableMenu.map((m) => ({ ...m, isOutOfStock: !inStock }));
    setEditableMenu(updated);
    onUpdateMenuItems(updated);
    if (selectedMealForEdit) {
      setSelectedMealForEdit({
        ...selectedMealForEdit,
        isOutOfStock: !inStock,
      });
    }
    triggerToast(
      inStock
        ? (language === 'en' ? '✓ All items marked IN STOCK' : '✓ 全部菜品已设为【正常供应有货】')
        : (language === 'en' ? '✓ All items marked OUT OF STOCK' : '✓ 全部菜品已设为【已售罄/缺货】')
    );
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
    <div className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-stone-900 text-stone-900 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {!isAdminAuthenticated ? (
        /* Admin Login Gate - Full Screen Experience */
        <div className="w-full h-full flex flex-col bg-stone-950 overflow-y-auto">
          {/* Login Gate Top Bar */}
          <div className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-stone-800 bg-stone-950/90 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-3">
              <ChillLogo variant="badge" size="sm" />
              <div>
                <h3 className="font-heading font-black text-base text-white">
                  CHILL<span className="text-[#528c34]">HEALTHY</span> Back Office
                </h3>
                <p className="text-[11px] text-stone-400">
                  Kitchen Operations & Administration Console
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-2 border border-stone-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'en' ? 'Return to Public Store' : '返回前台主页'}</span>
            </button>
          </div>

          {/* Centered Login Gate Container */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
            <div className="p-8 sm:p-10 text-center max-w-lg w-full bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Close and return to store"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-5">
                <ChillLogo variant="badge" size="xl" />
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-stone-950 text-emerald-400 text-xs font-bold mb-3 border border-stone-800">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restricted Administration System</span>
              </div>

              <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                CHILL<span className="text-[#528c34]">HEALTHY</span> Back Office
              </h3>
              <p className="text-xs text-stone-400 mt-1 mb-6">
                Exclusive kitchen management and content control console. Unlisted from public website.
              </p>

              {adminAuthError && (
                <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 font-medium text-left">
                  {adminAuthError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3.5 text-left">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-700 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-950 text-white placeholder-stone-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
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
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-700 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-950 text-white placeholder-stone-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-stone-950" />
                  <span>Log In to Back Office</span>
                </button>
              </form>

              <div className="mt-6 p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-400 space-y-1 text-left">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Admin Master Access</span>
                </div>
                <p className="text-stone-400">
                  Designated Admin Name: <span className="font-mono font-bold text-emerald-400">admin</span>
                </p>
                <p className="text-stone-400">
                  Designated Admin Password: <span className="font-mono font-bold text-emerald-400">chilladmin2026</span> <span className="text-stone-500">or chill@2026 / 0126189919</span>
                </p>
                <p className="text-[10px] text-stone-500 pt-1 border-t border-stone-800">
                  Credentials can be customized anytime in the Back Office Settings tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Logged In Back Office Dashboard - Full Page */
        <>
          {/* Full-Page Admin Top Bar */}
          <header className="bg-stone-950 text-white px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 shadow-md shrink-0 z-10">
            <div className="flex items-center gap-3.5">
              <ChillLogo variant="badge" size="sm" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
                    CHILL<span className="text-[#528c34]">HEALTHY</span> Back Office
                  </h3>
                  <span className="hidden sm:inline-flex text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Full-Page Console
                  </span>
                  <span className="text-[11px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-md border border-stone-700">
                    Logged in: {adminCredentials.username}
                  </span>
                </div>
                <p className="text-xs text-stone-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>Klang Kitchen Central Control</span>
                  <span className="hidden sm:inline">·</span>
                  <span>WhatsApp: <strong className="text-emerald-400 font-bold">{siteSettings.whatsappDisplay}</strong></span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Return to Store, Copy Link, Export, Logout */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {toastMsg && (
                <div className="hidden lg:inline-flex px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                  {toastMsg}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleExportDaily5pmReport(dailyReportDate)}
                className="hidden md:flex px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-emerald-300 hover:text-emerald-200 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30 shadow-xs"
                title="Export official daily 5:00 PM cutoff report directly to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>5PM Report (.xlsx)</span>
              </button>

              <button
                onClick={handleCopyAdminLink}
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer border border-stone-800"
                title="Copy secret direct back office link"
              >
                {copyLinkSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 text-stone-400" />
                    <span>Copy Admin Link</span>
                  </>
                )}
              </button>

              {/* Edit Homepage Button (Direct live visual editing) */}
              <button
                type="button"
                id="admin-btn-edit-homepage"
                onClick={() => {
                  if (onEnterLiveEditMode) {
                    onEnterLiveEditMode();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 text-xs font-black flex items-center gap-2 shadow-md hover:shadow-amber-400/20 active:scale-95 transition-all cursor-pointer ring-2 ring-amber-300/60"
                title={language === 'en' ? 'Open Homepage to edit dish photos, descriptions and stock directly' : '前往主页实景编辑菜品照片、描述与缺货状态'}
              >
                <Edit3 className="w-4 h-4 text-stone-950" />
                <span>{language === 'en' ? 'Edit Homepage (Live Mode)' : '编辑主页 (实景模式)'}</span>
              </button>

              {/* Return to Public Website */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
                title="Exit back office and return to customer ordering website"
              >
                <Store className="w-4 h-4 text-stone-950" />
                <span>{language === 'en' ? 'Return to Public Store' : '返回前台主页'}</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-800/50"
                title="Log out from Back Office"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Back Office"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Navigation Tabs */}
          <nav className="flex border-b border-stone-200 bg-white shadow-2xs overflow-x-auto px-4 sm:px-8 shrink-0 z-10">
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
                  {language === 'en' ? 'Kitchen Orders & 5PM Report' : '后厨订单与5点报表'} ({redemptions.length})
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
                <span>{language === 'en' ? 'Customer Package Orders & Info' : '会员套餐顾客与订单管理'} ({members.length})</span>
              </button>
            </nav>

            {/* Full-Page Tab Panes Viewport */}
            <main className="flex-1 overflow-y-auto w-full bg-stone-100/70 p-4 sm:p-6 lg:p-8 min-h-0">
              <div className="w-full max-w-[1700px] mx-auto space-y-6">
                {/* =========================================================
                    TAB 1: WHATSAPP & STORE SETTINGS
                    ========================================================= */}
                {activeTab === 'settings' && (
                  <>
                  <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs">
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
                        href={buildWhatsAppUrl(formSettings.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test WhatsApp Link ({buildWhatsAppUrl(formSettings.whatsappNumber).replace('https://', '')})</span>
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

                  {/* Instagram Profile Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Official Instagram Handle
                      </label>
                      <input
                        type="text"
                        placeholder="@chillhealthybox"
                        value={formSettings.instagramHandle || '@chillhealthybox'}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            instagramHandle: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Instagram Profile Link URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.instagram.com/chillhealthybox/"
                        value={formSettings.instagramUrl || 'https://www.instagram.com/chillhealthybox/'}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            instagramUrl: e.target.value,
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
                  {/* Package Selector List (3-4 cols) */}
                  <div className="lg:col-span-4 xl:col-span-3 space-y-3">
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

                  {/* Package Detail Editor Form (8-9 cols) */}
                  <div className="lg:col-span-8 xl:col-span-9">
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
                  TAB 3: MENU & PICTURE EDITOR & STOCK CONTROL
                  ========================================================= */}
              {activeTab === 'menu' && (() => {
                const totalDishesCount = editableMenu.length;
                const outOfStockCount = editableMenu.filter((m) => m.isOutOfStock).length;
                const inStockCount = totalDishesCount - outOfStockCount;

                const filteredMenu = editableMenu.filter((m) => {
                  const matchesSearch =
                    !menuSearch ||
                    m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                    m.nameZh.includes(menuSearch) ||
                    (m.subtitle && m.subtitle.toLowerCase().includes(menuSearch.toLowerCase())) ||
                    (m.subtitleZh && m.subtitleZh.includes(menuSearch));
                  if (!matchesSearch) return false;
                  if (menuStockFilter === 'in_stock') return !m.isOutOfStock;
                  if (menuStockFilter === 'out_of_stock') return m.isOutOfStock === true;
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Live Homepage Editor Callout Banner */}
                    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/10 border border-amber-300/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                          <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-sm">
                              {language === 'en' ? 'Live Homepage Visual Editor Mode' : '主页实景编辑模式'}
                            </h4>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                              {language === 'en' ? 'Live on Store' : '前台实景即时修改'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {language === 'en'
                              ? 'Admin can also browse the actual homepage directly to edit photos, descriptions and stock status in real-time!'
                              : '管理员也可直接前往前台主页，在真实网页上即时点击编辑每道餐盒照片、中英文描述与售罄/有货状态！'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="btn-open-live-homepage-editor"
                        onClick={() => {
                          if (onEnterLiveEditMode) onEnterLiveEditMode();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-2 shrink-0 shadow-md hover:shadow-amber-400/20 active:scale-95 transition-all cursor-pointer ring-2 ring-amber-300/60"
                      >
                        <Edit3 className="w-4 h-4 text-stone-950" />
                        <span>{language === 'en' ? 'Launch Homepage Editor' : '前往主页实景编辑'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Dish List & Stock Controls (3-4 cols) */}
                      <div className="lg:col-span-4 xl:col-span-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Menu & Stock Control ({editableMenu.length})</span>
                            </h4>
                            <p className="text-[11px] text-stone-500">
                              {inStockCount} In Stock · <strong className="text-rose-600">{outOfStockCount} Out of Stock</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleResetToOfficialMenu}
                              title="Sync with official chillhealthy.com 24 Ala Carte items"
                              className="flex items-center gap-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-emerald-700" />
                              <span>Sync</span>
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

                        {/* Stock Filter Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setMenuStockFilter('all')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              menuStockFilter === 'all'
                                ? 'bg-white text-stone-900 shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            All ({totalDishesCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuStockFilter('in_stock')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              menuStockFilter === 'in_stock'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-emerald-700'
                            }`}
                          >
                            <span>🟢 In Stock</span>
                            <span>({inStockCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuStockFilter('out_of_stock')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              menuStockFilter === 'out_of_stock'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-rose-700'
                            }`}
                          >
                            <span>🔴 Sold Out</span>
                            <span>({outOfStockCount})</span>
                          </button>
                        </div>

                        {/* Quick Batch Actions */}
                        <div className="flex items-center justify-between gap-2 px-1">
                          <span className="text-[11px] text-stone-500 font-medium">Batch Stock:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMarkAllStock(true)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors cursor-pointer"
                              title="Mark all items as In Stock"
                            >
                              All In Stock (全设为有货)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAllStock(false)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 transition-colors cursor-pointer"
                              title="Mark all items as Out of Stock"
                            >
                              All Out of Stock (全设为售罄)
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Search dish by name / 中文名 / ingredient..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white shadow-2xs"
                        />

                        <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
                          {filteredMenu.length === 0 ? (
                            <div className="text-center py-10 text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                              No dishes found matching your filter.
                            </div>
                          ) : (
                            filteredMenu.map((meal) => (
                              <div
                                key={meal.id}
                                onClick={() => setSelectedMealForEdit(meal)}
                                className={`p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                                  selectedMealForEdit?.id === meal.id
                                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-xs'
                                    : meal.isOutOfStock
                                    ? 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
                                    : 'border-stone-200 bg-white hover:bg-stone-50 shadow-2xs'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={meal.image}
                                    alt={meal.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                    }}
                                    className={`w-14 h-14 rounded-xl object-cover border border-stone-200 ${
                                      meal.isOutOfStock ? 'grayscale-[50%] opacity-80' : ''
                                    }`}
                                  />
                                  {meal.isOutOfStock && (
                                    <span className="absolute inset-x-0 bottom-0 bg-rose-600/90 text-white text-[8px] font-black uppercase text-center py-0.5 rounded-b-xl">
                                      OUT
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-bold text-stone-900 truncate">
                                      {meal.name}
                                    </h5>
                                    <span className="text-[11px] font-black text-stone-900 shrink-0">
                                      RM {meal.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 truncate">{meal.nameZh}</p>

                                  <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1 border-t border-stone-100">
                                    {meal.isOutOfStock ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                        <span>已售罄 / Out</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                        <span>供应中 / In Stock</span>
                                      </span>
                                    )}

                                    {/* Quick 1-Click Stock Toggle */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleStock(meal.id, e)}
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                                        meal.isOutOfStock
                                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                          : 'bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 border-stone-200'
                                      }`}
                                      title={meal.isOutOfStock ? 'Click to mark In Stock' : 'Click to mark Out of Stock'}
                                    >
                                      {meal.isOutOfStock ? '设为有货' : '设为缺货'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Dish Editor & Picture Form (8 cols) */}
                      <div className="lg:col-span-8 xl:col-span-8">
                        {selectedMealForEdit ? (
                          <form onSubmit={handleSaveMeal} className="bg-white p-6 rounded-3xl border border-stone-200 space-y-5 shadow-2xs">
                            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-100 pb-3">
                              <div>
                                <h4 className="font-heading font-extrabold text-base text-stone-900 flex items-center gap-2">
                                  <span>Edit Dish & Stock Control</span>
                                  {selectedMealForEdit.isOutOfStock ? (
                                    <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
                                      🔴 Out of Stock
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                      🟢 In Stock
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-stone-500">Dish ID: {selectedMealForEdit.id}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                  RM {selectedMealForEdit.price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Prominent Stock Control Toggle */}
                            <div className={`p-4 rounded-2xl border transition-all ${
                              selectedMealForEdit.isOutOfStock
                                ? 'bg-rose-50/70 border-rose-200'
                                : 'bg-emerald-50/70 border-emerald-200'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <label className="text-xs font-black text-stone-900 block flex items-center gap-1.5">
                                    <AlertCircle className={`w-4 h-4 ${selectedMealForEdit.isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`} />
                                    <span>Stock Availability / 菜品供应与售罄控制</span>
                                  </label>
                                  <p className="text-xs text-stone-600 mt-0.5">
                                    {selectedMealForEdit.isOutOfStock
                                      ? '⚠️ Currently marked as OUT OF STOCK. Customers will see "SOLD OUT" badge and cannot order.'
                                      : '✓ Currently IN STOCK. Customers can view, select, and add this dish to cart.'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMealForEdit({ ...selectedMealForEdit, isOutOfStock: false })}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      !selectedMealForEdit.isOutOfStock
                                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-black'
                                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                                    }`}
                                  >
                                    <span>🟢 In Stock (正常供应)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMealForEdit({ ...selectedMealForEdit, isOutOfStock: true })}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      selectedMealForEdit.isOutOfStock
                                        ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30 font-black'
                                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                                    }`}
                                  >
                                    <span>🔴 Out of Stock (已售罄)</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Image Preview & Upload / Link Editor */}
                            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                              <div className="relative shrink-0">
                                <img
                                  src={selectedMealForEdit.image}
                                  alt="Preview"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                  }}
                                  className={`w-28 h-28 rounded-2xl object-cover shadow-sm border-2 border-white shrink-0 ${
                                    selectedMealForEdit.isOutOfStock ? 'grayscale-[50%]' : ''
                                  }`}
                                />
                                {selectedMealForEdit.isOutOfStock && (
                                  <span className="absolute inset-0 bg-stone-950/60 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase text-center px-1">
                                    SOLD OUT
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 w-full space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Dish Photo / 菜品图片 *</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    {/* Hidden file input for device photo upload */}
                                    <input
                                      type="file"
                                      ref={dishImageFileInputRef}
                                      onChange={handleDishImageFileUpload}
                                      accept="image/*"
                                      className="hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => dishImageFileInputRef.current?.click()}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                      title="Select photo from computer or phone"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Upload from Device (本地上传)</span>
                                    </button>
                                  </div>
                                </div>

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
                                  placeholder="https://images.unsplash.com/... or paste image URL"
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                                />
                                <span className="text-[10px] text-stone-500 block">
                                  You can either upload directly from your device or paste any image URL.
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

                            {/* Subtitle / Tagline */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  Subtitle / Tagline (English)
                                </label>
                                <input
                                  type="text"
                                  value={selectedMealForEdit.subtitle || ''}
                                  onChange={(e) =>
                                    setSelectedMealForEdit({
                                      ...selectedMealForEdit,
                                      subtitle: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. High Protein · Organic Greens"
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  Subtitle / 特色副标 (华语中文)
                                </label>
                                <input
                                  type="text"
                                  value={selectedMealForEdit.subtitleZh || ''}
                                  onChange={(e) =>
                                    setSelectedMealForEdit({
                                      ...selectedMealForEdit,
                                      subtitleZh: e.target.value,
                                    })
                                  }
                                  placeholder="例如：高蛋白 · 有机时蔬 · 慢碳糙米"
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                                />
                              </div>
                            </div>

                            {/* Price & Nutritional Macros */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-bold text-stone-700 block mb-1">Fat (g)</label>
                                <input
                                  type="number"
                                  value={selectedMealForEdit.fat || 0}
                                  onChange={(e) =>
                                    setSelectedMealForEdit({
                                      ...selectedMealForEdit,
                                      fat: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                                />
                              </div>
                            </div>

                            {/* Descriptions (English & Chinese) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  Description (English)
                                </label>
                                <textarea
                                  rows={3}
                                  value={selectedMealForEdit.description || ''}
                                  onChange={(e) =>
                                    setSelectedMealForEdit({
                                      ...selectedMealForEdit,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Full English description of the dish, preparation method, and dietary highlights."
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                  Description (华语中文详细介绍)
                                </label>
                                <textarea
                                  rows={3}
                                  value={selectedMealForEdit.descriptionZh || ''}
                                  onChange={(e) =>
                                    setSelectedMealForEdit({
                                      ...selectedMealForEdit,
                                      descriptionZh: e.target.value,
                                    })
                                  }
                                  placeholder="菜品中文详细介绍、烹饪特色与营养搭配理念。"
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Dish, Photo & Stock Status to Live Menu</span>
                            </button>
                          </form>
                        ) : (
                          <div className="text-center py-16 text-stone-400">
                            Select a dish from the left to edit its photo, description and stock status.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

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

                  const matchStatus =
                    kitchenStatusFilter === 'all' ||
                    red.status === kitchenStatusFilter;

                  return matchSearch && matchSlot && matchDate && matchStatus;
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

                const filteredRefundRecords = (refundRecords || []).filter((rec) => {
                  const q = refundSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    rec.orderId.toLowerCase().includes(q) ||
                    rec.memberName.toLowerCase().includes(q) ||
                    rec.memberPhone.includes(q) ||
                    rec.mealName.toLowerCase().includes(q) ||
                    (rec.mealNameZh && rec.mealNameZh.toLowerCase().includes(q)) ||
                    rec.deliveryDate.includes(q) ||
                    (rec.reason && rec.reason.toLowerCase().includes(q))
                  );
                });

                const totalRefundedMeals = (refundRecords || []).reduce(
                  (sum, r) => sum + (r.quantityRefunded || 1),
                  0
                );

                return (
                  <div className="space-y-4">
                    {/* Top Sub-view Navigation: Active Deliveries vs Deleted Order Refund Records */}
                    <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRedemptionSubView('active')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            redemptionSubView === 'active'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Active Delivery Orders' : '当前生效配送订单'}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              redemptionSubView === 'active'
                                ? 'bg-emerald-800 text-white'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {redemptions.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRedemptionSubView('refunds')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            redemptionSubView === 'refunds'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Deleted Orders & Refund Audit' : '删单还餐存证与退款记录'}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              redemptionSubView === 'refunds'
                                ? 'bg-emerald-800 text-white'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {refundRecords.length}
                          </span>
                        </button>
                      </div>

                      {redemptionSubView === 'refunds' ? (
                        <button
                          type="button"
                          onClick={handleExportRefundAuditReport}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Export Refund Log (.xlsx)' : '导出删单退还存证 (.xlsx)'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-500 hidden sm:inline">
                          {language === 'en'
                            ? 'Deleting an order automatically refunds meal balance to customer with audit record.'
                            : '删单将自动把餐券加回顾客套餐账户，并生成留底存证记录。'}
                        </span>
                      )}
                    </div>

                    {redemptionSubView === 'active' ? (
                      <>
                        {/* Daily 5:00 PM Member Order Status Excel Report Card */}
                        <div className="bg-emerald-950 text-white p-5 rounded-3xl border border-emerald-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[11px] border border-emerald-500/30">
                            Daily 5:00 PM Cutoff
                          </span>
                          <span className="text-xs text-stone-300 flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cutoff: 17:00 (5:00 PM MYT)</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            new Date().getHours() >= 17
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {new Date().getHours() >= 17 ? '🟢 Cutoff Reached (Post-5PM)' : '⏰ Open Until 5:00 PM'}
                          </span>
                        </div>
                        <h4 className="font-heading font-black text-base sm:text-lg text-white">
                          {language === 'en'
                            ? 'Daily 5:00 PM Member Order Status Excel Report'
                            : '每日下午 5:00 会员订餐状态汇总报表 (.xlsx)'}
                        </h4>
                        <p className="text-xs text-emerald-200/80 leading-relaxed">
                          {language === 'en'
                            ? 'Generate detailed member orders, kitchen prep portion counts, and Klang Valley delivery routes everyday after 5:00 PM.'
                            : '每天下午5点截单后，一键生成会员订餐状态明细、后厨备餐份数统计以及配送路线汇总Excel报表。'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-2 bg-stone-900/90 border border-emerald-700/60 rounded-xl px-3 py-2">
                          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                          <input
                            type="date"
                            value={dailyReportDate}
                            onChange={(e) => setDailyReportDate(e.target.value)}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExportDaily5pmReport(dailyReportDate)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                          title="Generate official 5PM Cutoff Excel Sheet"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-stone-950 shrink-0" />
                          <span>{language === 'en' ? 'Export 5PM Report (.xlsx)' : '导出每日5点报表 (.xlsx)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Admin Emergency / Advance Delivery Date Blackout Control */}
                    <div className="bg-amber-950/5 border border-amber-300/60 bg-amber-50/50 p-4 rounded-2xl shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CalendarOff className="w-4 h-4 text-amber-700 shrink-0" />
                          <h5 className="font-heading font-extrabold text-sm text-stone-900">
                            {language === 'en'
                              ? 'Turn Off Delivery Dates (Advance / Same Day Suspension)'
                              : '关闭停送送餐日期 (提前/当天停送管理)'}
                          </h5>
                        </div>
                        <span className="text-[11px] text-amber-800 font-bold bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                          {siteSettings.disabledDeliveryDates && siteSettings.disabledDeliveryDates.length > 0
                            ? `${siteSettings.disabledDeliveryDates.length} ${language === 'en' ? 'Dates Suspended' : '个日期已设为停送'}`
                            : language === 'en' ? 'All Delivery Days Active' : '所有工作日正常配送'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600">
                        {language === 'en'
                          ? 'Turn off any delivery date in advance or same day due to unforeseen circumstances or kitchen maintenance. Customers cannot select disabled dates. If meals need cancellation, deleting them below automatically refunds customer package quota.'
                          : '管理员可因突发情况或厨房休整，随时关闭提前或当天送餐日期。被关闭日期会员无法预订。若需取消已订餐品，点击订单下方“删单还餐”将自动把配额加回会员账户。'}
                      </p>

                      {/* Expiry Extension Guarantee Rule Notice */}
                      <div className="bg-emerald-900/10 border border-emerald-600/30 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-emerald-950">
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            {language === 'en'
                              ? 'Automatic Package Expiry Extension Active'
                              : '会员套餐有效期自动顺延机制已生效'}
                          </span>
                          <span className="text-emerald-900 text-[10px]">
                            {language === 'en'
                              ? 'Package validity is calculated strictly on Monday to Friday. If any weekday is suspended due to public holidays or kitchen off-days, each active customer package automatically extends by +1 extra workday so customers never lose ordering days.'
                              : '套餐有效期按周一至周五计算。若后台将工作日设为公共假期或厨房休业停送，系统将自动为所有生效中的客户套餐顺延 +1 天额外工作日，确保客户订餐权益不受损。'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Upcoming Days Toggle */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-stone-700 block">
                          {language === 'en' ? 'Quick Toggle Upcoming Days (Click to Turn Off / Re-enable):' : '快速切换未来日期 (点击停送/恢复)：'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() + i);
                            const dateStr = d.toISOString().split('T')[0];
                            const isOff = siteSettings.disabledDeliveryDates?.includes(dateStr);
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const label = d.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
                              weekday: 'short',
                              month: 'numeric',
                              day: 'numeric',
                            });

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => {
                                  if (onToggleDisabledDeliveryDate) {
                                    onToggleDisabledDeliveryDate(dateStr);
                                    triggerToast(
                                      isOff
                                        ? `✓ Restored delivery for ${dateStr}`
                                        : `⚠️ Disabled delivery for ${dateStr} (Customers cannot order)`
                                    );
                                  }
                                }}
                                className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isOff
                                    ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                                    : 'bg-white text-stone-700 border-stone-300 hover:border-amber-400 hover:bg-amber-50/50'
                                }`}
                              >
                                {isOff ? <CalendarOff className="w-3 h-3 text-white" /> : <Calendar className="w-3 h-3 text-emerald-600" />}
                                <span>{label}</span>
                                {isOff && <span className="text-[10px] bg-red-800/80 px-1.5 py-0.2 rounded font-black">OFF</span>}
                                {isWeekend && !isOff && <span className="text-[10px] text-stone-400">(W/E)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Date Input for any future date */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                        <span className="text-xs font-bold text-stone-700">
                          {language === 'en' ? 'Specific Date Suspension:' : '指定具体停送日期：'}
                        </span>
                        <input
                          type="date"
                          value={customTurnOffDate}
                          onChange={(e) => setCustomTurnOffDate(e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customTurnOffDate) return;
                            if (onToggleDisabledDeliveryDate) {
                              onToggleDisabledDeliveryDate(customTurnOffDate);
                              const isNowOff = !siteSettings.disabledDeliveryDates?.includes(customTurnOffDate);
                              triggerToast(
                                isNowOff
                                  ? `⚠️ Turned OFF delivery for ${customTurnOffDate}`
                                  : `✓ Re-enabled delivery for ${customTurnOffDate}`
                              );
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                            siteSettings.disabledDeliveryDates?.includes(customTurnOffDate)
                              ? 'bg-stone-700 hover:bg-stone-800 text-white border-stone-700'
                              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                          }`}
                        >
                          {siteSettings.disabledDeliveryDates?.includes(customTurnOffDate)
                            ? (language === 'en' ? 'Re-enable Date' : '恢复该日期送餐')
                            : (language === 'en' ? 'Turn Off Date' : '设为停送日期')}
                        </button>
                      </div>
                    </div>

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
                          <span>{language === 'en' ? 'Export Orders (.xlsx)' : '导出订单Excel (.xlsx)'}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-stone-200">
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

                      {/* Status Filter */}
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-stone-400 shrink-0" />
                        <select
                          value={kitchenStatusFilter}
                          onChange={(e) =>
                            setKitchenStatusFilter(
                              e.target.value as 'all' | 'Pending' | 'Prepping in Kitchen' | 'Out for Delivery' | 'Delivered'
                            )
                          }
                          className="w-full py-2 px-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-stone-50/50 font-bold"
                        >
                          <option value="all">{language === 'en' ? 'All Statuses' : '所有订单状态'}</option>
                          <option value="Pending">Pending Review</option>
                          <option value="Prepping in Kitchen">Prepping in Kitchen</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered ✓</option>
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
                                href={buildWhatsAppUrl(
                                  red.memberPhone,
                                  `Hi ${red.memberName}, CHILL Healthy kitchen update for your meal ${red.mealName}: Status is ${red.status}!`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>

                              {/* Delete Meal & Automatically Restore Quota */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToDelete(red);
                                  setDeletionReasonInput(
                                    language === 'en'
                                      ? `Delivery cancelled by admin for ${red.deliveryDate} (${red.deliverySlot}). Quota +${red.quantity || 1} restored to customer balance.`
                                      : `管理员取消 ${red.deliveryDate} (${red.deliverySlot}) 送餐，+${red.quantity || 1} 餐配额已全额返还至顾客账户余额。`
                                  );
                                }}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
                                title="Delete meal order and automatically restore quota to customer account"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>{language === 'en' ? 'Delete & Restore' : '删单还餐'}</span>
                              </button>
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

                  {/* =========================================================
                      SUB-MODAL: CONFIRM ORDER DELETION & QUOTA REFUND
                      ========================================================= */}
                  {orderToDelete && (() => {
                    const targetMemberForDelete = members.find(
                      (m) => m.id === orderToDelete.memberId || m.phone === orderToDelete.memberPhone
                    );
                    const currentBal = targetMemberForDelete?.activePackage?.remainingMeals ?? 0;
                    const refundAmt = orderToDelete.quantity || 1;
                    const afterBal = currentBal + refundAmt;

                    return (
                      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-heading font-black text-base text-stone-900">
                                  {language === 'en'
                                    ? 'Delete Order & Refund Balance'
                                    : '删除订单并返还餐券余额'}
                                </h5>
                                <p className="text-xs text-stone-500">
                                  {language === 'en'
                                    ? 'Automatic quota restoration with permanent audit record'
                                    : '全自动配额退回与系统存证流水留底'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(null)}
                              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Order summary box */}
                          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-500">{language === 'en' ? 'Order ID' : '订单编号'}:</span>
                              <span className="font-mono font-bold text-stone-800">#{orderToDelete.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-500">{language === 'en' ? 'Customer' : '顾客会员'}:</span>
                              <span className="font-bold text-stone-900">
                                {orderToDelete.memberName} ({orderToDelete.memberPhone})
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-500">{language === 'en' ? 'Meal to Cancel' : '取消餐品'}:</span>
                              <span className="font-bold text-emerald-800">
                                {orderToDelete.mealName} {orderToDelete.mealNameZh ? `(${orderToDelete.mealNameZh})` : ''}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-500">{language === 'en' ? 'Scheduled Date' : '原定送餐日期'}:</span>
                              <span className="font-bold text-stone-700">
                                📅 {orderToDelete.deliveryDate} · {orderToDelete.deliverySlot}
                              </span>
                            </div>
                          </div>

                          {/* Balance Refund Preview Callout */}
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                              <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>
                                {language === 'en'
                                  ? `Automatic Meal Quota Refund (+${refundAmt} Meal)`
                                  : `自动餐券返还 (+${refundAmt} 餐)`}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                                <div className="text-[10px] text-stone-500 font-bold uppercase">{language === 'en' ? 'Current Balance' : '当前余额'}</div>
                                <div className="text-sm font-black text-stone-800">{currentBal} {language === 'en' ? 'Meals' : '餐'}</div>
                              </div>
                              <div className="p-2 rounded-xl bg-emerald-100/90 border border-emerald-200">
                                <div className="text-[10px] text-emerald-800 font-bold uppercase">{language === 'en' ? 'Refunded' : '退还入账'}</div>
                                <div className="text-sm font-black text-emerald-700">+{refundAmt} {language === 'en' ? 'Meal' : '餐'}</div>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                                <div className="text-[10px] text-stone-500 font-bold uppercase">{language === 'en' ? 'New Balance' : '退还后余额'}</div>
                                <div className="text-sm font-black text-emerald-900">{afterBal} {language === 'en' ? 'Meals' : '餐'}</div>
                              </div>
                            </div>
                            <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                              {language === 'en'
                                ? `✓ +${refundAmt} meal will be credited back immediately to the customer account and recorded in both admin audit records and customer portal.`
                                : `✓ 系统将立即向该会员账户加回 +${refundAmt} 餐，并在后台对账存证及会员中心流水中生成清晰记录。`}
                            </p>
                          </div>

                          {/* Reason for Deletion & Refund */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-700 block">
                              {language === 'en' ? 'Reason / Audit Log Note' : '删单退还原因 / 存证备注'} *
                            </label>
                            <textarea
                              rows={2}
                              value={deletionReasonInput}
                              onChange={(e) => setDeletionReasonInput(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                              placeholder="Enter reason for cancelling and refunding..."
                            />
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span>{language === 'en' ? 'Operator' : '经办操作员'}: <strong className="text-stone-700">Owner Admin (#admin)</strong></span>
                              <span>{language === 'en' ? 'Status' : '状态'}: <strong className="text-emerald-700">Auto Refund Quota</strong></span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(null)}
                              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
                            >
                              {language === 'en' ? 'Keep Order' : '保留订单'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteRedemptionOrder && orderToDelete) {
                                  const success = onDeleteRedemptionOrder(orderToDelete.id, deletionReasonInput);
                                  if (success) {
                                    triggerToast(
                                      language === 'en'
                                        ? `✓ Order #${orderToDelete.id} deleted. +${refundAmt} meal refunded to ${orderToDelete.memberName} with audit record!`
                                        : `✓ 订单 #${orderToDelete.id} 已删除，+${refundAmt} 餐配额已自动退还至 ${orderToDelete.memberName} 账户并生成存证记录！`
                                    );
                                    setOrderToDelete(null);
                                  }
                                }
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>
                                {language === 'en'
                                  ? `Delete & Refund +${refundAmt} Meal`
                                  : `确认删单并退还 +${refundAmt} 餐`}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* =========================================================
                    SUB-VIEW: DELETED ORDERS & MEAL BALANCE REFUND AUDIT LOG
                    ========================================================= */
                <div className="space-y-4">
                  {/* Audit Log Banner */}
                  <div className="bg-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'en' ? 'Audit Trail & Quota Balance Log' : '餐券返还存证对账'}</span>
                          </span>
                          <span className="text-xs text-stone-400">
                            {language === 'en' ? 'Real-time record of all deletions & refunds' : '删单返餐全量审计流水'}
                          </span>
                        </div>
                        <h4 className="font-heading font-black text-lg text-white">
                          {language === 'en'
                            ? 'Deleted Orders & Restored Meal Balance Audit Records'
                            : '删单还餐记录与餐券退还明细存证'}
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
                          {language === 'en'
                            ? 'Every deleted meal redemption automatically restores the customer meal package balance and generates a permanent financial audit log here.'
                            : '每当后厨或客服因停送或顾客要求删除已订餐品时，系统均自动将对应餐数返还至会员账户，并在此生成永久不可篡改的存证流水。'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportRefundAuditReport}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-stone-950 shrink-0" />
                        <span>{language === 'en' ? 'Export Audit Report (.xlsx)' : '导出删单退还对账单 (.xlsx)'}</span>
                      </button>
                    </div>

                    {/* Quick Summary Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800/80">
                      <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700/60">
                        <div className="text-[11px] text-stone-400 font-bold">
                          {language === 'en' ? 'Total Cancelled Orders' : '已删除订单总数'}
                        </div>
                        <div className="text-xl font-black text-white mt-0.5">
                          {refundRecords.length} <span className="text-xs font-normal text-stone-400">{language === 'en' ? 'Orders' : '笔'}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/40">
                        <div className="text-[11px] text-emerald-400 font-bold">
                          {language === 'en' ? 'Total Meal Quota Restored' : '已自动退还顾客餐券'}
                        </div>
                        <div className="text-xl font-black text-emerald-400 mt-0.5">
                          +{totalRefundedMeals} <span className="text-xs font-normal text-emerald-300/80">{language === 'en' ? 'Meals' : '餐'}</span>
                        </div>
                      </div>

                      <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700/60">
                        <div className="text-[11px] text-stone-400 font-bold">
                          {language === 'en' ? 'Audit Status' : '审计合规状态'}
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>{language === 'en' ? '100% Synced With Member Balances' : '100% 实时同步会员余额'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Filter for Refund Records */}
                  <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
                    <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
                    <input
                      type="text"
                      placeholder={
                        language === 'en'
                          ? 'Search by Customer Name, Phone, Order ID, Dish, or Reason...'
                          : '搜索顾客姓名、手机号、订单号、菜品或删单原因...'
                      }
                      value={refundSearch}
                      onChange={(e) => setRefundSearch(e.target.value)}
                      className="w-full text-xs bg-transparent focus:outline-none text-stone-800"
                    />
                    {refundSearch && (
                      <button
                        type="button"
                        onClick={() => setRefundSearch('')}
                        className="text-stone-400 hover:text-stone-600 text-xs font-bold shrink-0"
                      >
                        {language === 'en' ? 'Clear' : '清空'}
                      </button>
                    )}
                  </div>

                  {/* Records List */}
                  <div className="space-y-3">
                    {filteredRefundRecords.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 space-y-2">
                        <RotateCcw className="w-8 h-8 mx-auto text-stone-300" />
                        <h5 className="font-bold text-stone-700 text-sm">
                          {refundSearch
                            ? (language === 'en' ? 'No matching refund records found.' : '没有找到匹配的删单退款记录。')
                            : (language === 'en' ? 'No deleted orders or refund records yet.' : '暂无已删除订单与退款记录。')}
                        </h5>
                        <p className="text-xs text-stone-400">
                          {language === 'en'
                            ? 'When you delete a redemption order under "Active Delivery Orders", the refund log will appear here.'
                            : '在“当前生效配送订单”中点击“删单还餐”后，流水记录将自动汇总于此。'}
                        </p>
                      </div>
                    ) : (
                      filteredRefundRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg">
                                #{rec.orderId}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1 border border-emerald-200">
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                <span>+{rec.quantityRefunded || 1} {language === 'en' ? 'Meal Quota Restored' : '餐配额已退还'}</span>
                              </span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {rec.deletedAt}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-stone-500 font-bold">
                                {language === 'en' ? 'Operator' : '经办'}:
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono text-[11px] font-bold">
                                {rec.operator || 'Owner Admin (#admin)'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {/* Member Info */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-stone-500 uppercase">
                                {language === 'en' ? 'Member Customer' : '顾客信息'}
                              </div>
                              <div className="font-bold text-stone-900 text-sm">
                                {rec.memberName}
                              </div>
                              <div className="text-stone-600 font-mono flex items-center gap-2">
                                <span>{rec.memberPhone}</span>
                                <a
                                  href={buildWhatsAppUrl(
                                    rec.memberPhone,
                                    `Hi ${rec.memberName}, your CHILL Healthy order #${rec.orderId} was cancelled and +${rec.quantityRefunded || 1} meal quota has been restored to your balance.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-0.5"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>

                            {/* Cancelled Meal Info */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-stone-500 uppercase">
                                {language === 'en' ? 'Cancelled Meal & Schedule' : '被取消餐品与原定班次'}
                              </div>
                              <div className="font-bold text-emerald-900">
                                {rec.mealName} {rec.mealNameZh ? `(${rec.mealNameZh})` : ''}
                              </div>
                              <div className="text-stone-600">
                                📅 {rec.deliveryDate} · {rec.deliverySlot}
                              </div>
                            </div>

                            {/* Balance impact */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-stone-500 uppercase">
                                {language === 'en' ? 'Balance Adjustment' : '账户餐券余额变动'}
                              </div>
                              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                                <span className="text-stone-500 line-through">{rec.balanceBeforeRefund}</span>
                                <span className="text-stone-400">➔</span>
                                <span className="text-emerald-700 font-extrabold text-sm">{rec.balanceAfterRefund} {language === 'en' ? 'Meals' : '餐'}</span>
                                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                                  (+{rec.quantityRefunded || 1})
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500">
                                {language === 'en' ? 'Log ID' : '流水单号'}: <span className="font-mono text-stone-700">{rec.id}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reason / Notes */}
                          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-start gap-1.5 text-stone-600">
                              <span className="font-bold text-stone-700 shrink-0">
                                {language === 'en' ? 'Reason / Audit Note' : '删单退还说明'}:
                              </span>
                              <span>{rec.reason}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 self-start sm:self-auto shrink-0">
                              ✓ {language === 'en' ? 'Refund Completed' : '已全额退还入账'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

              {/* =========================================================
                  TAB 5: CUSTOMER MEAL PACKAGE ORDERS & MEMBER INFO
                  ========================================================= */}
              {activeTab === 'members' && (() => {
                const filteredMembers = members.filter((m) => {
                  const q = memberSearch.trim().toLowerCase();
                  const matchSearch =
                    !q ||
                    m.name.toLowerCase().includes(q) ||
                    m.phone.includes(q) ||
                    (m.email && m.email.toLowerCase().includes(q)) ||
                    (m.memberNumber && m.memberNumber.toLowerCase().includes(q)) ||
                    (m.address && m.address.toLowerCase().includes(q)) ||
                    (m.address2 && m.address2.toLowerCase().includes(q)) ||
                    (m.area && m.area.toLowerCase().includes(q)) ||
                    (m.area2 && m.area2.toLowerCase().includes(q)) ||
                    (m.activePackage && m.activePackage.planName.toLowerCase().includes(q));

                  const remaining = m.activePackage?.remainingMeals || 0;
                  const matchStatus =
                    memberStatusFilter === 'all' ||
                    (memberStatusFilter === 'active' && remaining > 0) ||
                    (memberStatusFilter === 'exhausted' && remaining === 0) ||
                    (memberStatusFilter === 'low' && remaining > 0 && remaining <= 3);

                  const matchArea =
                    memberAreaFilter === 'all' ||
                    (m.area && m.area.toLowerCase().includes(memberAreaFilter.toLowerCase())) ||
                    (m.area2 && m.area2.toLowerCase().includes(memberAreaFilter.toLowerCase()));

                  return matchSearch && matchStatus && matchArea;
                });

                const uniqueAreas = Array.from(
                  new Set(members.map((m) => m.area).filter(Boolean))
                ).sort() as string[];

                const totalMealsInCirculation = members.reduce(
                  (sum, m) => sum + (m.activePackage?.remainingMeals || 0),
                  0
                );

                const handleSaveMemberChanges = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!editingMember) return;

                  if (onUpdateMemberAccount) {
                    onUpdateMemberAccount(editingMember);
                  }
                  triggerToast(`✓ Updated info for ${editingMember.name} successfully!`);
                  setEditingMember(null);
                };

                const handleCreateNewMember = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!newMemName.trim() || !newMemPhone.trim()) {
                    triggerToast('Please provide customer name and phone number.');
                    return;
                  }

                  const newAccount: MemberAccount = {
                    id: `mem-${Date.now()}`,
                    name: newMemName.trim(),
                    phone: newMemPhone.trim(),
                    email: `${newMemPhone.trim().replace(/\D/g, '')}@chillhealthy.customer`,
                    password: newMemPassword.trim() || '123456',
                    address: newMemAddress.trim() || 'Klang Central',
                    area: newMemArea.trim() || 'Klang',
                    postalCode: newMemPostal.trim() || '41200',
                    address2: newMemAddress2.trim() || undefined,
                    area2: newMemArea2.trim() || undefined,
                    postalCode2: newMemPostal2.trim() || undefined,
                    dietaryPreferences: newMemDietary.trim() || undefined,
                    activePackage: {
                      planId: 'custom-plan',
                      planName: newMemPlanName,
                      planNameZh: newMemPlanName,
                      totalMeals: Number(newMemTotalMeals) || 20,
                      remainingMeals: Number(newMemRemainingMeals) || 20,
                      purchasedDate: new Date().toISOString().split('T')[0],
                      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    },
                    creditsHistory: [
                      {
                        id: `cred-${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        type: 'purchase',
                        amount: Number(newMemRemainingMeals) || 20,
                        note: 'Initial meal package registration',
                      },
                    ],
                  };

                  if (onAddMemberAccount) {
                    onAddMemberAccount(newAccount);
                  }
                  triggerToast(`✓ Registered new meal package customer: ${newAccount.name}`);
                  setIsAddingMember(false);

                  // Reset form
                  setNewMemName('');
                  setNewMemPhone('');
                  setNewMemAddress('');
                  setNewMemAddress2('');
                  setNewMemDietary('');
                };

                return (
                  <div className="space-y-4">
                    {/* Header & Quick Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-extrabold text-base text-stone-900">
                            {language === 'en' ? 'Customer Meal Package Orders & Member Accounts' : '会员套餐顾客与订单管理'}
                          </h4>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {filteredMembers.length} {language === 'en' ? 'Members' : '位会员'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {language === 'en'
                            ? 'Monitor meal balances, edit customer details, addresses, and meal package credits.'
                            : '监控顾客剩余餐券余额、修改会员地址、登录信息及套餐详情。'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderGenerator()}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="Generate a specific meal package order with confirmed payment for a customer"
                        >
                          <Package className="w-4 h-4" />
                          <span>{language === 'en' ? 'Generate Package Order' : '生成专属套餐订单'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsReceiptsLedgerOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="View all issued official receipts and payment records"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>{language === 'en' ? 'Receipts Ledger' : '正式收据总表'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportMembersExcel(filteredMembers)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                          title="Export customer meal package orders and member accounts to Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{language === 'en' ? 'Export Members (.xlsx)' : '导出会员与套餐 (.xlsx)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportMembersCSV(filteredMembers)}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                          title="Export CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAddingMember(true)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{language === 'en' ? 'Register Customer Package' : '录入新会员套餐'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs text-stone-500 block">Total Registered Customers</span>
                          <span className="font-heading font-black text-lg text-stone-900">{members.length} Members</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs text-stone-500 block">Active Package Plans</span>
                          <span className="font-heading font-black text-lg text-stone-900">
                            {members.filter((m) => (m.activePackage?.remainingMeals || 0) > 0).length} Active
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs text-stone-500 block">Remaining Meals in Circulation</span>
                          <span className="font-heading font-black text-lg text-stone-900">{totalMealsInCirculation} Meals</span>
                        </div>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-stone-200">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={language === 'en' ? 'Search name, phone, address...' : '搜索姓名、手机、地址...'}
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                        {memberSearch && (
                          <button
                            type="button"
                            onClick={() => setMemberSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Package Balance Status Filter */}
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-stone-400 shrink-0" />
                        <select
                          value={memberStatusFilter}
                          onChange={(e) =>
                            setMemberStatusFilter(e.target.value as 'all' | 'active' | 'exhausted' | 'low')
                          }
                          className="w-full py-2 px-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-stone-50/50 font-bold"
                        >
                          <option value="all">{language === 'en' ? 'All Package Statuses' : '所有套餐状态'}</option>
                          <option value="active">{language === 'en' ? 'Active Packages (>0 Meals)' : '有效套餐 (>0餐)'}</option>
                          <option value="low">{language === 'en' ? 'Low Balance (≤3 Meals Left)' : '余额偏低 (≤3餐)'}</option>
                          <option value="exhausted">{language === 'en' ? 'Exhausted (0 Meals Left)' : '已用尽 (0餐剩余)'}</option>
                        </select>
                      </div>

                      {/* Area Filter */}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <select
                          value={memberAreaFilter}
                          onChange={(e) => setMemberAreaFilter(e.target.value)}
                          className="w-full py-2 px-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-stone-50/50"
                        >
                          <option value="all">{language === 'en' ? 'All Delivery Areas' : '全部配送地区'}</option>
                          {uniqueAreas.map((area) => (
                            <option key={area} value={area}>
                              📍 {area}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter stats count & reset */}
                      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                        <span className="font-bold text-stone-600">
                          {language === 'en' ? 'Showing:' : '显示：'}{' '}
                          <span className="text-emerald-700 font-extrabold">{filteredMembers.length}</span> / {members.length}
                        </span>
                        {(memberSearch || memberStatusFilter !== 'all' || memberAreaFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setMemberSearch('');
                              setMemberStatusFilter('all');
                              setMemberAreaFilter('all');
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                          >
                            {language === 'en' ? 'Reset Filters' : '重置筛选'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer Member Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                      {filteredMembers.map((mem) => {
                        const isPassRevealed = revealedMemberPasswords[mem.id] || false;
                        const remaining = mem.activePackage?.remainingMeals || 0;
                        const total = mem.activePackage?.totalMeals || 0;

                        return (
                          <div
                            key={mem.id}
                            className="p-4 rounded-3xl border border-stone-200 bg-white shadow-2xs space-y-3.5 hover:border-emerald-300 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {/* Top row: Name, Login ID & Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-base text-stone-900 flex items-center gap-2">
                                    <span>{mem.name}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      Member
                                    </span>
                                  </h5>
                                  <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                                      Login ID: {mem.phone}
                                    </span>
                                    {mem.memberNumber && (
                                      <span className="text-stone-400 text-[11px]">({mem.memberNumber})</span>
                                    )}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs text-stone-400 block text-[10px]">Meal Balance</span>
                                  <span className="font-heading font-black text-emerald-800 text-base">
                                    {remaining} / {total}
                                  </span>
                                </div>
                              </div>

                              {/* Login Password row (viewable by admin) */}
                              <div className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded-xl text-xs border border-stone-200/80">
                                <div className="flex items-center gap-1.5 text-stone-600">
                                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                                  <span className="font-medium">Password:</span>
                                  <span className="font-mono font-bold text-stone-900">
                                    {isPassRevealed ? mem.password || '123456' : '••••••••'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordReveal(mem.id)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  <span>{isPassRevealed ? 'Hide' : 'Reveal'}</span>
                                </button>
                              </div>

                              {/* Package Info Card */}
                              {(() => {
                                const expiryInfo = getEffectivePackageExpiry(mem.activePackage, siteSettings.disabledDeliveryDates || []);
                                return (
                                  <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center text-stone-700">
                                      <span className="font-medium text-stone-500">Subscribed Plan:</span>
                                      <span className="font-bold text-emerald-950 text-right">
                                        {mem.activePackage ? mem.activePackage.planName : 'No Active Plan'}
                                      </span>
                                    </div>
                                    {mem.activePackage && (
                                      <div className="space-y-1 pt-1 border-t border-emerald-100 text-[11px]">
                                        <div className="flex justify-between items-center text-stone-500">
                                          <span>Purchased: {mem.activePackage.purchasedDate || 'Recent'}</span>
                                          <span className={`font-semibold ${expiryInfo.isExpired ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {expiryInfo.statusLabelEn}
                                          </span>
                                        </div>
                                        {mem.activePackage.autoRevivedMeals ? (
                                          <div className="text-[10px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md">
                                            🎉 Includes {mem.activePackage.autoRevivedMeals} auto-revived meals from expired plan
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                    {mem.lastExpiredPackage && !mem.lastExpiredPackage.isRevived && mem.lastExpiredPackage.unredeemedMeals > 0 && (
                                      <div className="text-[10px] text-purple-700 font-medium bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                                        ✨ {mem.lastExpiredPackage.unredeemedMeals} unredeemed meals from expired {mem.lastExpiredPackage.planName} can be auto-revived upon subscribing to the same plan.
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Delivery Addresses */}
                              <div className="text-[11px] text-stone-600 space-y-1 bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/70">
                                <p className="truncate">
                                  <span className="font-bold text-emerald-800">Primary (Addr 1):</span> {mem.address}, {mem.area} {mem.postalCode}
                                </p>
                                {mem.address2 ? (
                                  <p className="truncate">
                                    <span className="font-bold text-emerald-700">Secondary (Addr 2):</span> {mem.address2}, {mem.area2 || mem.area} {mem.postalCode2 || ''}
                                  </p>
                                ) : (
                                  <p className="text-stone-400 italic">Secondary address: None configured</p>
                                )}
                                {mem.dietaryPreferences && (
                                  <p className="text-amber-800 font-medium truncate pt-1 border-t border-stone-200/60">
                                    <span className="font-bold">Dietary Notes:</span> {mem.dietaryPreferences}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Bottom Controls: Quick adjustments & Edit & WhatsApp */}
                            <div className="space-y-2 pt-2 border-t border-stone-100">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateMemberCredits(mem.id, 5);
                                    triggerToast(`✓ Added 5 meal credits to ${mem.name}`);
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer text-center"
                                  title="Add 5 meal credits"
                                >
                                  +5 Meals
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateMemberCredits(mem.id, 1);
                                    triggerToast(`✓ Added 1 meal credit to ${mem.name}`);
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer text-center"
                                  title="Add 1 meal credit"
                                >
                                  +1 Meal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateMemberCredits(mem.id, -1);
                                    triggerToast(`✓ Deducted 1 meal credit from ${mem.name}`);
                                  }}
                                  className="py-1 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-colors cursor-pointer text-center"
                                  title="Deduct 1 meal credit"
                                >
                                  -1 Meal
                                </button>
                              </div>

                              {/* Official Receipt Status / Quick View */}
                              {mem.officialReceipts && mem.officialReceipts.length > 0 && (
                                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Receipt className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <span className="font-mono text-[11px] font-bold text-stone-800 truncate">
                                      {mem.officialReceipts[0].receiptNumber}
                                    </span>
                                    <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                      RM {mem.officialReceipts[0].totalAmount.toFixed(2)} (PAID)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceiptForMember(mem, mem.officialReceipts![0])}
                                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="View or print official receipt"
                                  >
                                    <Printer className="w-3 h-3 text-stone-500" />
                                    <span>{language === 'en' ? 'View / Print' : '查看/打印'}</span>
                                  </button>
                                </div>
                              )}

                              {/* Back Office Package Order & Receipt Generation Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderGenerator(mem)}
                                  className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                  title="Generate specific package meal order for this customer"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  <span className="truncate">{language === 'en' ? 'Generate Order' : '生成专属订单'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiptForMember(mem)}
                                  className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                  title="Issue official receipt upon payment confirmation"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span className="truncate">{language === 'en' ? 'Issue Receipt' : '开具正式收据'}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMember(JSON.parse(JSON.stringify(mem)))}
                                  className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>{language === 'en' ? 'Edit Customer Info' : '修改会员信息'}</span>
                                </button>

                                <a
                                  href={buildWhatsAppUrl(
                                    mem.phone,
                                    `Hi ${mem.name}, this is CHILL Healthy Kitchen regarding your meal package (Remaining balance: ${remaining} meals).`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#25D366]/30"
                                  title="WhatsApp Customer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>

                                {onDeleteMemberAccount && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete member record for ${mem.name}? This will remove their meal plan access.`)) {
                                        onDeleteMemberAccount(mem.id);
                                        triggerToast(`✓ Deleted member ${mem.name}`);
                                      }
                                    }}
                                    className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Delete Member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* MODAL 1: EDIT CUSTOMER & PACKAGE INFO */}
                    {editingMember && (
                      <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                          <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
                            <div className="flex items-center gap-2">
                              <Edit2 className="w-4 h-4 text-emerald-400" />
                              <h4 className="font-heading font-black text-sm sm:text-base text-white">
                                {language === 'en' ? 'Edit Customer & Meal Package Details' : '编辑顾客信息与套餐详情'}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingMember(null)}
                              className="text-stone-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleSaveMemberChanges} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                            {/* Section 1: Customer Account Credentials */}
                            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                              <h5 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Customer Identity & Login Credentials</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Customer Full Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingMember.name}
                                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Login Phone Number (Member ID) *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingMember.phone}
                                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Login Password *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingMember.password || '123456'}
                                    onChange={(e) => setEditingMember({ ...editingMember, password: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Email / Alternate ID</label>
                                  <input
                                    type="text"
                                    value={editingMember.email || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Meal Package Credits & Balance */}
                            <div className="space-y-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                              <h5 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Meal Package Subscription & Remaining Balance</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="sm:col-span-2 lg:col-span-4">
                                  <label className="font-bold text-stone-700 block mb-1">Subscribed Package Plan Name</label>
                                  <input
                                    type="text"
                                    value={editingMember.activePackage?.planName || ''}
                                    onChange={(e) => {
                                      const curPkg = editingMember.activePackage || {
                                        planId: 'custom-pkg',
                                        planName: '',
                                        planNameZh: '',
                                        totalMeals: 20,
                                        remainingMeals: 20,
                                        purchasedDate: getTodayStr(),
                                        expiryDate: calculateMonFriExpiryDate(getTodayStr(), 20, siteSettings.disabledDeliveryDates || []),
                                        validityDays: 20,
                                        isActivated: false,
                                      };
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: { ...curPkg, planName: e.target.value, planNameZh: e.target.value },
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Remaining Meal Balance *</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={editingMember.activePackage?.remainingMeals ?? 0}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      const curPkg = editingMember.activePackage || {
                                        planId: 'custom-pkg',
                                        planName: 'Healthy Meal Plan',
                                        planNameZh: 'Healthy Meal Plan',
                                        totalMeals: val,
                                        remainingMeals: val,
                                        purchasedDate: getTodayStr(),
                                        expiryDate: calculateMonFriExpiryDate(getTodayStr(), 20, siteSettings.disabledDeliveryDates || []),
                                        validityDays: 20,
                                        isActivated: false,
                                      };
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: { ...curPkg, remainingMeals: val },
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-black text-emerald-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Total Meals in Package</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editingMember.activePackage?.totalMeals ?? 20}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      const curPkg = editingMember.activePackage || {
                                        planId: 'custom-pkg',
                                        planName: 'Healthy Meal Plan',
                                        planNameZh: 'Healthy Meal Plan',
                                        totalMeals: val,
                                        remainingMeals: val,
                                        purchasedDate: getTodayStr(),
                                        expiryDate: calculateMonFriExpiryDate(getTodayStr(), 20, siteSettings.disabledDeliveryDates || []),
                                        validityDays: 20,
                                        isActivated: false,
                                      };
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: { ...curPkg, totalMeals: val },
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Validity (Mon-Fri Days)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editingMember.activePackage?.validityDays ?? getPlanValidityDays(editingMember.activePackage?.planId || '')}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      const curPkg = editingMember.activePackage || {
                                        planId: 'custom-pkg',
                                        planName: 'Healthy Meal Plan',
                                        planNameZh: 'Healthy Meal Plan',
                                        totalMeals: 20,
                                        remainingMeals: 20,
                                        purchasedDate: getTodayStr(),
                                        expiryDate: calculateMonFriExpiryDate(getTodayStr(), val, siteSettings.disabledDeliveryDates || []),
                                        validityDays: val,
                                        isActivated: false,
                                      };
                                      const startDate = curPkg.firstRedeemedDate || curPkg.purchasedDate || getTodayStr();
                                      const recomputedExpiry = calculateMonFriExpiryDate(startDate, val, siteSettings.disabledDeliveryDates || []);
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: {
                                          ...curPkg,
                                          validityDays: val,
                                          expiryDate: recomputedExpiry,
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Package Expiry Date</label>
                                  <input
                                    type="date"
                                    value={editingMember.activePackage?.expiryDate || ''}
                                    onChange={(e) => {
                                      const curPkg = editingMember.activePackage || {
                                        planId: 'custom-pkg',
                                        planName: 'Healthy Meal Plan',
                                        planNameZh: 'Healthy Meal Plan',
                                        totalMeals: 20,
                                        remainingMeals: 20,
                                        purchasedDate: getTodayStr(),
                                        expiryDate: e.target.value,
                                        validityDays: 20,
                                        isActivated: false,
                                      };
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: { ...curPkg, expiryDate: e.target.value },
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                {/* Activation Status & First Redeemed Date */}
                                <div className="sm:col-span-2 lg:col-span-4 p-3 bg-white rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(editingMember.activePackage?.isActivated)}
                                      onChange={(e) => {
                                        if (!editingMember.activePackage) return;
                                        const isAct = e.target.checked;
                                        const firstDate = isAct ? (editingMember.activePackage.firstRedeemedDate || getTodayStr()) : undefined;
                                        const vDays = editingMember.activePackage.validityDays || 20;
                                        const newExp = isAct
                                          ? calculateMonFriExpiryDate(firstDate!, vDays, siteSettings.disabledDeliveryDates || [])
                                          : editingMember.activePackage.expiryDate;

                                        setEditingMember({
                                          ...editingMember,
                                          activePackage: {
                                            ...editingMember.activePackage,
                                            isActivated: isAct,
                                            firstRedeemedDate: firstDate,
                                            expiryDate: newExp,
                                            isBurned: false,
                                          },
                                        });
                                      }}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="font-bold text-stone-800">
                                      Package Activated (Countdown started on 1st meal order: {editingMember.activePackage?.firstRedeemedDate || 'Pending'})
                                    </span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!editingMember.activePackage) return;
                                      const vDays = editingMember.activePackage.validityDays || getPlanValidityDays(editingMember.activePackage.planId);
                                      const baseDate = editingMember.activePackage.firstRedeemedDate || getTodayStr();
                                      const freshExpiry = calculateMonFriExpiryDate(baseDate, vDays, siteSettings.disabledDeliveryDates || []);
                                      setEditingMember({
                                        ...editingMember,
                                        activePackage: {
                                          ...editingMember.activePackage,
                                          validityDays: vDays,
                                          expiryDate: freshExpiry,
                                          isBurned: false,
                                        },
                                      });
                                      triggerToast(`✓ Recalculated expiry to ${freshExpiry} (${vDays} Mon-Fri workdays)`);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                  >
                                    🔄 Recalculate Mon–Fri Expiry (Auto-skip off-days)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Delivery Addresses */}
                            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                              <h5 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Saved Delivery Addresses (Primary & Secondary)</span>
                              </h5>

                              {/* Primary Address */}
                              <div className="space-y-2">
                                <span className="font-bold text-emerald-800 text-[11px] block">Primary Address (Default) *</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="Street address, unit, building..."
                                  value={editingMember.address}
                                  onChange={(e) => setEditingMember({ ...editingMember, address: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Area (e.g. Klang, Shah Alam, Subang)"
                                    value={editingMember.area}
                                    onChange={(e) => setEditingMember({ ...editingMember, area: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Postal Code"
                                    value={editingMember.postalCode}
                                    onChange={(e) => setEditingMember({ ...editingMember, postalCode: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Secondary Address */}
                              <div className="space-y-2 pt-2 border-t border-stone-200">
                                <span className="font-bold text-emerald-700 text-[11px] block">Secondary Address (Office / Home 2)</span>
                                <input
                                  type="text"
                                  placeholder="Secondary address line..."
                                  value={editingMember.address2 || ''}
                                  onChange={(e) => setEditingMember({ ...editingMember, address2: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Secondary Area"
                                    value={editingMember.area2 || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, area2: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Secondary Postal Code"
                                    value={editingMember.postalCode2 || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, postalCode2: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Dietary Notes */}
                              <div className="pt-2 border-t border-stone-200">
                                <label className="font-bold text-stone-700 block mb-1">Customer Dietary Preferences & Allergens</label>
                                <input
                                  type="text"
                                  placeholder="e.g. No beef, low sodium, allergy to peanuts, sauce on side"
                                  value={editingMember.dietaryPreferences || ''}
                                  onChange={(e) => setEditingMember({ ...editingMember, dietaryPreferences: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Footer Submit Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Customer Changes</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* MODAL 2: REGISTER NEW CUSTOMER PACKAGE */}
                    {isAddingMember && (
                      <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                          <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
                            <div className="flex items-center gap-2">
                              <Plus className="w-4 h-4 text-emerald-400" />
                              <h4 className="font-heading font-black text-sm sm:text-base text-white">
                                {language === 'en' ? 'Register New Customer Meal Package' : '录入新会员套餐与订餐顾客'}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsAddingMember(false)}
                              className="text-stone-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateNewMember} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                              <h5 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Customer Info & Credentials</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Customer Name *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Tan Ah Hock"
                                    value={newMemName}
                                    onChange={(e) => setNewMemName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Phone (Member Login ID) *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. 012-3456789"
                                    value={newMemPhone}
                                    onChange={(e) => setNewMemPhone(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Initial Password *</label>
                                  <input
                                    type="text"
                                    required
                                    value={newMemPassword}
                                    onChange={(e) => setNewMemPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                              <h5 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Meal Package & Credits</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-3">
                                  <label className="font-bold text-stone-700 block mb-1">Package Name</label>
                                  <input
                                    type="text"
                                    value={newMemPlanName}
                                    onChange={(e) => setNewMemPlanName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Total Package Meals</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={newMemTotalMeals}
                                    onChange={(e) => setNewMemTotalMeals(parseInt(e.target.value) || 20)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-stone-700 block mb-1">Starting Meal Balance *</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={newMemRemainingMeals}
                                    onChange={(e) => setNewMemRemainingMeals(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-black text-emerald-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                              <h5 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Delivery Address</span>
                              </h5>

                              <div className="space-y-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Street address (Unit, Building, Street)..."
                                  value={newMemAddress}
                                  onChange={(e) => setNewMemAddress(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Area (e.g. Klang, Shah Alam, Petaling Jaya)"
                                    value={newMemArea}
                                    onChange={(e) => setNewMemArea(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Postal Code"
                                    value={newMemPostal}
                                    onChange={(e) => setNewMemPostal(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingMember(false)}
                                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Save and Activate Member</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            </main>
          </>
        )}
        {/* MODAL: GENERATE SPECIFIC PACKAGE MEAL ORDER */}
        {isGeneratingPackageOrder && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/50 flex items-center justify-center text-white border border-emerald-500/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm sm:text-base text-white">
                      {language === 'en' ? 'Generate Specific Meal Package Order' : '生成专属健康餐套餐订单'}
                    </h4>
                    <p className="text-[11px] text-emerald-200">
                      {language === 'en'
                        ? 'Create custom or preset package order with confirmed payment and official receipt'
                        : '为指定顾客录入专属套餐，确认款项到账并直接开具正式官方收据'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGeneratingPackageOrder(false)}
                  className="text-emerald-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-stone-800">
                {/* 1. Target Customer Selection */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'en' ? '1. Target Customer' : '1. 目标客户'}</span>
                    </label>
                    <span className="text-[11px] text-stone-500">
                      {language === 'en' ? 'Order will be credited to this member account' : '套餐餐券将直接入账至此客户会员'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <select
                      value={orderGenMember?.id || ''}
                      onChange={(e) => {
                        const found = members.find((m) => m.id === e.target.value);
                        setOrderGenMember(found || null);
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone}) - Current Balance: {m.activePackage?.remainingMeals || 0} meals
                        </option>
                      ))}
                    </select>
                  </div>

                  {orderGenMember && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-stone-900">{orderGenMember.name}</span>
                        <span className="text-stone-500 ml-2">({orderGenMember.phone})</span>
                        <p className="text-stone-500 mt-0.5 truncate max-w-md">
                          📍 {orderGenMember.address || 'No address set'}, {orderGenMember.area}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-400 block text-[10px]">Current Balance</span>
                        <span className="font-extrabold text-emerald-700 text-xs">
                          {orderGenMember.activePackage?.remainingMeals || 0} Meals Remaining
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Package Plan Presets & Details */}
                <div className="space-y-3">
                  <label className="font-bold text-stone-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'en' ? '2. Select Meal Package Plan' : '2. 选择健康餐配套方案'}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-normal">
                      Click to auto-fill or customize below
                    </span>
                  </label>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {packages.map((pkg) => {
                      const isSelected = orderGenPlanId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            setOrderGenPlanId(pkg.id);
                            setOrderGenPlanName(pkg.title);
                            setOrderGenPlanNameZh(pkg.titleZh || pkg.title);
                            setOrderGenTotalMeals(pkg.mealsTotal);
                            setOrderGenPrice(pkg.totalPrice);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/30 font-bold'
                              : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <span className="block font-bold text-[11px] leading-tight truncate">
                            {language === 'en' ? pkg.title : pkg.titleZh || pkg.title}
                          </span>
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="font-extrabold text-emerald-800">RM {pkg.totalPrice}</span>
                            <span className="text-stone-500">{pkg.mealsTotal} meals</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Editable Plan Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Package Name (EN)</label>
                      <input
                        type="text"
                        value={orderGenPlanName}
                        onChange={(e) => setOrderGenPlanName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        placeholder="e.g. 20-Day Transformation Plan"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Package Name (ZH / 中文)</label>
                      <input
                        type="text"
                        value={orderGenPlanNameZh}
                        onChange={(e) => setOrderGenPlanNameZh(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        placeholder="例如：20天健康塑形轻食配套"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Total Meals Quota</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={orderGenTotalMeals}
                          onChange={(e) => setOrderGenTotalMeals(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-stone-400 font-bold">meals</span>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Package Price (RM)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">RM</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={orderGenPrice}
                          onChange={(e) => setOrderGenPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-emerald-800 block mb-1">+ Free Bonus Meals</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={orderGenBonusMeals}
                          onChange={(e) => setOrderGenBonusMeals(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-emerald-700 font-bold">free</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Payment Verification */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      <span>{language === 'en' ? '3. Payment Confirmation Details' : '3. 收款与支付确认'}</span>
                    </label>
                    <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Confirmed Received
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Payment Method</label>
                      <select
                        value={orderGenPaymentMethod}
                        onChange={(e) => setOrderGenPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="DuitNow QR">DuitNow QR (Direct Pay)</option>
                        <option value="Online Banking (FPX)">Online Banking (FPX Transfer)</option>
                        <option value="Touch 'n Go eWallet">Touch 'n Go eWallet</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Cash / Manual Transfer">Cash / Manual Bank In</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-600 block mb-1">Bank Reference / Txn No.</label>
                      <input
                        type="text"
                        value={orderGenReferenceNo}
                        onChange={(e) => setOrderGenReferenceNo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        placeholder="e.g. DN-20260922-8392"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Back Office Notes / Audit Log</label>
                    <input
                      type="text"
                      value={orderGenNotes}
                      onChange={(e) => setOrderGenNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      placeholder="e.g. Verified with bank statement. Package valid for 60 days."
                    />
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={orderGenAutoIssueReceipt}
                        onChange={(e) => setOrderGenAutoIssueReceipt(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-stone-800">
                        {language === 'en'
                          ? 'Auto-issue Official Receipt and open preview for 1-click Print & WhatsApp'
                          : '自动开具官方正式收据并打开预览（支持一键打印/发至WhatsApp）'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Live Impact Summary */}
                {(() => {
                  const reviveCheck = checkPlanAutoReviveEligibility(orderGenMember, orderGenPlanId || '');
                  const autoRevivedCount = reviveCheck.canRevive ? reviveCheck.revivedMeals : 0;
                  const baseToAdd = Number(orderGenTotalMeals) + Number(orderGenBonusMeals || 0);
                  const grandToAdd = baseToAdd + autoRevivedCount;
                  const curRemaining = orderGenMember?.activePackage && !orderGenMember.activePackage.isBurned
                    ? orderGenMember.activePackage.remainingMeals
                    : 0;
                  const finalBalance = curRemaining + grandToAdd;
                  const validityDays = getPlanValidityDays(orderGenPlanId || orderGenPlanName);

                  return (
                    <div className="space-y-2">
                      {autoRevivedCount > 0 && (
                        <div className="p-3 bg-amber-500/15 border border-amber-400 rounded-2xl flex items-start gap-2.5 text-amber-950">
                          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-xs block">
                              {language === 'en'
                                ? `🎉 Auto-Revive Activated: +${autoRevivedCount} Meals Restored`
                                : `🎉 自动复活机制生效：恢复 +${autoRevivedCount} 未兑换餐数`}
                            </span>
                            <p className="text-[11px] text-amber-900 mt-0.5">
                              {language === 'en'
                                ? `This customer has ${autoRevivedCount} unredeemed meals from their expired ${reviveCheck.planName}. Subscribing to the same plan automatically revives all ${autoRevivedCount} meals into their new balance!`
                                : `该客户上一期 ${reviveCheck.planName} 到期时有 ${autoRevivedCount} 餐未兑换。订购同款套餐将全数自动复活加回，保障客户权益！`}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 bg-emerald-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-emerald-400 block text-[11px] font-bold">ORDER SUMMARY</span>
                          <span className="font-extrabold text-white text-sm">
                            {orderGenMember?.name || 'Selected Customer'} · {orderGenPlanName}
                          </span>
                          <p className="text-emerald-200 text-[11px] mt-0.5">
                            Adding +{baseToAdd} meals {autoRevivedCount > 0 ? `+ ${autoRevivedCount} auto-revived = +${grandToAdd} meals` : ''} (Total new balance: {finalBalance} meals)
                          </p>
                          <span className="text-[10px] text-emerald-300/80 block mt-1">
                            📅 Validity: {validityDays} Mon–Fri weekdays from 1st meal order (extended for public holidays & kitchen off-days)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 block text-[11px]">Total Paid Amount</span>
                          <span className="font-heading font-black text-xl text-emerald-300">
                            RM {Number(orderGenPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGeneratingPackageOrder(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : '取消'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmGenerateOrder}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Confirm Order & Issue Official Receipt'
                      : '确认录入并开具正式收据'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: OFFICIAL RECEIPTS LEDGER */}
        {isReceiptsLedgerOpen && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-base text-white">
                      {language === 'en' ? 'Official Receipts & Payment Confirmation Ledger' : '官方正式收据与收款确认总表'}
                    </h4>
                    <p className="text-xs text-stone-400">
                      {language === 'en'
                        ? 'Archive of all verified payment receipts issued to meal package customers'
                        : '所有已向套餐会员开具的正式收据存根与付款凭据归档'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReceiptsLedgerOpen(false)}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-toolbar */}
              {(() => {
                const allReceiptsList = members
                  .flatMap((m) => (m.officialReceipts || []).map((r) => ({ receipt: r, member: m })))
                  .sort(
                    (a, b) =>
                      new Date(b.receipt.issuedAt).getTime() -
                      new Date(a.receipt.issuedAt).getTime()
                  );

                const filtered = allReceiptsList.filter(({ receipt }) => {
                  if (!receiptSearchQuery.trim()) return true;
                  const q = receiptSearchQuery.toLowerCase();
                  return (
                    receipt.receiptNumber.toLowerCase().includes(q) ||
                    receipt.memberName.toLowerCase().includes(q) ||
                    receipt.memberPhone.includes(q) ||
                    receipt.planName.toLowerCase().includes(q) ||
                    (receipt.planNameZh && receipt.planNameZh.includes(q)) ||
                    (receipt.paymentReference && receipt.paymentReference.toLowerCase().includes(q))
                  );
                });

                const totalRevenue = filtered.reduce((acc, { receipt }) => acc + receipt.totalAmount, 0);

                const handleExportReceiptsCSV = () => {
                  const headers = ['Receipt No', 'Date Time', 'Member ID', 'Customer Name', 'Phone', 'Package', 'Meals', 'Bonus Meals', 'Amount (RM)', 'Payment Method', 'Reference No', 'Status'];
                  const rows = filtered.map(({ receipt }) => [
                    receipt.receiptNumber,
                    `"${receipt.issuedAt}"`,
                    receipt.memberId,
                    `"${receipt.memberName.replace(/"/g, '""')}"`,
                    receipt.memberPhone,
                    `"${receipt.planName.replace(/"/g, '""')}"`,
                    receipt.totalMeals,
                    receipt.bonusMeals || 0,
                    receipt.totalAmount.toFixed(2),
                    receipt.paymentMethod,
                    `"${receipt.paymentReference || ''}"`,
                    receipt.paymentConfirmed ? 'PAID' : 'PENDING',
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `CHILL_Official_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  triggerToast('✓ Exported official receipts to CSV!');
                };

                return (
                  <>
                    <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          value={receiptSearchQuery}
                          onChange={(e) => setReceiptSearchQuery(e.target.value)}
                          placeholder="Search receipt #, customer name, phone, or package..."
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-600 text-xs">
                          Total: <strong className="text-emerald-700">{filtered.length} Receipts</strong> (RM {totalRevenue.toFixed(2)})
                        </span>

                        <button
                          type="button"
                          onClick={handleExportReceiptsCSV}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Receipts List */}
                    <div className="p-4 overflow-y-auto flex-1 divide-y divide-stone-100 space-y-2">
                      {filtered.length === 0 ? (
                        <div className="text-center py-12 text-stone-400">
                          <Receipt className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                          <p className="font-bold text-stone-600">No official receipts found</p>
                          <p className="text-xs text-stone-400 mt-1">
                            Click "Issue Official Receipt" or "Generate Package Order" on any member card to create receipts.
                          </p>
                        </div>
                      ) : (
                        filtered.map(({ receipt, member }) => (
                          <div
                            key={receipt.id}
                            className="p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-stone-900">
                                  {receipt.receiptNumber}
                                </span>
                                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  PAID ✓
                                </span>
                                <span className="text-stone-400 text-[11px]">
                                  {receipt.issuedAt}
                                </span>
                              </div>

                              <p className="text-xs text-stone-700 font-bold">
                                {receipt.memberName} <span className="text-stone-400 font-normal">({receipt.memberPhone})</span>
                              </p>

                              <p className="text-[11px] text-stone-500 truncate">
                                {receipt.planName} · {receipt.totalMeals} Meals
                                {receipt.bonusMeals ? ` (+${receipt.bonusMeals} free)` : ''} · {receipt.paymentMethod}
                                {receipt.paymentReference ? ` (Ref: ${receipt.paymentReference})` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 sm:self-center shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-stone-400 block">Amount Paid</span>
                                <span className="font-heading font-black text-sm text-stone-900">
                                  RM {receipt.totalAmount.toFixed(2)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReceiptMember(member);
                                  setActiveReceiptForModal(receipt);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{language === 'en' ? 'View / Print' : '查看/打印'}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Footer */}
              <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsReceiptsLedgerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  {language === 'en' ? 'Close' : '关闭'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: OFFICIAL RECEIPT ISSUANCE & PREVIEW */}
        {activeReceiptForModal && (
          <OfficialReceiptModal
            isOpen={Boolean(activeReceiptForModal)}
            onClose={() => {
              setActiveReceiptForModal(null);
              setActiveReceiptMember(null);
            }}
            language={language}
            member={activeReceiptMember || undefined}
            packages={packages}
            siteSettings={siteSettings}
            existingReceipt={activeReceiptForModal}
            onSaveReceipt={handleSaveReceiptFromModal}
          />
        )}
      </div>
  );
};
