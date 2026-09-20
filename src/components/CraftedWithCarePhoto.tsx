import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Language } from '../types';

interface CraftedWithCarePhotoProps {
  language: Language;
}

const DEFAULT_FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80';

export const CraftedWithCarePhoto: React.FC<CraftedWithCarePhotoProps> = ({ language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoSrc, setPhotoSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_crafted_photo');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '/agnes-kitchen.jpg';
  });

  const [hasCustomPhoto, setHasCustomPhoto] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('chillhealthy_crafted_photo'));
    } catch {
      return false;
    }
  });

  // Test loading /agnes-kitchen.jpg or fallback
  const handleImageError = () => {
    if (photoSrc === '/agnes-kitchen.jpg') {
      setPhotoSrc('/WhatsApp Image 2026-09-19 at 20.03.24.jpeg');
    } else if (photoSrc === '/WhatsApp Image 2026-09-19 at 20.03.24.jpeg') {
      setPhotoSrc(DEFAULT_FALLBACK_PHOTO);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoSrc(result);
        setHasCustomPhoto(true);
        try {
          localStorage.setItem('chillhealthy_crafted_photo', result);
        } catch {
          // ignore localStorage quote limit
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('chillhealthy_crafted_photo');
    } catch {
      // ignore
    }
    setHasCustomPhoto(false);
    setPhotoSrc('/agnes-kitchen.jpg');
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white group">
      {/* Hidden File Input for uploading photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Main Image */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden bg-stone-100">
        <img
          src={photoSrc}
          onError={handleImageError}
          alt="Crafted with Care - CHILL Healthy kitchen culinary preparation"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Apron Patch: Seamlessly blurs & covers the red TOSHIBA word on the white apron */}
        <div
          className="absolute pointer-events-none rounded-full blur-[0.6px] transition-opacity duration-300"
          style={{
            top: '61.5%',
            left: '53.5%',
            transform: 'translate(-50%, -50%)',
            width: '26%',
            height: '5.8%',
            background:
              'radial-gradient(ellipse at center, #f5f5f5 0%, #ebebeb 70%, rgba(230, 230, 230, 0.95) 100%)',
            boxShadow: '0 0 8px 3px rgba(235, 235, 235, 0.9)',
          }}
          aria-hidden="true"
        />

        {/* Gradient overlay with text */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/25 to-transparent flex flex-col justify-end p-6 text-white pointer-events-none">
          {/* User Request: Remain the word, and delete the word Agnes Lim in the kitchen */}
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            {language === 'en' ? 'Crafted with Care · Klang Kitchen' : '源自巴生 · 匠心手作健康餐'}
          </span>
          <p className="text-xs text-stone-200 mt-1 leading-relaxed">
            {language === 'en'
              ? 'Preparing healthy food daily with farm-fresh produce and artisanal culinary passion.'
              : '每日亲手料理健康便当，严选天然食材，用心呈现。'}
          </p>
        </div>
      </div>

      {/* Subtle Upload / Replace Photo Control in top-right corner */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
        {hasCustomPhoto && (
          <button
            onClick={handleReset}
            title={language === 'en' ? 'Reset to default' : '恢复默认图片'}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          title={language === 'en' ? 'Upload / Replace Kitchen Photo' : '上传/更换厨房实拍照片'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 text-white text-[11px] font-medium backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Upload Photo' : '上传照片'}</span>
        </button>
      </div>
    </div>
  );
};
