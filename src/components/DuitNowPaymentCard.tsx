import React from 'react';
import { CheckCircle2, MessageCircle, ExternalLink, QrCode, AlertTriangle } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface DuitNowPaymentCardProps {
  language: Language;
  amount?: number;
  orderId?: string;
  whatsappNumber?: string;
  siteSettings?: SiteSettings;
  onUpdateQrImage?: (imageUrl: string | null) => void;
}

export const DuitNowPaymentCard: React.FC<DuitNowPaymentCardProps> = ({
  language,
  amount,
  orderId,
  whatsappNumber = '0126189919',
  siteSettings,
}) => {
  const merchantName = (siteSettings?.paymentMerchantName || 'CHILL HEALTHY TRADING').toUpperCase();
  // Note: 0126189919 does NOT have DuitNow phone transfer function. Never use it as a fallback DuitNow ID!
  const customDuitNowId = siteSettings?.paymentDuitNowId && siteSettings.paymentDuitNowId !== '0126189919'
    ? siteSettings.paymentDuitNowId
    : '';

  const customQrFromStorage =
    typeof window !== 'undefined' ? localStorage.getItem('chillhealthy_duitnow_qr_custom') : null;
  const effectiveQr =
    siteSettings?.paymentQrUrl || customQrFromStorage || '/duitnow-qr-chillhealthy.svg';
  const qrMargin = typeof siteSettings?.paymentQrMargin === 'number' ? siteSettings.paymentQrMargin : 6;
  const qrScale = typeof siteSettings?.paymentQrScale === 'number' ? siteSettings.paymentQrScale : 98;

  const paymentWhatsappMessage =
    `*Chill Healthy Trading - DuitNow QR Payment Receipt*\n` +
    (orderId ? `Order ID: ${orderId}\n` : '') +
    (amount ? `Amount Paid: RM ${amount.toFixed(2)}\n` : '') +
    `I have completed payment via DuitNow QR to *${merchantName}*.\n` +
    `Attached is my payment transfer receipt screenshot. Please confirm my order! ❤️`;

  const paymentWhatsappUrl = buildWhatsAppUrl(whatsappNumber, paymentWhatsappMessage);

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e5006b]/80 shadow-xl overflow-hidden max-w-sm mx-auto p-4 sm:p-5 relative text-stone-900">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 inline-flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>DuitNow QR Instant Pay</span>
        </span>
        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
          Official Merchant QR
        </span>
      </div>

      {/* Official DuitNow QR Standee Card (matching Duitnow.jpeg) */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-md">
        {/* Top Arch & Protruding DuitNow QR Logo Header */}
        <div className="pt-3 bg-white flex flex-col items-center relative">
          <div className="z-10 bg-white border-2 border-stone-200 rounded-2xl px-3.5 py-2 shadow-xs flex flex-col items-center justify-center -mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e5006b] flex items-center justify-center text-white font-black text-sm shadow-2xs">
              D
            </div>
            <span className="font-heading font-black text-[#e5006b] text-xs tracking-tight leading-none mt-1">
              DuitNow
            </span>
            <span className="font-heading font-black text-[#e5006b] text-[11px] tracking-wider leading-none mt-0.5">
              QR
            </span>
          </div>

          {/* Pink Standee Body (#e5006b) */}
          <div className="w-full bg-[#e5006b] rounded-t-[2.25rem] pt-8 pb-4 px-5 flex flex-col items-center shadow-inner">
            {/* White Rounded QR Container */}
            <div
              className="w-56 h-56 sm:w-64 sm:h-64 bg-white rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden"
              style={{ padding: `${qrMargin}px` }}
            >
              <img
                src={effectiveQr}
                alt={`DuitNow QR ${merchantName}`}
                className="w-full h-full object-contain transition-transform"
                style={{
                  transform: `scale(${qrScale / 100})`,
                  transformOrigin: 'center',
                }}
              />
            </div>

            {/* Merchant Name in Bold White Uppercase on Pink Background */}
            <h4 className="font-heading font-black text-white text-sm sm:text-base mt-3.5 tracking-wide uppercase text-center">
              {merchantName}
            </h4>
            {customDuitNowId && (
              <span className="text-[10px] font-mono font-semibold text-white/90 bg-black/15 px-2 py-0.5 rounded mt-1">
                DuitNow ID: {customDuitNowId}
              </span>
            )}
          </div>
        </div>

        {/* White Bottom Base: MALAYSIA NATIONAL QR & HLB Connect Merchant Partner */}
        <div className="bg-white px-4 pt-3 pb-3.5 text-center border-t border-stone-100">
          <div className="font-heading font-black text-stone-900 text-xs sm:text-sm tracking-wide uppercase">
            MALAYSIA NATIONAL QR
          </div>
          <p className="text-[11px] text-stone-700 font-medium mt-0.5">
            Accepted by participating Banks and e-Wallets
          </p>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold text-stone-700">Merchant Partner</span>
            <div className="inline-flex items-center gap-0.5 font-heading">
              <span className="font-black text-sm tracking-tight text-[#002d62]">H</span>
              <span className="font-black text-sm tracking-tight text-[#d91c24]">L</span>
              <span className="font-black text-sm tracking-tight text-[#002d62]">B</span>
              <span className="font-bold text-sm tracking-tight text-[#002d62] ml-0.5">Connect</span>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL DUITNOW NOTICE: 0126189919 has NO DuitNow function */}
      <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-stone-900 space-y-1.5 text-left">
        <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'en'
              ? 'Notice: 0126189919 does NOT support DuitNow phone transfer'
              : '重要提示：0126189919 无 DuitNow 手机号转账功能'}
          </span>
        </div>
        <p className="text-[11px] text-stone-700 leading-snug">
          {language === 'en'
            ? 'Please directly SCAN the DuitNow QR above using your banking app (MAE, CIMB, TNG, Public Bank, etc.). Do NOT attempt to transfer via DuitNow using phone number 0126189919.'
            : '请务必直接使用银行 App (MAE/CIMB/TNG/Public Bank等) 扫描上方 DuitNow QR 收款码付款。请勿输入手机号码 0126189919 进行 DuitNow 转账。'}
        </p>
      </div>

      {/* Crucial instruction: After payment must whatsapp receipt */}
      <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-stone-800 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-emerald-900 font-extrabold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {language === 'en'
              ? 'Send Payment Slip via WhatsApp'
              : '付款后请通过 WhatsApp 发送凭证'}
          </span>
        </div>
        <p className="text-[11px] text-stone-600 leading-tight">
          {language === 'en'
            ? 'After completing your transfer, please WhatsApp your payment screenshot to CHILL Healthy to verify your order!'
            : '转账成功后，请将付款凭证截图发至 WhatsApp，我们将第一时间为您确认并安排配送！'}
        </p>

        <a
          href={paymentWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {language === 'en'
              ? `WhatsApp Payment Slip to +60126189919`
              : `WhatsApp 发送付款水单 (+60126189919)`}
          </span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>
      </div>
    </div>
  );
};
