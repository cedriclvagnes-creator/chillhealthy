import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle,
  Copy,
  FileText,
  ShieldCheck,
  Edit2,
  Save,
  Clock,
  MapPin,
  Phone,
  Package,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MemberAccount, MealPlan, OfficialReceipt, SiteSettings, Language } from '../types';
import { ChillLogo } from './ChillLogo';
import { createDefaultOfficialReceipt, buildReceiptWhatsAppMessage, COMPANY_NAME, COMPANY_REG_NO } from '../utils/receipt';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export interface OfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  member?: MemberAccount;
  packages?: MealPlan[];
  siteSettings: SiteSettings;
  existingReceipt?: OfficialReceipt | null;
  receipt?: OfficialReceipt | null;
  onSaveReceipt?: (receipt: OfficialReceipt) => void;
  readOnly?: boolean;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  isOpen,
  onClose,
  language,
  member,
  packages = [],
  siteSettings,
  existingReceipt,
  receipt: receiptProp,
  onSaveReceipt,
  readOnly = false,
}) => {
  const targetReceipt = existingReceipt || receiptProp;

  // Available packages for this customer
  const defaultPlan = member
    ? packages.find((p) => p.id === member.activePackage?.planId || member.activePackage?.planName.includes(p.title)) ||
      (member.activePackage
        ? {
            id: member.activePackage.planId || 'custom-plan',
            title: member.activePackage.planName,
            titleZh: member.activePackage.planNameZh,
            mealsTotal: member.activePackage.totalMeals || 20,
            totalPrice: (member.activePackage as any).price || 398,
          }
        : packages[0] || { id: 'p1', title: '20-Day Healthy Meal Plan', mealsTotal: 20, totalPrice: 398 })
    : null;

  const sanitizeReceipt = (r: OfficialReceipt): OfficialReceipt => {
    if (!r) return r;
    return {
      ...r,
      companyName:
        !r.companyName || r.companyName.includes('SDN. BHD.')
          ? COMPANY_NAME
          : r.companyName,
      companyRegNo:
        !r.companyRegNo || r.companyRegNo.includes('202401029841')
          ? COMPANY_REG_NO
          : r.companyRegNo,
    };
  };

  const [receipt, setReceipt] = useState<OfficialReceipt>(() => {
    if (targetReceipt) return sanitizeReceipt(targetReceipt);
    if (member && defaultPlan) return createDefaultOfficialReceipt(member, defaultPlan as any, siteSettings);
    return {} as OfficialReceipt;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When member or targetReceipt changes, update local state
  useEffect(() => {
    if (targetReceipt) {
      setReceipt(sanitizeReceipt(targetReceipt));
    } else if (member && defaultPlan) {
      setReceipt(createDefaultOfficialReceipt(member, defaultPlan as any, siteSettings));
    }
    setIsEditing(false);
  }, [member, targetReceipt]);

  if (!isOpen || !receipt || !receipt.receiptNumber) return null;

  const handlePlanSelect = (planId: string) => {
    const found = packages.find((p) => p.id === planId);
    if (!found) return;
    setReceipt((prev) => ({
      ...prev,
      planId: found.id,
      planName: found.title,
      planNameZh: found.titleZh || found.title,
      totalMeals: found.mealsTotal,
      unitPrice: Number((found.totalPrice / found.mealsTotal).toFixed(2)),
      totalAmount: found.totalPrice,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const rawText = buildReceiptWhatsAppMessage(receipt).replace(/%0A/g, '\n').replace(/\*/g, '');
    navigator.clipboard.writeText(rawText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleSave = () => {
    if (onSaveReceipt) {
      onSaveReceipt(receipt);
    }
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const whatsappUrl = buildWhatsAppUrl(receipt.memberPhone, decodeURIComponent(buildReceiptWhatsAppMessage(receipt).replace(/%0A/g, '\n')));

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col my-auto max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>{language === 'en' ? 'Official Payment Receipt' : '正式收款凭证 / 收据'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-400/30">
                  {receipt.receiptNumber}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {language === 'en' ? 'Issue verified receipt to customer upon confirming payment' : '确认收到顾客款项后开具正式收据凭证'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isEditing
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? (language === 'en' ? 'Exit Edit' : '退出编辑') : (language === 'en' ? 'Edit Details' : '修改内容')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Print Receipt or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Print / PDF' : '打印 / 存PDF'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Send Receipt via WhatsApp to Customer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner if edited / saved */}
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 px-6 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in no-print">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{language === 'en' ? '✓ Official Receipt successfully saved and linked to member profile!' : '✓ 正式收据已成功保存并关联至会员档案！'}</span>
          </div>
        )}

        {/* Edit Form Drawer (Shown when isEditing === true) */}
        {isEditing && (
          <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 text-xs space-y-4 no-print animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{language === 'en' ? 'Edit Receipt Parameters & Confirmation Details' : '编辑收据参数与收款确认详情'}</span>
              </h4>
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Save Changes' : '保存修改'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Select Meal Plan' : '选择配套产品'}
                </label>
                <select
                  value={receipt.planId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-emerald-600"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (RM {p.totalPrice.toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Total Amount Received (RM)' : '实收总金额 (RM)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={receipt.totalAmount}
                  onChange={(e) =>
                    setReceipt({ ...receipt, totalAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 font-bold text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Receipt Number' : '收据编号'}
                </label>
                <input
                  type="text"
                  value={receipt.receiptNumber}
                  onChange={(e) => setReceipt({ ...receipt, receiptNumber: e.target.value })}
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Payment Method' : '支付方式'}
                </label>
                <select
                  value={receipt.paymentMethod}
                  onChange={(e) => setReceipt({ ...receipt, paymentMethod: e.target.value })}
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="DuitNow QR / Instant Transfer">DuitNow QR / Instant Transfer (推荐)</option>
                  <option value="Bank Transfer (MAE / CIMB / Public)">Online Banking (MAE / CIMB / Public)</option>
                  <option value="Touch 'n Go eWallet">Touch 'n Go eWallet</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash on Delivery / Kitchen Pickup">Cash (现金)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Bank Reference / Txn ID' : '银行转账流水号 / 参考号'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. DN-20260922-9919"
                  value={receipt.paymentReference || ''}
                  onChange={(e) => setReceipt({ ...receipt, paymentReference: e.target.value })}
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {language === 'en' ? 'Verified By (Staff / Role)' : '收款确认人 (姓名/工号)'}
                </label>
                <input
                  type="text"
                  value={receipt.confirmedBy}
                  onChange={(e) => setReceipt({ ...receipt, confirmedBy: e.target.value })}
                  className="w-full p-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Official Receipt Content (The printable document) */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 printable-receipt-container bg-white text-stone-900 print:p-0">
          {/* Header row: Logo & Official Business Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-stone-900">
            <div>
              <div className="flex items-center gap-2">
                <ChillLogo size="md" />
                <div>
                  <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-stone-950">
                    {receipt.companyName || COMPANY_NAME}
                  </h1>
                  <p className="text-[11px] font-mono text-stone-500">
                    Co. Reg. No: {receipt.companyRegNo || COMPANY_REG_NO}
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-600 mt-2 max-w-sm leading-relaxed">
                📍 {receipt.kitchenAddress}
              </p>
              <p className="text-xs text-stone-600">
                📞 Hotline / WhatsApp: <span className="font-bold">{receipt.kitchenContact}</span>
              </p>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto bg-stone-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-stone-200">
              <div className="inline-block px-3 py-1 rounded-lg bg-stone-900 text-white font-heading font-extrabold text-xs tracking-wider uppercase mb-1">
                OFFICIAL RECEIPT
              </div>
              <div className="font-mono font-bold text-base text-stone-900">
                {receipt.receiptNumber}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Issue Date: <span className="font-medium text-stone-800">{receipt.issuedAt}</span>
              </p>
            </div>
          </div>

          {/* Bill To & Payment Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
              <div className="text-[10px] font-extrabold tracking-wider uppercase text-stone-400">
                BILLED TO / 客户信息
              </div>
              <div className="font-heading font-black text-stone-950 text-base flex items-center gap-2">
                <span>{receipt.memberName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Member
                </span>
              </div>
              <p className="text-stone-600 flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-bold text-stone-900">{receipt.memberPhone}</span>
              </p>
              <p className="text-stone-600 flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-800">Primary Delivery:</strong> {receipt.memberAddress}, {receipt.memberArea} {receipt.memberPostalCode}
                </span>
              </p>
              {receipt.memberAddress2 && (
                <p className="text-stone-500 text-[11px] pl-5">
                  <strong>Secondary Address:</strong> {receipt.memberAddress2}, {receipt.memberArea2} {receipt.memberPostalCode2}
                </p>
              )}
            </div>

            {/* Payment Verification Badge Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-800 flex items-center justify-between">
                  <span>PAYMENT STATUS / 付款状态</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified & Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1 rounded-full bg-emerald-600 text-white">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="font-heading font-black text-emerald-950 text-lg">
                    PAYMENT CONFIRMED (PAID ✓)
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-stone-700 border-t border-emerald-200/80 pt-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Channel:</span>
                  <span className="font-bold text-stone-900">{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-stone-500">Bank Reference No:</span>
                  <span className="font-bold text-stone-900">{receipt.paymentReference || 'VERIFIED-DN'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Confirmed By:</span>
                  <span className="font-medium text-emerald-900">{receipt.confirmedBy} ({receipt.paymentConfirmedAt})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Order Details Table */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-900 text-white uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="p-3 sm:p-4">Item & Description</th>
                  <th className="p-3 sm:p-4 text-center">Meals</th>
                  <th className="p-3 sm:p-4 text-right">Avg Rate</th>
                  <th className="p-3 sm:p-4 text-right">Amount (MYR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                <tr>
                  <td className="p-3 sm:p-4">
                    <div className="font-bold text-stone-950 text-sm">
                      {receipt.planName}
                    </div>
                    {receipt.planNameZh && (
                      <div className="text-xs text-stone-500 font-medium">
                        {receipt.planNameZh}
                      </div>
                    )}
                    <ul className="text-[11px] text-stone-500 mt-1.5 space-y-0.5 list-disc list-inside">
                      <li>Complimentary daily lunch delivery across Klang Valley (Mon–Fri)</li>
                      <li>Includes 1-account dual-address switching (Home & Office)</li>
                      <li>Full choice of 26 Chef Signature calorie-controlled bento recipes</li>
                    </ul>
                  </td>
                  <td className="p-3 sm:p-4 text-center font-bold text-stone-800">
                    {receipt.totalMeals} Meals
                    {receipt.bonusMeals && receipt.bonusMeals > 0 ? (
                      <div className="text-[10px] text-emerald-700 font-extrabold">
                        +{receipt.bonusMeals} Bonus Free Meals
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-mono text-stone-700">
                    RM {((receipt.totalAmount || 398) / (receipt.totalMeals || 20)).toFixed(2)}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-bold text-stone-950 font-mono text-sm">
                    RM {receipt.totalAmount.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-stone-50/70 text-stone-600 text-[11px]">
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-stone-800">Klang Valley Delivery & Thermal Insulation</span>
                    <span className="block text-[10px] text-emerald-700">Subsidized promotional standard delivery</span>
                  </td>
                  <td className="p-3 sm:p-4 text-center font-bold text-emerald-800">Complimentary</td>
                  <td className="p-3 sm:p-4 text-right font-mono text-stone-400">RM 0.00</td>
                  <td className="p-3 sm:p-4 text-right font-bold text-emerald-700 font-mono">RM 0.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-900 bg-stone-100/80 font-bold">
                  <td colSpan={3} className="p-3 sm:p-4 text-right text-xs uppercase tracking-wider text-stone-700">
                    Grand Total Paid (MYR):
                  </td>
                  <td className="p-3 sm:p-4 text-right font-heading font-black text-lg text-emerald-900 font-mono">
                    RM {receipt.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Stamp, Terms & Authorisation Footer */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="space-y-2 max-w-md text-[11px] text-stone-500 leading-relaxed">
              <p className="font-bold text-stone-700">Terms & Conditions:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>This is an official computer-generated receipt issued upon payment receipt. No signature is required.</li>
                <li>Meal plan credits are valid for Monday to Friday lunchtime deliveries.</li>
                <li>Daily meal reservations cut off at 5:00 PM on the previous workday.</li>
                <li>Credits remain active on the customer profile and will be deducted upon each daily meal booking.</li>
              </ol>
            </div>

            {/* Official Digital Stamp Graphic */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 text-emerald-800 text-center w-full sm:w-56 shadow-2xs rotate-[-1deg]">
              <div className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-emerald-700">
                CHILL HEALTHY TRADING (003786393-M)
              </div>
              <div className="font-heading font-black text-sm text-emerald-950 my-0.5 tracking-wider border-y border-emerald-300 py-0.5 w-full">
                PAID & VERIFIED
              </div>
              <div className="text-[9px] font-mono text-emerald-800">
                {receipt.paymentConfirmedAt}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-emerald-600 mt-0.5">
                Authorized Official Stamp
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer (Hidden on Print) */}
        <div className="bg-stone-50 px-4 sm:px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-400" />}
              <span>{copiedText ? (language === 'en' ? 'Copied Receipt! ✓' : '已复制收据文字！') : (language === 'en' ? 'Copy Text' : '复制收据文字')}</span>
            </button>

            {onSaveReceipt && !readOnly && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'en' ? 'Save to Member Profile' : '保存至会员收据记录'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{language === 'en' ? 'WhatsApp Receipt to Customer' : 'WhatsApp 发送给顾客'}</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'en' ? 'Print / Save PDF' : '打印 / 存为PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
