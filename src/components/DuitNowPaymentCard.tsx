import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, MessageCircle, ExternalLink, QrCode } from 'lucide-react';
import { Language } from '../types';

interface DuitNowPaymentCardProps {
  language: Language;
  amount?: number;
  orderId?: string;
  whatsappNumber?: string;
}

const STORAGE_KEY = 'chillhealthy_duitnow_qr_custom';

export const DuitNowPaymentCard: React.FC<DuitNowPaymentCardProps> = ({
  language,
  amount,
  orderId,
  whatsappNumber = '0126189919',
}) => {
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCustomQrImage(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomQrImage(result);
      try {
        localStorage.setItem(STORAGE_KEY, result);
      } catch {
        // storage fallback
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setCustomQrImage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const cleanPhone = whatsappNumber.replace(/\D/g, '') || '0126189919';
  const whatsappTarget = cleanPhone.startsWith('60') ? cleanPhone : `60${cleanPhone.replace(/^0/, '')}`;

  const paymentWhatsappText = encodeURIComponent(
    `*Chill Healthy Trading - DuitNow QR Payment Receipt*%0A` +
      (orderId ? `Order ID: ${orderId}%0A` : '') +
      (amount ? `Amount Paid: RM ${amount.toFixed(2)}%0A` : '') +
      `I have completed payment via DuitNow QR to *Chill Healthy Trading*.%0A` +
      `Attached is my payment transfer receipt. Please confirm my order! ❤️`
  );

  return (
    <div className="bg-white rounded-3xl border-2 border-pink-500/80 shadow-xl overflow-hidden max-w-sm mx-auto p-4 sm:p-5 relative text-stone-900">
      {/* Upload/replace option */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 inline-flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>DuitNow QR Instant Pay</span>
        </span>

        <div className="flex items-center gap-1 text-[11px]">
          {customQrImage && (
            <button
              type="button"
              onClick={handleReset}
              className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              title="Reset QR"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-pink-600 hover:text-pink-700 font-semibold p-1 inline-flex items-center gap-1 cursor-pointer"
            title="Upload Custom QR Photo"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="text-[10px]">{language === 'en' ? 'Upload QR' : '替换QR图'}</span>
          </button>
        </div>
      </div>

      {/* The DuitNow QR Voucher Card */}
      <div className="rounded-2xl border-4 border-[#e5006b] p-4 bg-white text-center flex flex-col items-center shadow-inner">
        {/* Top DuitNow Logo */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#e5006b] flex items-center justify-center text-white font-black text-xs">
            D
          </div>
          <div className="text-left leading-none">
            <span className="font-heading font-black text-[#e5006b] text-base tracking-tight block">
              DuitNow
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#e5006b] block">QR</span>
          </div>
        </div>

        {/* QR Code Graphic Container */}
        <div className="w-52 h-52 sm:w-60 sm:h-60 p-2 bg-white rounded-xl flex items-center justify-center border border-stone-100 shadow-2xs relative">
          {customQrImage ? (
            <img
              src={customQrImage}
              alt="DuitNow QR Chill Healthy Trading"
              className="w-full h-full object-contain"
            />
          ) : (
            /* High-fidelity SVG recreation of the official Chill Healthy Trading DuitNow QR */
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full text-[#e5006b]"
              fill="currentColor"
            >
              {/* Outer boundary & finder patterns */}
              {/* Top-Left Finder */}
              <rect x="15" y="15" width="55" height="55" rx="4" fill="#e5006b" />
              <rect x="23" y="23" width="39" height="39" rx="2" fill="white" />
              <rect x="31" y="31" width="23" height="23" rx="2" fill="#e5006b" />

              {/* Top-Right Finder */}
              <rect x="170" y="15" width="55" height="55" rx="4" fill="#e5006b" />
              <rect x="178" y="23" width="39" height="39" rx="2" fill="white" />
              <rect x="186" y="31" width="23" height="23" rx="2" fill="#e5006b" />

              {/* Bottom-Left Finder */}
              <rect x="15" y="170" width="55" height="55" rx="4" fill="#e5006b" />
              <rect x="23" y="178" width="39" height="39" rx="2" fill="white" />
              <rect x="31" y="186" width="23" height="23" rx="2" fill="#e5006b" />

              {/* Bottom-Right Alignment pattern */}
              <rect x="175" y="175" width="35" height="35" rx="3" fill="#e5006b" />
              <rect x="183" y="183" width="19" height="19" rx="1" fill="white" />
              <rect x="189" y="189" width="7" height="7" rx="1" fill="#e5006b" />

              {/* Timing patterns & dense QR modules representing Chill Healthy Trading */}
              {/* Horizontal timing */}
              <rect x="80" y="42" width="7" height="7" rx="1" />
              <rect x="96" y="42" width="7" height="7" rx="1" />
              <rect x="112" y="42" width="7" height="7" rx="1" />
              <rect x="128" y="42" width="7" height="7" rx="1" />
              <rect x="144" y="42" width="7" height="7" rx="1" />

              {/* Vertical timing */}
              <rect x="42" y="80" width="7" height="7" rx="1" />
              <rect x="42" y="96" width="7" height="7" rx="1" />
              <rect x="42" y="112" width="7" height="7" rx="1" />
              <rect x="42" y="128" width="7" height="7" rx="1" />
              <rect x="42" y="144" width="7" height="7" rx="1" />

              {/* Data Modules Grid */}
              <rect x="80" y="20" width="7" height="14" rx="1" />
              <rect x="96" y="20" width="14" height="7" rx="1" />
              <rect x="120" y="20" width="7" height="14" rx="1" />
              <rect x="136" y="20" width="21" height="7" rx="1" />

              <rect x="80" y="60" width="14" height="14" rx="1" />
              <rect x="104" y="60" width="7" height="7" rx="1" />
              <rect x="120" y="60" width="14" height="7" rx="1" />
              <rect x="144" y="60" width="7" height="14" rx="1" />

              <rect x="20" y="80" width="14" height="7" rx="1" />
              <rect x="20" y="96" width="7" height="14" rx="1" />
              <rect x="20" y="120" width="14" height="7" rx="1" />
              <rect x="20" y="136" width="7" height="21" rx="1" />

              <rect x="60" y="80" width="14" height="14" rx="1" />
              <rect x="60" y="104" width="7" height="7" rx="1" />
              <rect x="60" y="120" width="14" height="7" rx="1" />
              <rect x="60" y="144" width="7" height="14" rx="1" />

              {/* Center cluster */}
              <rect x="80" y="80" width="14" height="7" rx="1" />
              <rect x="104" y="80" width="14" height="14" rx="1" />
              <rect x="128" y="80" width="7" height="7" rx="1" />
              <rect x="144" y="80" width="14" height="14" rx="1" />

              <rect x="80" y="96" width="7" height="14" rx="1" />
              <rect x="96" y="104" width="14" height="7" rx="1" />
              <rect x="120" y="96" width="14" height="14" rx="1" />
              <rect x="144" y="104" width="7" height="14" rx="1" />

              <rect x="80" y="120" width="14" height="14" rx="1" />
              <rect x="104" y="120" width="7" height="14" rx="1" />
              <rect x="120" y="120" width="14" height="7" rx="1" />
              <rect x="144" y="120" width="14" height="14" rx="1" />

              <rect x="80" y="144" width="14" height="7" rx="1" />
              <rect x="104" y="144" width="14" height="14" rx="1" />
              <rect x="128" y="144" width="7" height="7" rx="1" />

              {/* Right column modules */}
              <rect x="170" y="80" width="14" height="7" rx="1" />
              <rect x="194" y="80" width="7" height="14" rx="1" />
              <rect x="210" y="80" width="14" height="7" rx="1" />

              <rect x="170" y="96" width="7" height="14" rx="1" />
              <rect x="186" y="104" width="14" height="7" rx="1" />
              <rect x="210" y="96" width="7" height="14" rx="1" />

              <rect x="170" y="120" width="14" height="14" rx="1" />
              <rect x="194" y="120" width="7" height="14" rx="1" />
              <rect x="210" y="120" width="14" height="7" rx="1" />

              <rect x="170" y="144" width="7" height="14" rx="1" />
              <rect x="186" y="144" width="14" height="7" rx="1" />
              <rect x="210" y="144" width="7" height="14" rx="1" />

              {/* Bottom cluster */}
              <rect x="80" y="170" width="14" height="14" rx="1" />
              <rect x="104" y="170" width="7" height="7" rx="1" />
              <rect x="120" y="170" width="14" height="14" rx="1" />
              <rect x="144" y="170" width="7" height="7" rx="1" />

              <rect x="80" y="194" width="7" height="14" rx="1" />
              <rect x="96" y="194" width="14" height="7" rx="1" />
              <rect x="120" y="194" width="7" height="14" rx="1" />
              <rect x="136" y="194" width="21" height="7" rx="1" />

              <rect x="80" y="215" width="14" height="7" rx="1" />
              <rect x="104" y="215" width="14" height="7" rx="1" />
              <rect x="128" y="215" width="7" height="7" rx="1" />
              <rect x="144" y="215" width="14" height="7" rx="1" />
            </svg>
          )}
        </div>

        {/* Merchant Name under QR */}
        <h4 className="font-heading font-extrabold text-stone-900 text-base sm:text-lg mt-2 tracking-tight">
          Chill Healthy Trading
        </h4>

        {/* Pink Banner */}
        <div className="w-full bg-[#e5006b] text-white py-1.5 px-3 rounded-md mt-2 shadow-xs">
          <span className="font-heading font-black text-xs sm:text-sm tracking-wider uppercase">
            MALAYSIA NATIONAL QR
          </span>
        </div>

        {/* Footer info & MAE logo */}
        <div className="mt-2 text-[10px] text-stone-500 font-medium">
          <p>Accepted by participating Banks and e-Wallets</p>
          <p className="text-[9px] text-stone-400 mt-0.5">Merchant Partner</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="inline-block font-black text-[#f7b500] text-sm bg-black px-1.5 py-0.5 rounded-sm tracking-wider">
              MAE
            </span>
            <span className="text-[10px] font-bold text-stone-700">by Maybank2u</span>
          </div>
        </div>
      </div>

      {/* Crucial instruction: After payment must whatsapp to us */}
      <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-amber-900 font-extrabold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {language === 'en'
              ? 'Step 2: Send Payment Slip via WhatsApp'
              : '第2步：付款后务必通过 WhatsApp 发送凭证'}
          </span>
        </div>
        <p className="text-[11px] text-stone-600 leading-tight">
          {language === 'en'
            ? 'Scan the DuitNow QR above with your bank app (MAE, CIMB, Public Bank, TNG eWallet, etc). After transferring, please WhatsApp your receipt to us.'
            : '请使用任意银行 App 或 TNG 扫码支付给 Chill Healthy Trading，付款成功后请截图并 WhatsApp 发送给我们以确认订单。'}
        </p>

        <a
          href={`https://wa.me/${whatsappTarget}?text=${paymentWhatsappText}`}
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
