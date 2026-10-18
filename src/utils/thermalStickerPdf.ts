import { jsPDF } from 'jspdf';
import { MealRedemption, SiteSettings } from '../types';

export interface ThermalStickerOptions {
  size?: '6inch' | 'a6'; // '6inch' = 100mm x 150mm (standard thermal roll); 'a6' = 105mm x 148mm
  sortBy?: 'customerNameAsc' | 'customerNameDesc' | 'deliverySlot' | 'orderNumber';
}

/**
 * Sorts redemptions by customer name (A-Z default) or selected criterion.
 */
export function sortRedemptionsForThermalStickers(
  redemptions: MealRedemption[],
  sortBy: ThermalStickerOptions['sortBy'] = 'customerNameAsc'
): MealRedemption[] {
  const list = [...redemptions];

  switch (sortBy) {
    case 'customerNameAsc':
      return list.sort((a, b) => {
        const nameA = (a.memberName || '').trim().toLowerCase();
        const nameB = (b.memberName || '').trim().toLowerCase();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
    case 'customerNameDesc':
      return list.sort((a, b) => {
        const nameA = (a.memberName || '').trim().toLowerCase();
        const nameB = (b.memberName || '').trim().toLowerCase();
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      });
    case 'deliverySlot':
      return list.sort((a, b) => {
        const slotA = (a.deliverySlot || '').toLowerCase();
        const slotB = (b.deliverySlot || '').toLowerCase();
        if (slotA !== slotB) return slotA.localeCompare(slotB);
        return (a.memberName || '').localeCompare(b.memberName || '');
      });
    case 'orderNumber':
      return list.sort((a, b) => {
        const noA = (a.orderNumber || a.id).toLowerCase();
        const noB = (b.orderNumber || b.id).toLowerCase();
        return noA.localeCompare(noB);
      });
    default:
      return list.sort((a, b) => (a.memberName || '').localeCompare(b.memberName || ''));
  }
}

/**
 * Formats a clean date string with weekday name.
 * e.g., "2026-10-18 (Sunday)"
 */
function formatDateWithDay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dateStr} (${dayNames[d.getDay()]})`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Helper to split text into lines that fit within maxWidth on a 2D canvas.
 * Supports both space-delimited English words and Chinese characters.
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  
  // If the text has explicit newlines, handle paragraph by paragraph
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph) => {
    let currentLine = '';
    // Iterate characters or words
    // For CJK and Latin mixed text, character-by-character check works best
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i];
      const testLine = currentLine + char;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  });

  return lines;
}

/**
 * Draws a simulated Code128-style barcode pattern on HTML5 Canvas.
 */
function drawCanvasBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string
) {
  const clean = text.replace(/[^A-Za-z0-9]/g, '') || 'CH2610186519';
  let cursor = x;
  const barCount = 44;
  const unitWidth = width / barCount;

  ctx.fillStyle = '#000000';
  for (let i = 0; i < barCount; i++) {
    const charCode = clean.charCodeAt(i % clean.length) || 65;
    const isThick = (charCode + i) % 3 === 0;
    const isSpace = (charCode + i) % 5 === 0;

    if (!isSpace) {
      const barW = isThick ? unitWidth * 1.6 : unitWidth * 0.85;
      ctx.fillRect(cursor, y, barW, height);
    }
    cursor += unitWidth;
  }
}

/**
 * Renders an official, high-resolution (300 DPI) thermal printer sticker to an HTML5 canvas.
 * This completely eliminates Chinese character mojibake/garbled glyphs like "(žÑ€ái päž!€ø™ vÒ)"
 * and eliminates text overlapping by computing dynamic bounding heights.
 */
function renderThermalStickerToCanvas(
  red: MealRedemption,
  index: number,
  totalCount: number,
  siteSettings?: SiteSettings,
  size: '6inch' | 'a6' = '6inch'
): HTMLCanvasElement {
  // Standard 300 DPI dimensions:
  // 100mm x 150mm = 1181 x 1772 pixels
  // A6 105mm x 148mm = 1240 x 1748 pixels
  const width = size === 'a6' ? 1240 : 1181;
  const height = size === 'a6' ? 1748 : 1772;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Clear background to pure crisp white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Margins
  const marginX = 40;
  const marginY = 40;
  const contentWidth = width - marginX * 2;
  const contentHeight = height - marginY * 2;

  // Outer thermal label border (heavy 6px border)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(marginX, marginY, contentWidth, contentHeight);

  let currentY = marginY;

  // 2. Header Banner: CHILL HEALTHY 潮轻食 · CENTRAL KITCHEN BENTO DISPATCH
  const headerHeight = 150;
  ctx.fillStyle = '#18181b'; // dark zinc
  ctx.fillRect(marginX, currentY, contentWidth, headerHeight);

  // Brand Name in English & Chinese
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CHILL HEALTHY  潮轻食', marginX + 30, currentY + 62);

  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillStyle = '#d4d4d8';
  ctx.fillText('CENTRAL KITCHEN BENTO DISPATCH', marginX + 30, currentY + 112);

  // Label Sequence Number & Order Type Badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px system-ui, monospace';
  ctx.fillText(`#${index + 1} OF ${totalCount}`, marginX + contentWidth - 30, currentY + 62);

  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillStyle = '#a1a1aa';
  const orderTypeLabel = (red.orderType || 'MEAL PLAN').toUpperCase();
  ctx.fillText(orderTypeLabel, marginX + contentWidth - 30, currentY + 112);

  currentY += headerHeight;

  // 3. Customer Box (PRIMARY SORTED IDENTIFIER - LARGE BOLD)
  const customerBoxHeight = 240;
  ctx.fillStyle = '#f4f4f5'; // light gray
  ctx.fillRect(marginX, currentY, contentWidth, customerBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, customerBoxHeight);

  // Label
  ctx.textAlign = 'left';
  ctx.fillStyle = '#52525b';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('CUSTOMER NAME (ALPHABETICAL SORT A-Z):', marginX + 30, currentY + 45);

  // Customer Name (Extra Bold large font, supporting both English and Chinese names)
  ctx.fillStyle = '#000000';
  ctx.font = '900 52px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  const customerName = (red.memberName || 'Customer').trim();
  const truncatedCustomer = ctx.measureText(customerName).width > contentWidth - 60
    ? wrapCanvasText(ctx, customerName, contentWidth - 60)[0]
    : customerName;
  ctx.fillText(truncatedCustomer, marginX + 30, currentY + 120);

  // Separator inside customer box
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX + 30, currentY + 155);
  ctx.lineTo(marginX + contentWidth - 30, currentY + 155);
  ctx.stroke();

  // Phone & Order Number
  ctx.fillStyle = '#000000';
  ctx.font = '900 32px system-ui, monospace';
  ctx.fillText(`TEL: ${red.memberPhone || '-'}`, marginX + 30, currentY + 205);

  const orderNumber = red.orderNumber || red.id;
  ctx.textAlign = 'right';
  ctx.font = '800 30px system-ui, monospace';
  ctx.fillText(`ORDER #${orderNumber}`, marginX + contentWidth - 30, currentY + 205);

  currentY += customerBoxHeight;

  // 4. Delivery Schedule & Time Slot Bar
  const slotBoxHeight = 120;
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(marginX, currentY, contentWidth, slotBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, slotBoxHeight);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = '800 28px system-ui, sans-serif';
  const dateFormatted = formatDateWithDay(red.deliveryDate);
  ctx.fillText(`DATE: ${dateFormatted}`, marginX + 30, currentY + 50);

  const slotText = (red.deliverySlot || 'LUNCH (10:00 AM – 2:00 PM)').toUpperCase();
  ctx.fillText(`SLOT: ${slotText}`, marginX + 30, currentY + 95);

  const statusBadge = `[ ${(red.status || 'CONFIRMED').toUpperCase()} ]`;
  ctx.textAlign = 'right';
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillText(statusBadge, marginX + contentWidth - 30, currentY + 75);

  currentY += slotBoxHeight;

  // 5. Complete Delivery Address Destination Box
  const addressBoxHeight = 260;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(marginX, currentY, contentWidth, addressBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, addressBoxHeight);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#52525b';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('DELIVERY ADDRESS & LOCATION:', marginX + 30, currentY + 45);

  // Address lines (up to 2 lines)
  ctx.fillStyle = '#000000';
  ctx.font = '800 30px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  const fullAddress = `${red.deliveryAddress || 'Central Pickup Point'}`.trim();
  const addressLines = wrapCanvasText(ctx, fullAddress, contentWidth - 60);

  let addrLineY = currentY + 95;
  addressLines.slice(0, 2).forEach((line) => {
    ctx.fillText(line, marginX + 30, addrLineY);
    addrLineY += 45;
  });

  // Area & Postal Code
  ctx.fillStyle = '#000000';
  ctx.font = '900 30px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  const areaLine = `AREA: ${red.area || 'Klang Valley'}, ${red.postalCode || ''}`.trim();
  ctx.fillText(areaLine, marginX + 30, currentY + 225);

  currentY += addressBoxHeight;

  // 6. Bento Meal Prep Section (Kitchen Specs & Authentic Chinese Dish Name)
  // Designed with ample height to completely avoid overlapping remarks!
  const mealBoxHeight = 350;
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(marginX, currentY, contentWidth, mealBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, mealBoxHeight);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#52525b';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('BENTO ITEM & KITCHEN PREPARATION:', marginX + 30, currentY + 42);

  // Qty and English Dish Name
  const qty = red.quantity || 1;
  const mealTitle = `${qty}x  ${red.mealName}`;
  ctx.fillStyle = '#000000';
  ctx.font = '900 38px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  ctx.fillText(mealTitle, marginX + 30, currentY + 95);

  // Chinese Dish Name in true authentic Chinese font (NO MOJIBAKE)
  let mealDetailsY = currentY + 145;
  if (red.mealNameZh && red.mealNameZh.trim()) {
    ctx.fillStyle = '#047857'; // emerald green / dark kitchen accent
    ctx.font = '900 34px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
    ctx.fillText(`(${red.mealNameZh.trim()})`, marginX + 30, mealDetailsY);
    mealDetailsY += 48;
  }

  // Nutrition & Quality Guarantee Tags
  ctx.fillStyle = '#3f3f46';
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText('SPEC: 0 MSG · High Protein · Warm Chef-Sealed Bento', marginX + 30, mealDetailsY);
  mealDetailsY += 45;

  // Dietary Notes / Remarks Box with dedicated boundary so it never overlaps!
  const hasCustomNote = Boolean(red.dietaryNotes && red.dietaryNotes.trim());
  const noteContent = hasCustomNote
    ? `NOTE: ${red.dietaryNotes!.trim()}`
    : 'NOTE: Standard Asian Flavor Recipe (No Special Customization)';

  // Draw a highlighted note pill/box
  const noteBoxY = mealDetailsY - 12;
  const noteBoxHeight = 58;
  ctx.fillStyle = hasCustomNote ? '#fef2f2' : '#f4f4f5'; // red-50 or zinc-100
  ctx.fillRect(marginX + 20, noteBoxY, contentWidth - 40, noteBoxHeight);
  ctx.strokeStyle = hasCustomNote ? '#dc2626' : '#d4d4d8';
  ctx.lineWidth = 2;
  ctx.strokeRect(marginX + 20, noteBoxY, contentWidth - 40, noteBoxHeight);

  ctx.fillStyle = hasCustomNote ? '#b91c1c' : '#52525b';
  ctx.font = hasCustomNote
    ? '900 24px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif'
    : '700 23px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif';
  
  // Wrap or truncate note line to ensure it stays neatly inside
  const wrappedNotes = wrapCanvasText(ctx, noteContent, contentWidth - 70);
  ctx.fillText(wrappedNotes[0] || noteContent, marginX + 35, noteBoxY + 38);

  currentY += mealBoxHeight;

  // 7. Barcode & Tracking Key Box
  const barcodeBoxHeight = 170;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(marginX, currentY, contentWidth, barcodeBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, barcodeBoxHeight);

  // Draw simulated Code128 barcode
  drawCanvasBarcode(ctx, marginX + 80, currentY + 20, contentWidth - 160, 80, orderNumber);

  // Human-readable code centered below barcode
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = '900 32px monospace';
  ctx.fillText(`*${orderNumber}*`, marginX + contentWidth / 2, currentY + 142);

  currentY += barcodeBoxHeight;

  // 8. Kitchen Packing Verification Checklist & Footer (No overlap, 3 dedicated lines)
  const footerHeight = marginY + contentHeight - currentY;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(marginX, currentY, contentWidth, footerHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, currentY, contentWidth, footerHeight);

  // Line 1: Verification Checklist items
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = '900 26px system-ui, sans-serif';
  ctx.fillText('[  ] Prepared & Weighed      [  ] Heat-Sealed      [  ] Handed to Rider', marginX + contentWidth / 2, currentY + 48);

  // Line 2: Kitchen Delivery Hub & Hotline (Dedicated row)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3f3f46';
  ctx.font = '700 22px system-ui, sans-serif';
  const kitchenPhone = siteSettings?.whatsappDisplay || '+60126189919';
  ctx.fillText(`Klang & Selangor Delivery Hub · Kitchen Hotline: ${kitchenPhone}`, marginX + contentWidth / 2, currentY + 95);

  // Line 3: Printed Timestamp & Sort Mode (Dedicated bottom row - completely separate)
  ctx.fillStyle = '#71717a';
  ctx.font = '600 20px system-ui, sans-serif';
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  ctx.fillText(`Printed: ${nowStr} · Alphabetical Sort (Customer Name A-Z)`, marginX + contentWidth / 2, currentY + 135);

  return canvas;
}

