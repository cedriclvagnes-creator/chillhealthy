import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface CraftedWithCarePhotoProps {
  language: Language;
  photoUrl?: string;
}

const DEFAULT_FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80';

export const CraftedWithCarePhoto: React.FC<CraftedWithCarePhotoProps> = ({ language, photoUrl }) => {
  const [photoSrc, setPhotoSrc] = useState<string>(() => {
    if (photoUrl) return photoUrl;
    try {
      const saved = localStorage.getItem('chillhealthy_crafted_photo');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '/agnes-kitchen.jpg';
  });

  // Sync when prop updates (e.g. edited from Back Office)
  useEffect(() => {
    if (photoUrl) {
      setPhotoSrc(photoUrl);
    }
  }, [photoUrl]);

  // Fallback image handlers
  const handleImageError = () => {
    if (photoSrc === '/agnes-kitchen.jpg') {
      setPhotoSrc('/WhatsApp Image 2026-09-19 at 20.03.24.jpeg');
    } else if (photoSrc === '/WhatsApp Image 2026-09-19 at 20.03.24.jpeg') {
      setPhotoSrc(DEFAULT_FALLBACK_PHOTO);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white group">
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
    </div>
  );
};
