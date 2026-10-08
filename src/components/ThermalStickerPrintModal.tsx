import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileDown,
  MessageCircle,
  Copy,
  Check,
  X,
  ArrowUpDown,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  Phone,
  Tag,
  Building2,
} from 'lucide-react';
import { MealRedemption, SiteSettings, Language } from '../types';
import {
  downloadThermalStickersPdf,
  sortRedemptionsForThermalStickers,
  buildKitchenWhatsAppManifest,
  ThermalStickerOptions,
} from '../utils/thermalStickerPdf';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface ThermalStickerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  redemptions: MealRedemption[];
  siteSettings: SiteSettings;
  language: Language;
  initialDateFilter?: string;
  initialSelectedIds?: string[];
}

export const ThermalStickerPrintModal: React.FC<ThermalStickerPrintModalProps> = ({
  isOpen,
  onClose,
  redemptions,
  siteSettings,
  language,
  initialDateFilter,
  initialSelectedIds,
}) => {
  if (!isOpen) return null;

  // Filter States
  const [dateFilter, setDateFilter] = useState<string>(initialDateFilter || 'all');
  const [slotFilter, setSlotFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ThermalStickerOptions['sortBy']>('customerNameAsc');
  const [stickerSize, setStickerSize] = useState<'6inch' | 'a6'>('6inch');
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [onlySelected, setOnlySelected] = useState<boolean>(Boolean(initialSelectedIds && initialSelectedIds.length > 0));

  // Extract unique delivery dates
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(redemptions.map((r) => r.deliveryDate).filter(Boolean)));
    return dates.sort();
  }, [redemptions]);

  // Filter and sort the redemptions
  const filteredAndSortedRedemptions = useMemo(() => {
    let list = [...redemptions];

    // If initialSelectedIds were provided and toggled
    if (onlySelected && initialSelectedIds && initialSelectedIds.length > 0) {
      list = list.filter((r) => initialSelectedIds.includes(r.id));
    }

    // Filter by Date
    if (dateFilter !== 'all') {
      list = list.filter((r) => r.deliveryDate === dateFilter);
    }

    // Filter by Slot
    if (slotFilter !== 'all') {
      list = list.filter((r) => {
        const slot = (r.deliverySlot || '').toLowerCase();
        return slot.includes(slotFilter);
      });
    }

    // Filter by Search (customer name, phone, address, meal, order number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.memberName && r.memberName.toLowerCase().includes(q)) ||
          (r.memberPhone && r.memberPhone.includes(q)) ||
          (r.mealName && r.mealName.toLowerCase().includes(q)) ||
          (r.deliveryAddress && r.deliveryAddress.toLowerCase().includes(q)) ||
          (r.area && r.area.toLowerCase().includes(q)) ||
          (r.orderNumber && r.orderNumber.toLowerCase().includes(q)) ||
          (r.id && r.id.toLowerCase().includes(q))
      );
    }

    // Sort by chosen criterion (Default: customerNameAsc)
    return sortRedemptionsForThermalStickers(list, sortBy);
  }, [redemptions, dateFilter, slotFilter, searchQuery, sortBy, onlySelected, initialSelectedIds]);

  // Direct print handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Report handler
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadThermalStickersPdf(filteredAndSortedRedemptions, siteSettings, {
        size: stickerSize,
        sortBy,
      });
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  // Copy kitchen manifest
  const handleCopyManifest = () => {
    const raw = decodeURIComponent(
      buildKitchenWhatsAppManifest(
        filteredAndSortedRedemptions,
        dateFilter !== 'all' ? dateFilter : undefined
      )
    );
    navigator.clipboard.writeText(raw);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  // WhatsApp Kitchen Link
  const kitchenWaNumber = siteSettings.whatsappNumber || '60126189919';
  const whatsappUrl = buildWhatsAppUrl(
    kitchenWaNumber,
    decodeURIComponent(
      buildKitchenWhatsAppManifest(
        filteredAndSortedRedemptions,
        dateFilter !== 'all' ? dateFilter : undefined
      )
    )
  );

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col my-auto max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Top Header & Actions Bar (Hidden on print) */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-sm sm:text-base text-white">
                  {language === 'en'
                    ? 'Thermal Printer A6 PDF / 6-Inch Sticker Report'
                    : '后厨热敏打印机 A6 / 6 寸贴纸报表 (PDF)'}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {filteredAndSortedRedemptions.length} {language === 'en' ? 'Stickers' : '张贴纸'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  {language === 'en'
                    ? 'Sorted alphabetically by Customer Name (A-Z) with all delivery & bento details for kitchen packaging.'
                    : '已按顾客姓名首字母 (A-Z) 升序排列，包含完整配送地址与餐盒规格，可直接发送后厨贴标打印。'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Print, Download PDF, WhatsApp Kitchen, Close) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              title="Print directly to connected thermal sticker printer"
            >
              <Printer className="w-4 h-4 text-stone-950" />
              <span>{language === 'en' ? 'Print Thermal Stickers' : '打印热敏贴纸'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-stone-700 active:scale-95"
              title="Download vector multi-page A6 PDF file"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>{isGeneratingPdf ? 'Generating...' : language === 'en' ? 'Download A6 PDF' : '下载 A6 PDF 报表'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-600 shadow-xs active:scale-95"
              title="Send manifest to kitchen staff WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>{language === 'en' ? 'Send to Kitchen' : '发送后厨 WhatsApp'}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyManifest}
              className="px-2.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-stone-700"
              title="Copy text manifest"
            >
              {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
              <span>{copiedManifest ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter, Sort & Sticker Size Toolbar (Hidden on print) */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-3 space-y-2.5 no-print text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-center">
            {/* Sorting Filter (Customer Name A-Z by default) */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">
                  {language === 'en' ? 'Sort Stickers' : '贴纸排序'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="customerNameAsc">🔤 Customer Name (A → Z) [Default]</option>
                  <option value="customerNameDesc">🔤 Customer Name (Z → A)</option>
                  <option value="deliverySlot">⏰ Delivery Time Slot</option>
                  <option value="orderNumber">#️⃣ Order Number</option>
                </select>
              </div>
            </div>

            {/* Delivery Date Filter */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">
                  {language === 'en' ? 'Delivery Date' : '送餐日期'}
                </span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">{language === 'en' ? 'All Delivery Dates' : '所有送餐日期'}</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>
                      📅 {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Slot Filter */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">
                  {language === 'en' ? 'Time Slot' : '配送餐段'}
                </span>
                <select
                  value={slotFilter}
                  onChange={(e) => setSlotFilter(e.target.value as any)}
                  className="w-full bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">{language === 'en' ? 'All Slots' : '全天餐段 (午餐 & 晚餐)'}</option>
                  <option value="lunch">{language === 'en' ? 'Lunch (10:00 AM – 2:00 PM)' : '午餐 (10:00 AM – 2:00 PM)'}</option>
                  <option value="dinner">{language === 'en' ? 'Dinner (4:30 PM – 7:30 PM)' : '晚餐 (4:30 PM – 7:30 PM)'}</option>
                </select>
              </div>
            </div>

            {/* Sticker Dimensions Toggle */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">
                  {language === 'en' ? 'Label Dimension' : '贴纸规格'}
                </span>
                <select
                  value={stickerSize}
                  onChange={(e) => setStickerSize(e.target.value as any)}
                  className="w-full bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="6inch">🏷️ 6-Inch Roll (100×150mm)</option>
                  <option value="a6">📄 Standard A6 (105×148mm)</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search customer, phone, bento...' : '搜索姓名、手机、餐品...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Selection Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-stone-600 font-medium">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>
                  {sortBy === 'customerNameAsc'
                    ? (language === 'en' ? 'Sorted by Customer Name (A-Z)' : '已按顾客姓名 A-Z 排序')
                    : sortBy === 'customerNameDesc'
                    ? (language === 'en' ? 'Sorted by Customer Name (Z-A)' : '已按顾客姓名 Z-A 排序')
                    : sortBy === 'deliverySlot'
                    ? (language === 'en' ? 'Sorted by Delivery Slot' : '按餐段排序')
                    : (language === 'en' ? 'Sorted by Order Number' : '按订单号排序')}
                </span>
              </span>

              {initialSelectedIds && initialSelectedIds.length > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer ml-2 select-none">
                  <input
                    type="checkbox"
                    checked={onlySelected}
                    onChange={(e) => setOnlySelected(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                  />
                  <span className="text-stone-700">
                    {language === 'en'
                      ? `Print only ${initialSelectedIds.length} selected items`
                      : `仅打印已选中的 ${initialSelectedIds.length} 笔订单`}
                  </span>
                </label>
              )}
            </div>

            <div className="text-[11px] text-stone-500">
              {language === 'en'
                ? `Showing ${filteredAndSortedRedemptions.length} thermal sticker(s)`
                : `共计 ${filteredAndSortedRedemptions.length} 张备餐贴纸`}
            </div>
          </div>
        </div>

        {/* Printable Thermal Stickers Container */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-stone-100 flex-1 printable-thermal-sticker-container print:p-0 print:bg-white">
          {filteredAndSortedRedemptions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
              <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Printer className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-stone-800 text-sm">
                {language === 'en' ? 'No orders match current filter' : '没有符合筛选条件的订单'}
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                {language === 'en' ? 'Try adjusting delivery date or search query.' : '请尝试调整送餐日期或搜索关键字。'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block print:gap-0">
              {filteredAndSortedRedemptions.map((red, index) => {
                const orderNo = red.orderNumber || red.id;
                const qty = red.quantity || 1;

                return (
                  <div
                    key={red.id}
                    className="thermal-sticker-sheet w-full max-w-[100mm] mx-auto bg-white border-2 border-black rounded-lg p-3 text-black shadow-sm flex flex-col justify-between print:rounded-none print:shadow-none print:border-2 print:border-black print:mb-0 print:break-after-page"
                    style={{
                      minHeight: stickerSize === 'a6' ? '142mm' : '145mm',
                      pageBreakAfter: 'always',
                      breakAfter: 'page',
                    }}
                  >
                    {/* 1. Header Banner */}
                    <div className="border-b-2 border-black pb-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-sm tracking-tight leading-tight">
                            CHILL HEALTHY <span className="font-bold text-xs">潮轻食</span>
                          </div>
                          <div className="text-[8.5px] font-bold text-stone-700 tracking-wider">
                            CENTRAL KITCHEN BENTO DISPATCH
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                            #{index + 1} OF {filteredAndSortedRedemptions.length}
                          </span>
                          <div className="text-[8px] font-bold text-stone-600 uppercase mt-0.5">
                            {red.orderType || 'MEAL PLAN'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Customer Name (PRIMARY SORTED IDENTIFIER - LARGE BOLD) */}
                    <div className="bg-stone-100 border border-black p-2 rounded mb-2">
                      <div className="text-[8px] font-bold text-stone-600 uppercase">
                        CUSTOMER NAME (SORTED A-Z):
                      </div>
                      <div className="font-black text-base uppercase leading-tight truncate">
                        {red.memberName || 'Customer'}
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold mt-1 pt-1 border-t border-stone-300">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-stone-700" />
                          <span>{red.memberPhone}</span>
                        </span>
                        <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-300">
                          #{orderNo}
                        </span>
                      </div>
                    </div>

                    {/* 3. Delivery Timing & Slot Box */}
                    <div className="border border-black p-1.5 rounded mb-2 bg-stone-50">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-700" />
                          <span>DATE: {red.deliveryDate}</span>
                        </div>
                        <span className="text-[9px] uppercase px-1 rounded bg-black text-white">
                          {red.status || 'PREPPING'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-stone-800 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-700" />
                        <span>SLOT: {(red.deliverySlot || 'LUNCH (10:00 AM – 2:00 PM)').toUpperCase()}</span>
                      </div>
                    </div>

                    {/* 4. Complete Delivery Address Destination */}
                    <div className="border border-black p-2 rounded mb-2 text-xs">
                      <div className="text-[8px] font-bold text-stone-600 uppercase flex items-center gap-1 mb-0.5">
                        <MapPin className="w-2.5 h-2.5 text-stone-700" />
                        <span>DELIVERY DESTINATION:</span>
                      </div>
                      <div className="font-bold text-[11px] leading-snug line-clamp-2">
                        {red.deliveryAddress}
                      </div>
                      <div className="font-black text-[11px] mt-1 pt-1 border-t border-stone-200">
                        AREA: {red.area || 'Klang Valley'}, {red.postalCode}
                      </div>
                    </div>

                    {/* 5. Bento Meal Prep Specification (Kitchen Packing) */}
                    <div className="border border-black p-2 rounded mb-2 bg-stone-50">
                      <div className="text-[8px] font-bold text-stone-600 uppercase flex items-center gap-1 mb-0.5">
                        <UtensilsCrossed className="w-2.5 h-2.5 text-stone-700" />
                        <span>BENTO ITEM & PORTION:</span>
                      </div>
                      <div className="font-black text-xs text-black leading-tight">
                        {qty}x {red.mealName}
                      </div>
                      {red.mealNameZh && (
                        <div className="text-[10px] font-bold text-stone-700 mt-0.5">
                          ({red.mealNameZh})
                        </div>
                      )}
                      <div className="text-[8px] font-bold text-stone-600 mt-1">
                        SPEC: 0 MSG · High Protein · Warm Chef-Sealed Bento
                      </div>
                      {red.dietaryNotes && (
                        <div className="text-[9px] font-black text-red-700 bg-red-50 p-1 rounded border border-red-200 mt-1">
                          ⚠️ NOTE: {red.dietaryNotes}
                        </div>
                      )}
                    </div>

                    {/* 6. Barcode Simulation & Tracking Reference */}
                    <div className="border border-black p-1 rounded mb-2 text-center bg-white">
                      {/* Visual Barcode bars */}
                      <div className="h-6 flex items-center justify-center gap-[1.5px] px-2 overflow-hidden">
                        {Array.from({ length: 42 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-full inline-block ${
                              (orderNo.charCodeAt(i % orderNo.length) + i) % 3 === 0
                                ? 'w-[2.5px] bg-black'
                                : (orderNo.charCodeAt(i % orderNo.length) + i) % 5 === 0
                                ? 'w-[1.5px] bg-transparent'
                                : 'w-[1px] bg-black'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="font-mono font-black text-[9px] tracking-wider mt-0.5">
                        *{orderNo}*
                      </div>
                    </div>

                    {/* 7. Verification Checklist & Central Hub Footer */}
                    <div className="border-t border-black pt-1 text-[8px] space-y-0.5">
                      <div className="flex items-center justify-between font-bold">
                        <span>[  ] Weighed</span>
                        <span>[  ] Sealed</span>
                        <span>[  ] Dispatched</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600 pt-0.5">
                        <span>Hub Hotline: {siteSettings.whatsappDisplay || '+60126189919'}</span>
                        <span className="font-mono text-[7.5px]">Sorted: Name (A-Z)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="bg-stone-50 px-4 sm:px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 no-print text-xs">
          <div className="text-stone-500 flex items-center gap-2">
            <span className="font-bold text-stone-800">
              {filteredAndSortedRedemptions.length} {language === 'en' ? 'Stickers ready' : '张贴纸已生成'}
            </span>
            <span>·</span>
            <span>
              {language === 'en'
                ? 'Standard 4"×6" (100mm×150mm) / A6 Thermal Roll'
                : '标准 4"×6" (100mm×150mm) / A6 热敏卷纸规格'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Print All Stickers Now' : '立即打印全部贴纸'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Close' : '关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
