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
 * e.g., "2026-10-09 (Friday)"
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
 * Draws a simulated Code128-style barcode in vector lines.
 */
function drawBarcode(doc: jsPDF, x: number, y: number, width: number, height: number, text: string) {
  // Deterministic pattern from text
  const clean = text.replace(/[^A-Za-z0-9]/g, '');
  let cursor = x;
  const barCount = 38;
  const unitWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const charCode = clean.charCodeAt(i % clean.length) || 65;
    const isThick = (charCode + i) % 3 === 0;
    const isSpace = (charCode + i) % 5 === 0;

    if (!isSpace) {
      doc.setLineWidth(isThick ? unitWidth * 1.5 : unitWidth * 0.8);
      doc.line(cursor, y, cursor, y + height);
    }
    cursor += unitWidth;
  }
}

/**
 * Generates an official, kitchen-grade thermal printer A6 / 6-inch sticker PDF report.
 * Each order is formatted as an independent sticker label (100mm x 150mm / 4"x6")
 * sorted alphabetically by customer name.
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

  sorted.forEach((red, index) => {
    if (index > 0) {
      doc.addPage([pageWidth, pageHeight], 'portrait');
    }

    const marginX = 4;
    const marginY = 4;
    const contentWidth = pageWidth - marginX * 2; // e.g. 92mm
    const contentHeight = pageHeight - marginY * 2; // e.g. 142mm

    // 1. Outer Sticker Boundary (High-contrast thermal frame)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.7);
    doc.rect(marginX, marginY, contentWidth, contentHeight);

    // 2. Header Banner
    doc.setFillColor(24, 24, 27); // dark fill
    doc.rect(marginX, marginY, contentWidth, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CHILL HEALTHY', marginX + 3, marginY + 6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CENTRAL KITCHEN BENTO DISPATCH', marginX + 3, marginY + 11);

    // Label Sequence & Type Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const seqText = `#${index + 1} OF ${sorted.length}`;
    doc.text(seqText, marginX + contentWidth - 3, marginY + 6.5, { align: 'right' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    const orderTypeLabel = (red.orderType || 'MEAL PLAN').toUpperCase();
    doc.text(orderTypeLabel, marginX + contentWidth - 3, marginY + 11, { align: 'right' });

    let currentY = marginY + 14;

    // 3. Customer Box (PRIMARY SORTED IDENTIFIER - LARGE BOLD TEXT)
    doc.setFillColor(245, 245, 244);
    doc.rect(marginX, currentY, contentWidth, 23, 'F');
    doc.setLineWidth(0.4);
    doc.rect(marginX, currentY, contentWidth, 23, 'S');

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('CUSTOMER NAME (SORTED A-Z):', marginX + 3, currentY + 4.5);

    // Customer Name (Extra-bold 15pt)
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    const customerName = (red.memberName || 'Customer').trim();
    const truncatedName = doc.splitTextToSize(customerName, contentWidth - 6);
    doc.text(truncatedName[0] || customerName, marginX + 3, currentY + 11.5);

    // Phone & Order No Row
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TEL: ${red.memberPhone}`, marginX + 3, currentY + 18.5);

    const orderNumber = red.orderNumber || red.id;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORDER #${orderNumber}`, marginX + contentWidth - 3, currentY + 18.5, { align: 'right' });

    currentY += 23;

    // 4. Delivery Schedule & Time Slot Bar
    doc.setFillColor(235, 235, 235);
    doc.rect(marginX, currentY, contentWidth, 11, 'F');
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, contentWidth, 11, 'S');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const dateFormatted = formatDateWithDay(red.deliveryDate);
    doc.text(`DATE: ${dateFormatted}`, marginX + 3, currentY + 4.5);

    const slotText = (red.deliverySlot || 'LUNCH (10:00 AM – 2:00 PM)').toUpperCase();
    doc.text(`SLOT: ${slotText}`, marginX + 3, currentY + 9);

    const statusBadge = (red.status || 'CONFIRMED').toUpperCase();
    doc.setFontSize(7.5);
    doc.text(`[ ${statusBadge} ]`, marginX + contentWidth - 3, currentY + 7, { align: 'right' });

    currentY += 11;

    // 5. Complete Delivery Address Box
    const addressBoxHeight = 27;
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, contentWidth, addressBoxHeight, 'S');

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('DELIVERY ADDRESS & LOCATION:', marginX + 3, currentY + 4.5);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    const fullAddress = `${red.deliveryAddress || ''}`.trim();
    const addressLines = doc.splitTextToSize(fullAddress, contentWidth - 6);
    let addrY = currentY + 9;
    addressLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, marginX + 3, addrY);
      addrY += 4.2;
    });

    // Area & Postal Code
    const areaLine = `${red.area || 'Klang Valley'}, ${red.postalCode || ''}`.trim();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`AREA: ${areaLine}`, marginX + 3, currentY + 23);

    currentY += addressBoxHeight;

    // 6. Bento Meal Prep Section (Kitchen Specs)
    const mealBoxHeight = 31;
    doc.setFillColor(250, 250, 250);
    doc.rect(marginX, currentY, contentWidth, mealBoxHeight, 'F');
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, contentWidth, mealBoxHeight, 'S');

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('BENTO ITEM & KITCHEN PREPARATION:', marginX + 3, currentY + 4.5);

    // Qty and Main Dish Name
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const qty = red.quantity || 1;
    const mealTitle = `${qty}x  ${red.mealName}`;
    const mealLines = doc.splitTextToSize(mealTitle, contentWidth - 6);
    doc.text(mealLines[0] || mealTitle, marginX + 3, currentY + 10.5);

    // Chinese Dish Name if available
    if (red.mealNameZh) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`(${red.mealNameZh})`, marginX + 3, currentY + 15.5);
    }

    // Nutrition & Quality Guarantee Tags
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text('SPEC: 0 MSG · High Protein · Warm Chef-Sealed Bento', marginX + 3, currentY + 20.5);

    // Dietary Notes / Remarks
    if (red.dietaryNotes && red.dietaryNotes.trim()) {
      doc.setTextColor(180, 0, 0); // noticeable red/dark note
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const noteText = `NOTE: ${red.dietaryNotes.trim()}`;
      const noteLines = doc.splitTextToSize(noteText, contentWidth - 6);
      doc.text(noteLines[0], marginX + 3, currentY + 26);
    } else {
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('NOTE: Standard Asian Flavor Recipe (No Special Customization)', marginX + 3, currentY + 26);
    }

    currentY += mealBoxHeight;

    // 7. Barcode & Tracking Key
    const barcodeBoxHeight = 16;
    doc.setLineWidth(0.2);
    doc.rect(marginX, currentY, contentWidth, barcodeBoxHeight, 'S');

    // Draw barcode in center
    doc.setTextColor(0, 0, 0);
    drawBarcode(doc, marginX + 12, currentY + 2, contentWidth - 24, 7, orderNumber);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(`*${orderNumber}*`, marginX + contentWidth / 2, currentY + 13.5, { align: 'center' });

    currentY += barcodeBoxHeight;

    // 8. Kitchen Packing Verification Checklist & Footer
    const footerHeight = contentHeight - (currentY - marginY);
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, contentWidth, footerHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(0, 0, 0);
    doc.text('[  ] Prepared & Weighed     [  ] Heat-Sealed     [  ] Handed to Rider', marginX + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(90, 90, 90);
    const kitchenPhone = siteSettings?.whatsappDisplay || '+60126189919';
    doc.text(`Klang & Selangor Delivery Hub · Kitchen Hotline: ${kitchenPhone}`, marginX + 3, currentY + 9.5);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    doc.text(`Printed: ${nowStr} · Alphabetical Sort (Customer Name A-Z)`, marginX + contentWidth - 3, currentY + 9.5, {
      align: 'right',
    });
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

  return encodeURIComponent(lines.join('\n'));
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
