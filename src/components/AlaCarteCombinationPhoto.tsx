import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Upload, Grid2X2, Image as ImageIcon, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';

interface AlaCarteCombinationPhotoProps {
  language: Language;
  onExploreMenu?: () => void;
}

const STORAGE_KEY = 'chillhealthy_hero_combo_photo';

const ALA_CARTE_ITEMS = [
  {
    id: 'combo-salmon-chicken',
    name: 'Combo Salmon & Chicken',
    nameZh: '三文鱼与鸡肉双拼',
    image: 'https://admin.chillhealthy.com/uploads/h2ia7y6vd60ogckg84.jpg',
    tag: '52g Protein',
  },
  {
    id: 'chi-kut-teh',
    name: 'Chi Kut Teh',
    nameZh: '潮式清补鸡骨茶',
    image: 'https://admin.chillhealthy.com/uploads/d1j2uwbv4mgowsccow.jpg',
    tag: 'Herbal Broth',
  },
  {
    id: 'prawn-omelette',
    name: 'Golden Prawn Omelette',
    nameZh: '金黄虾仁烘蛋',
    image: 'https://admin.chillhealthy.com/uploads/y92l27dzynko4kock.jpg',
    tag: 'Wild Sea Prawns',
  },
  {
    id: 'garlic-chicken',
    name: 'Golden Garlic Chicken',
    nameZh: '金蒜香烤鸡胸',
    image: 'https://admin.chillhealthy.com/uploads/1uijdxelztq8w0s80o.jpg',
    tag: 'Lean & Juicy',
  },
];

const SPREAD_PHOTO = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80';

export const AlaCarteCombinationPhoto: React.FC<AlaCarteCombinationPhotoProps> = ({
  language,
  onExploreMenu,
}) => {
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'spread'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomPhoto(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomPhoto(dataUrl);
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl);
      } catch {
        // quota exceeded fallback
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setCustomPhoto(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-900 group">
      {/* Hidden file input for custom photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top action controls bar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20 shadow-md">
        {customPhoto ? (
          <button
            onClick={handleResetPhoto}
            title={language === 'en' ? 'Reset to combination photo' : '还原组合照片'}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-white px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>{language === 'en' ? 'Reset' : '还原'}</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => setViewMode('grid')}
              title={language === 'en' ? '4-Dish Ala Carte Grid' : '四款单点组合拼图'}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid2X2 className="w-3 h-3" />
              <span>{language === 'en' ? 'Grid' : '拼图'}</span>
            </button>
            <button
              onClick={() => setViewMode('spread')}
              title={language === 'en' ? 'Table Spread Photo' : '餐桌全景组合'}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'spread'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>{language === 'en' ? 'Spread' : '全景'}</span>
            </button>
          </>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          title={language === 'en' ? 'Upload Custom Ala Carte Photo' : '上传自定义单点组合照'}
          className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer border-l border-white/20 ml-0.5"
        >
          <Camera className="w-3 h-3" />
          <span className="hidden sm:inline">{language === 'en' ? 'Upload' : '上传'}</span>
        </button>
      </div>

      {/* Main Image Container */}
      <div className="w-full h-84 sm:h-96 relative overflow-hidden">
        {customPhoto ? (
          <img
            src={customPhoto}
            alt="CHILL Healthy Ala Carte Combination"
            className="w-full h-full object-cover"
          />
        ) : viewMode === 'spread' ? (
          <img
            src={SPREAD_PHOTO}
            alt="CHILL Healthy Ala Carte Spread"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        ) : (
          /* 2x2 Grid of authentic official ala carte meals */
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-stone-900">
            {ALA_CARTE_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className="relative w-full h-full overflow-hidden group/item bg-stone-800"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                />
                {/* Subtle dish badge */}
                <div className="absolute top-2 left-2 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-white/90 border border-white/15">
                    {language === 'en' ? item.name : item.nameZh}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gradient overlay with text information */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white z-20">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {language === 'en' ? '★ Signature Ala Carte Selection' : '★ 潮轻食精选单点组合'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
              {language === 'en' ? '24 Fresh Choices' : '24款单点现做'}
            </span>
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {language === 'en' ? 'Combination of Ala Carte Meals' : '潮轻食精选单点健康餐组合'}
          </h3>

          <p className="text-xs text-stone-200 mt-1 line-clamp-2 leading-relaxed">
            {language === 'en'
              ? '24 handcrafted clean dining options: pan-seared Norwegian salmon, grilled chicken breast, wild sea prawns & slow-simmered herbal broths.'
              : '严选24款官方单点轻食：深海三文鱼、低脂嫩烤鸡胸、野生海虾仁与养生药膳清炖，少油低钠，营养黄金配比。'}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-emerald-500/30 border border-emerald-400/30 px-2 py-0.5 rounded-md text-emerald-200 font-bold">
                340 – 590 kcal
              </span>
              <span className="bg-amber-500/30 border border-amber-400/30 px-2 py-0.5 rounded-md text-amber-200 font-bold">
                32g – 52g Protein
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-heading text-sm sm:text-base font-extrabold text-amber-300">
                {language === 'en' ? 'From RM 13.90' : 'RM 13.90 起'}
              </span>
              {onExploreMenu && (
                <button
                  onClick={onExploreMenu}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs pointer-events-auto"
                >
                  {language === 'en' ? 'Order' : '点餐'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