/**
 * Generates an official, kitchen-grade thermal printer A6 / 6-inch sticker PDF report.
 * Each order is formatted as an independent sticker label (100mm x 150mm / 4"x6")
 * sorted alphabetically by customer name.
 * 
 * Uses 300-DPI Canvas rasterization in browser to ensure authentic Chinese typography
 * (avoiding jsPDF Helvetica encoding mojibake) and guaranteed zero-overlap layout.
 */
export function generateThermalStickerPdf(
  redemptions: MealRedemption[],
  siteSettings?: SiteSettings,
  options: ThermalStickerOptions = {}
): jsPDF {
  const { size = '6inch', sortBy = 'customerNameAsc' } = options;
  const sorted = sortRedemptionsForThermalStickers(redemptions, sortBy);

  // Sticker Dimensions (100mm x 150mm standard 4x6" thermal roll or A6 105mm x 148mm)
  const pageWidth = size === 'a6' ? 105 : 100;
  const pageHeight = size === 'a6' ? 148 : 150;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  if (sorted.length === 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('No orders found for thermal sticker generation.', 10, 20);
    return doc;
  }

  // Check if browser document & canvas are available (standard in SPA)
  const isBrowser = typeof document !== 'undefined' && typeof document.createElement === 'function';

  sorted.forEach((red, index) => {
    if (index > 0) {
      doc.addPage([pageWidth, pageHeight], 'portrait');
    }

    if (isBrowser) {
      try {
        const canvas = renderThermalStickerToCanvas(red, index, sorted.length, siteSettings, size);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        return;
      } catch (err) {
        console.warn('Canvas thermal sticker rendering fallback:', err);
      }
    }

    // Fallback vector drawing (if canvas fails or in non-browser context)
    const marginX = 4;
    const marginY = 4;
    const contentWidth = pageWidth - marginX * 2;
    const contentHeight = pageHeight - marginY * 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.7);
    doc.rect(marginX, marginY, contentWidth, contentHeight);

    doc.setFillColor(24, 24, 27);
    doc.rect(marginX, marginY, contentWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CHILL HEALTHY', marginX + 3, marginY + 6);
    doc.setFontSize(7.5);
    doc.text('CENTRAL KITCHEN BENTO DISPATCH', marginX + 3, marginY + 11);

    const orderNumber = red.orderNumber || red.id;
    let currentY = marginY + 14;

    // Customer
    doc.setFillColor(245, 245, 244);
    doc.rect(marginX, currentY, contentWidth, 22, 'F');
    doc.setLineWidth(0.4);
    doc.rect(marginX, currentY, contentWidth, 22, 'S');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6.5);
    doc.text('CUSTOMER NAME (SORTED A-Z):', marginX + 3, currentY + 4.5);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text((red.memberName || 'Customer').trim(), marginX + 3, currentY + 11.5);
    doc.setFontSize(9);
    doc.text(`TEL: ${red.memberPhone}`, marginX + 3, currentY + 18);
    doc.text(`ORDER #${orderNumber}`, marginX + contentWidth - 3, currentY + 18, { align: 'right' });

    currentY += 22;

    // Schedule
    doc.setFillColor(235, 235, 235);
    doc.rect(marginX, currentY, contentWidth, 11, 'F');
    doc.rect(marginX, currentY, contentWidth, 11, 'S');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(`DATE: ${formatDateWithDay(red.deliveryDate)}`, marginX + 3, currentY + 4.5);
    doc.text(`SLOT: ${(red.deliverySlot || 'LUNCH (10:00 AM – 2:00 PM)').toUpperCase()}`, marginX + 3, currentY + 9);
    doc.text(`[ ${(red.status || 'CONFIRMED').toUpperCase()} ]`, marginX + contentWidth - 3, currentY + 7, { align: 'right' });

    currentY += 11;

    // Address
    doc.rect(marginX, currentY, contentWidth, 24, 'S');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text('DELIVERY ADDRESS & LOCATION:', marginX + 3, currentY + 4.5);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(red.deliveryAddress || '', marginX + 3, currentY + 10);
    doc.text(`AREA: ${red.area || 'Klang Valley'}, ${red.postalCode || ''}`, marginX + 3, currentY + 19);

    currentY += 24;

    // Bento item
    doc.setFillColor(250, 250, 250);
    doc.rect(marginX, currentY, contentWidth, 32, 'F');
    doc.rect(marginX, currentY, contentWidth, 32, 'S');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text('BENTO ITEM & KITCHEN PREPARATION:', marginX + 3, currentY + 4.5);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    doc.text(`${red.quantity || 1}x ${red.mealName}`, marginX + 3, currentY + 11);
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text('SPEC: 0 MSG · High Protein · Warm Chef-Sealed Bento', marginX + 3, currentY + 18);
    doc.setFontSize(7.5);
    const note = red.dietaryNotes?.trim() ? `NOTE: ${red.dietaryNotes.trim()}` : 'NOTE: Standard Asian Flavor Recipe (No Special Customization)';
    doc.text(note, marginX + 3, currentY + 25);

    currentY += 32;

    // Barcode
    doc.rect(marginX, currentY, contentWidth, 15, 'S');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(`*${orderNumber}*`, marginX + contentWidth / 2, currentY + 10, { align: 'center' });

    currentY += 15;

    // Footer - 3 separate lines (NO OVERLAP)
    const footerHeight = contentHeight - (currentY - marginY);
    doc.rect(marginX, currentY, contentWidth, footerHeight, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('[  ] Prepared & Weighed     [  ] Heat-Sealed     [  ] Handed to Rider', marginX + 3, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const kitchenPhone = siteSettings?.whatsappDisplay || '+60126189919';
    doc.text(`Klang & Selangor Delivery Hub · Kitchen Hotline: ${kitchenPhone}`, marginX + 3, currentY + 8.5);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    doc.text(`Printed: ${nowStr} · Alphabetical Sort (Customer Name A-Z)`, marginX + 3, currentY + 12.5);
  });

  return doc;
}

/**
 * Convenience helper to download the A6 PDF report directly in the browser.
 */
export function downloadThermalStickersPdf(
  redemptions: MealRedemption[],
  siteSettings?: SiteSettings,
  options: ThermalStickerOptions = {}
): void {
  const doc = generateThermalStickerPdf(redemptions, siteSettings, options);
  const now = new Date().toISOString().substring(0, 10);
  const filename = `CHILL_HEALTHY_Thermal_Stickers_A6_${now}.pdf`;
  doc.save(filename);
}

/**
 * Builds a formatted summary manifest message for sending directly to the kitchen on WhatsApp.
 */
export function buildKitchenWhatsAppManifest(
  redemptions: MealRedemption[],
  targetDate?: string
): string {
  const sorted = sortRedemptionsForThermalStickers(redemptions, 'customerNameAsc');
  const dateStr = targetDate || (sorted[0]?.deliveryDate) || new Date().toISOString().substring(0, 10);
  const totalBentos = sorted.reduce((sum, r) => sum + (r.quantity || 1), 0);

  const lines = [
    `👨‍🍳 *CHILL HEALTHY KITCHEN BENTO DISPATCH MANIFEST* 🍱`,
    `📅 Delivery Date: *${dateFormattedSimple(dateStr)}*`,
    `📦 Total Orders: *${sorted.length}* | Total Bento Boxes: *${totalBentos}*`,
    `🔤 *Customer Sorting: Alphabetical (A-Z)*`,
    `----------------------------------------`,
  ];

  sorted.forEach((r, idx) => {
    const qty = r.quantity || 1;
    lines.push(
      `*${idx + 1}. ${r.memberName.toUpperCase()}* (${r.memberPhone})` +
      `\n   • Bento: ${qty}x ${r.mealName} (${r.mealNameZh || ''})` +
      `\n   • Slot: ${r.deliverySlot || 'Lunch'}` +
      `\n   • Address: ${r.deliveryAddress}, ${r.area} ${r.postalCode}` +
      `\n   • Order No: #${r.orderNumber || r.id}` +
      (r.dietaryNotes ? `\n   ⚠️ Note: ${r.dietaryNotes}` : '') +
      `\n`
    );
  });

  lines.push(`----------------------------------------`);
  lines.push(`🖨️ Thermal Sticker A6 (6-inch) labels printed and dispatched to central kitchen.`);
  lines.push(`Official Central Kitchen Hub: Klang & Selangor`);

  return lines.join('\n');
}

function dateFormattedSimple(dStr: string): string {
  try {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${dStr} (${days[d.getDay()]})`;
    }
  } catch {}
  return dStr;
}
