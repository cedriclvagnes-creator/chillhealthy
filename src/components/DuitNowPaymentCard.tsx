import React from 'react';
import { CheckCircle2, MessageCircle, ExternalLink, QrCode, AlertTriangle, Upload } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface DuitNowPaymentCardProps {
  language: Language;
  amount?: number;
  orderId?: string;
  whatsappNumber?: string;
  siteSettings?: SiteSettings;
  onUpdateQrImage?: (imageUrl: string | null) => void;
  onTriggerUploadClick?: () => void;
}

export const DuitNowPaymentCard: React.FC<DuitNowPaymentCardProps> = ({
  language,
  amount,
  orderId,
  whatsappNumber = '0126189919',
  siteSettings,
  onTriggerUploadClick,
}) => {
  const customQrFromStorage =
    typeof window !== 'undefined' ? localStorage.getItem('chillhealthy_duitnow_qr_custom') : null;

  const rawQr = siteSettings?.paymentQrUrl || customQrFromStorage || '';
  const effectiveQr = rawQr && rawQr !== '/duitnow-qr-chillhealthy.svg' ? rawQr : '';

  const qrMargin = typeof siteSettings?.paymentQrMargin === 'number' ? siteSettings.paymentQrMargin : 4;
  const qrScale = typeof siteSettings?.paymentQrScale === 'number' ? siteSettings.paymentQrScale : 100;

  const paymentWhatsappMessage =
    `*Chill Healthy Trading - QR Payment Receipt*\n` +
    (orderId ? `Order ID: ${orderId}\n` : '') +
    (amount ? `Amount Paid: RM ${amount.toFixed(2)}\n` : '') +
    `I have completed payment via QR scan.\n` +
    `Attached is my payment transfer receipt screenshot. Please confirm my order! ❤️`;

  const paymentWhatsappUrl = buildWhatsAppUrl(whatsappNumber, paymentWhatsappMessage);

  return (
    <div className="bg-white rounded-3xl border-2 border-pink-600/80 shadow-xl overflow-hidden w-full max-w-sm mx-auto p-4 sm:p-5 relative text-stone-900">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 inline-flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'QR Scan Payment' : '二维码扫码付款'}</span>
        </span>
        {amount !== undefined && amount > 0 && (
          <span className="text-xs font-extrabold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
            RM {amount.toFixed(2)}
          </span>
        )}
      </div>

      {/* Clean QR Column Only (Displays exact photo attached in Back Office across Website, Mobile & Tablet) */}
      <div
        onClick={onTriggerUploadClick}
        className={`rounded-2xl border-2 ${
          effectiveQr ? 'border-stone-200 bg-white' : 'border-dashed border-pink-300 bg-pink-50/40'
        } overflow-hidden shadow-xs flex flex-col items-center justify-center transition-all ${
          onTriggerUploadClick ? 'cursor-pointer hover:border-pink-500' : ''
        }`}
        style={{ padding: `${qrMargin}px` }}
      >
        {effectiveQr ? (
          <div className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-white">
            <img
              src={effectiveQr}
              alt="Payment QR Code"
              className="w-full h-auto max-h-[420px] object-contain mx-auto block transition-transform"
              style={{
                transform: `scale(${qrScale / 100})`,
                transformOrigin: 'center',
              }}
            />
          </div>
        ) : (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-2xs">
              {onTriggerUploadClick ? <Upload className="w-7 h-7" /> : <QrCode className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-stone-800">
                {onTriggerUploadClick
                  ? language === 'en'
                    ? 'Click Here to Attach Your QR Photo'
                    : '点击此处上传并附加您的收款二维码照片'
                  : language === 'en'
                  ? 'Payment QR Code Column'
                  : '结账收款二维码栏'}
              </p>
              <p className="text-[11px] text-stone-500 max-w-[230px] mx-auto leading-snug">
                {language === 'en'
                  ? 'Attach your QR photo in Back Office Settings and click Synchronize to display across Website, Mobile & Tablet.'
                  : '请在后台管理上传您的收款二维码照片并点击同步，即可在电脑网页、手机与平板全面显示。'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notice: 0126189919 has NO DuitNow phone transfer function */}
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
            ? 'Please directly SCAN the QR code above using your banking app or eWallet. Do NOT transfer via DuitNow phone number to 0126189919.'
            : '请直接使用银行 App 或电子钱包扫描上方二维码付款。请勿输入手机号码 0126189919 进行转账。'}
        </p>
      </div>

      {/* After payment WhatsApp receipt */}
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
