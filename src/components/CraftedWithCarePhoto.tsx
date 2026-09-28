import React, { useState, useEffect } from 'react';
import { Instagram, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface CraftedWithCarePhotoProps {
  language: Language;
  photoUrl?: string;
}

// Official signature dishes featured on @chillhealthybox IG
export const IG_FEATURED_PHOTOS = [
  {
    id: 'rempah-chicken',
    nameEn: 'Rempah Spiced Sous-Vide Chicken',
    nameZh: '南洋草本香料慢煮嫩鸡',
    url: 'https://admin.chillhealthy.com/uploads/36yvg4y1z0aoc0wwsg.jpg',
    tagEn: 'South-East Asian Herbed Spices · 65°C Sous-Vide',
    tagZh: '南洋天然香料提味 · 65°C 真空锁鲜',
    descEn: 'Sous-vide chicken breast infused with authentic herbed lemongrass, turmeric, and galangal. Deeply aromatic, rich in flavor, 0% MSG, under 450 kcal.',
    descZh: '新鲜鸡胸肉以香茅、南姜、姜黄等纯天然南洋草本香料低温慢煮，肉汁充盈、鲜嫩入味，坚守0味精、低盐低油，彻底打破传统减脂餐寡淡无味的刻板印象。',
  },
  {
    id: 'golden-garlic',
    nameEn: 'Golden Garlic Roasted Chicken',
    nameZh: '金蒜香烤慢煮嫩鸡胸',
    url: 'https://admin.chillhealthy.com/uploads/1uijdxelztq8w0s80o.jpg',
    tagEn: '44g Protein · Crispy Garlic Aromatics',
    tagZh: '44g 优质高蛋白 · 特级初榨橄榄油烘烤',
    descEn: 'Convection-roasted with freshly crushed garlic, rosemary, and cold-pressed extra virgin olive oil. Tender, fragrant, and calorie-controlled.',
    descZh: '金黄焙香蒜蓉与特级初榨橄榄油烘烤，肉质饱满嫩滑，香味浓郁且热量严格受控。',
  },
  {
    id: 'korean-glazed-chicken',
    nameEn: 'Korean Glazed Sous-Vide Chicken',
    nameZh: '韩式秘制甜辣慢煮鸡',
    url: 'https://admin.chillhealthy.com/uploads/uapypptvpdwg0ggsc.jpg',
    tagEn: 'Low Sugar Gochujang · Rich Umami',
    tagZh: '控糖秘制韩式甜辣 · 鲜香入味',
    descEn: 'Tender chicken glazed with chef-formulated low-sodium Korean sauce. Bold taste without calorie spikes.',
    descZh: '主厨特调低钠韩式秘酱，浓郁咸甜微辣，肉质鲜嫩多汁，低热量无负担。',
  },
  {
    id: 'chi-kut-teh',
    nameEn: 'Signature Chi Kut Teh',
    nameZh: '潮式清补草本鸡骨茶',
    url: 'https://admin.chillhealthy.com/uploads/d1j2uwbv4mgowsccow.jpg',
    tagEn: 'Zero Pork Lard · Herbal Slow Broth',
    tagZh: '零动物油脂 · 清补草本高汤',
    descEn: 'Traditional herbal slow-simmered comfort soup with angelica root, wolfberries, and tender skinless chicken.',
    descZh: '当归、红枣、枸杞草本精粹清炖慢熬，搭配去皮鲜鸡肉，甘醇清爽温润养胃。',
  },
  {
    id: 'black-pepper-chicken',
    nameEn: 'Black Pepper Glazed Chicken',
    nameZh: '特调黑椒慢煮嫩鸡胸',
    url: 'https://admin.chillhealthy.com/uploads/rqooi0lb6yo08gkgc8.jpg',
    tagEn: 'Coarse Ground Peppercorn · Low Sodium',
    tagZh: '现磨黑胡椒浓汁 · 告别白灼干柴',
    descEn: 'Coarse black peppercorn reduction coat each tender chicken medallion for an addictive savory kick.',
    descZh: '原粒现磨黑胡椒与纯天然香料熬制浓汁，辛香浓郁极其开胃，让健康饮食充满期待。',
  },
  {
    id: 'omega-salmon',
    nameEn: 'Seared Norwegian Omega Salmon',
    nameZh: '香煎挪威深海三文鱼排',
    url: 'https://admin.chillhealthy.com/uploads/670318xg9o8wgggcw.jpg',
    tagEn: 'Rich Omega-3s · Golden Crisp Sear',
    tagZh: '富含优质Omega-3 · 金黄焦香锁鲜',
    descEn: 'Crispy skin with melt-in-your-mouth pink salmon flesh. Natural ocean goodness seasoned with sea salt.',
    descZh: '挪威进口深海三文鱼，外表金黄焦香，内里粉嫩鲜美，提供人体必需的天然健康油脂。',
  },
];

export const CraftedWithCarePhoto: React.FC<CraftedWithCarePhotoProps> = ({ language, photoUrl }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    if (photoUrl) {
      const found = IG_FEATURED_PHOTOS.findIndex((p) => p.url === photoUrl);
      if (found >= 0) return found;
    }
    return 0;
  });

  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(() => {
    if (photoUrl && !photoUrl.includes('agnes-kitchen') && !photoUrl.includes('h2ia7y6vd60ogckg84')) {
      return photoUrl;
    }
    return IG_FEATURED_PHOTOS[0].url;
  });

  // When photoUrl prop changes (e.g. from admin)
  useEffect(() => {
    if (photoUrl && !photoUrl.includes('agnes-kitchen')) {
      setActivePhotoUrl(photoUrl);
      const matchIdx = IG_FEATURED_PHOTOS.findIndex((p) => p.url === photoUrl);
      if (matchIdx >= 0) {
        setSelectedIdx(matchIdx);
      }
    }
  }, [photoUrl]);

  const handleSelectDish = (idx: number) => {
    setSelectedIdx(idx);
    setActivePhotoUrl(IG_FEATURED_PHOTOS[idx].url);
  };

  const currentDish = IG_FEATURED_PHOTOS[selectedIdx] || IG_FEATURED_PHOTOS[0];
  const isEn = language === 'en';

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white group">
      {/* Main Image Frame */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden bg-stone-900">
        <img
          src={activePhotoUrl}
          alt={isEn ? currentDish.nameEn : currentDish.nameZh}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top-left IG Verified Badge */}
        <div className="absolute top-4 left-4 z-10">
          <a
            href="https://www.instagram.com/chillhealthybox/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-md text-white border border-white/20 text-xs font-bold shadow-md hover:bg-stone-900 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center p-0.5">
              <Instagram className="w-3.5 h-3.5 text-white" />
            </div>
            <span>@chillhealthybox</span>
            <span className="text-[10px] bg-emerald-500 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
              IG Official
            </span>
          </a>
        </div>

        {/* Bottom Gradient Overlay with Dish Description */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/35 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white pointer-events-none">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? currentDish.tagEn : currentDish.tagZh}</span>
          </div>
          <h4 className="font-heading font-extrabold text-base sm:text-lg text-white">
            {isEn ? currentDish.nameEn : currentDish.nameZh}
          </h4>
          <p className="text-xs text-stone-200 mt-1 leading-relaxed">
            {isEn ? currentDish.descEn : currentDish.descZh}
          </p>
        </div>
      </div>

      {/* Mini Thumbnails Selector from @chillhealthybox IG */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0 pl-1">
          {isEn ? 'IG Featured:' : 'IG 热门实拍:'}
        </span>
        <div className="flex items-center gap-2">
          {IG_FEATURED_PHOTOS.map((dish, idx) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => handleSelectDish(idx)}
              className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                selectedIdx === idx
                  ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                  : 'border-stone-200 opacity-70 hover:opacity-100'
              }`}
              title={isEn ? dish.nameEn : dish.nameZh}
            >
              <img
                src={dish.url}
                alt={dish.nameEn}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
