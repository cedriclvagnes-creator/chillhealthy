import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  Grid2X2,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  X,
  Save,
  Check,
  Upload,
} from 'lucide-react';
import { Language } from '../types';

export interface AlaCarteGridItem {
  id: string;
  name: string;
  nameZh: string;
  image: string;
  tag: string;
  protein?: string;
  description?: string;
  descriptionZh?: string;
}

interface AlaCarteCombinationPhotoProps {
  language: Language;
  onExploreMenu?: () => void;
  allowEdit?: boolean;
  customPhotoUrl?: string;
  comboMode?: 'photo' | 'grid' | 'spread';
}

const STORAGE_KEY_PHOTO = 'chillhealthy_hero_combo_photo';
const STORAGE_KEY_ITEMS = 'chillhealthy_hero_ala_carte_items';

const INITIAL_ALA_CARTE_ITEMS: AlaCarteGridItem[] = [
  {
    id: 'combo-salmon-chicken',
    name: 'Combo Salmon & Chicken',
    nameZh: '三文鱼与鸡肉双拼',
    image: 'https://admin.chillhealthy.com/uploads/h2ia7y6vd60ogckg84.jpg',
    tag: '52g Protein',
    protein: '52g Protein',
    description: 'Double protein power: Pan-seared Norwegian salmon fillet & herb-roasted chicken breast.',
    descriptionZh: '双重高蛋白盛宴：香煎挪威深海三文鱼排与鲜嫩迷迭香烤鸡胸肉双拼。',
  },
  {
    id: 'chi-kut-teh',
    name: 'Chi Kut Teh',
    nameZh: '潮式清补鸡骨茶',
    image: 'https://admin.chillhealthy.com/uploads/d1j2uwbv4mgowsccow.jpg',
    tag: '38g Protein',
    protein: '38g Protein',
    description: 'Slow-simmered herbal heritage broth infused with angelica, wolfberry, garlic and tender chicken.',
    descriptionZh: '草本慢熬清补鸡骨茶：选用当归、红枣、枸杞、大蒜与温体去皮鸡肉，零油脂负担。',
  },
  {
    id: 'prawn-omelette',
    name: 'Golden Prawn Omelette',
    nameZh: '金黄虾仁烘蛋',
    image: 'https://admin.chillhealthy.com/uploads/y92l27dzynko4kock.jpg',
    tag: '35g Protein',
    protein: '35g Protein',
    description: 'Fresh wild tiger sea prawns folded into fluffy, golden high-protein farm eggs.',
    descriptionZh: '精选野生活捕黑虎海虾仁，融入农场鲜鸡蛋烘制，蓬松金黄，高蛋白低负担。',
  },
  {
    id: 'garlic-chicken',
    name: 'Golden Garlic Chicken',
    nameZh: '金蒜香烤鸡胸',
    image: 'https://admin.chillhealthy.com/uploads/1uijdxelztq8w0s80o.jpg',
    tag: '42g Protein',
    protein: '42g Protein',
    description: 'Tender chicken breast marinated in slow-roasted garlic oil and rosemary herbs.',
    descriptionZh: '慢烤金黄蒜香迷迭香鸡胸，外香微焦内里柔嫩多汁，低脂高饱腹。',
  },
];

const SPREAD_PHOTO = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80';

export const AlaCarteCombinationPhoto: React.FC<AlaCarteCombinationPhotoProps> = ({
  language,
  onExploreMenu,
  allowEdit = false,
  customPhotoUrl,
  comboMode,
}) => {
  const [customPhoto, setCustomPhoto] = useState<string | null>(() => {
    if (customPhotoUrl) return customPhotoUrl;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PHOTO);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return null;
  });

  const [viewMode, setViewMode] = useState<'photo' | 'grid' | 'spread'>(() => {
    if (comboMode) return comboMode;
    if (customPhotoUrl) return 'photo';
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PHOTO);
      if (saved) return 'photo';
    } catch {
      // ignore
    }
    return 'grid';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleItemImageRef = useRef<HTMLInputElement>(null);

  // Sync customPhotoUrl prop if updated from Back Office
  useEffect(() => {
    if (customPhotoUrl !== undefined) {
      setCustomPhoto(customPhotoUrl || null);
      if (customPhotoUrl && !comboMode) {
        setViewMode('photo');
      }
    }
  }, [customPhotoUrl, comboMode]);

  useEffect(() => {
    if (comboMode) {
      setViewMode(comboMode);
    }
  }, [comboMode]);

  // Stateful & editable ala carte items (especially the last two ala carte items!)
  const [alaCarteItems, setAlaCarteItems] = useState<AlaCarteGridItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_ALA_CARTE_ITEMS;
  });

  // Editor Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditIndex, setActiveEditIndex] = useState(2); // default to 2 (first of the last two items)
  const [editForm, setEditForm] = useState<AlaCarteGridItem>(alaCarteItems[2]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!customPhotoUrl) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PHOTO);
        if (saved) {
          setCustomPhoto(saved);
        }
      } catch {
        // ignore
      }
    }
  }, [customPhotoUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomPhoto(dataUrl);
      setViewMode('photo');
      try {
        localStorage.setItem(STORAGE_KEY_PHOTO, dataUrl);
      } catch {
        // quota exceeded fallback
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setCustomPhoto(null);
    setViewMode('grid');
    try {
      localStorage.removeItem(STORAGE_KEY_PHOTO);
    } catch {
      // ignore
    }
  };

  // Switch which ala carte item to edit
  const handleSelectEditItem = (index: number) => {
    setActiveEditIndex(index);
    setEditForm({ ...alaCarteItems[index] });
    setSaveSuccess(false);
  };

  const handleOpenEditModal = (targetIndex: number = 2) => {
    setActiveEditIndex(targetIndex);
    setEditForm({ ...alaCarteItems[targetIndex] });
    setIsEditModalOpen(true);
    setSaveSuccess(false);
  };

  // Upload image specifically for the selected ala carte item
  const handleSingleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditForm((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...alaCarteItems];
    updated[activeEditIndex] = {
      ...editForm,
      tag: editForm.protein || editForm.tag || 'High Protein',
    };
    setAlaCarteItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleResetAllAlaCarteItems = () => {
    setAlaCarteItems(INITIAL_ALA_CARTE_ITEMS);
    setEditForm(INITIAL_ALA_CARTE_ITEMS[activeEditIndex]);
    try {
      localStorage.removeItem(STORAGE_KEY_ITEMS);
    } catch {
      // ignore
    }
    setSaveSuccess(true);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-900 group">
      {/* Hidden file input for custom photo upload - ONLY in Admin Mode */}
      {allowEdit && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      )}

      {/* Top action controls bar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20 shadow-md">
        {/* Quick Edit Ala Carte Items (Only available in Admin Mode) */}
        {allowEdit && (
          <button
            onClick={() => handleOpenEditModal(2)}
            title={language === 'en' ? 'Edit Ala Carte Items & Photos' : '编辑单点菜品、照片、蛋白质与介绍'}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white px-2 py-0.5 rounded-full bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{language === 'en' ? 'Edit Dishes' : '编辑菜品'}</span>
          </button>
        )}

        {/* View mode buttons */}
        {customPhoto && (
          <button
            onClick={() => setViewMode('photo')}
            title={language === 'en' ? 'Signature Combination Photo' : '潮轻食精选单点组合照片'}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              viewMode === 'photo'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{language === 'en' ? 'Photo' : '封面'}</span>
          </button>
        )}

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

        {/* Admin only: Reset or Upload custom photo */}
        {allowEdit && customPhoto && (
          <button
            onClick={handleResetPhoto}
            title={language === 'en' ? 'Reset to combination photo' : '还原组合照片'}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-white px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>{language === 'en' ? 'Reset' : '还原'}</span>
          </button>
        )}

        {allowEdit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            title={language === 'en' ? 'Upload Custom Ala Carte Photo' : '上传自定义单点组合照'}
            className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer border-l border-white/20 ml-0.5"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">{language === 'en' ? 'Upload' : '上传'}</span>
          </button>
        )}
      </div>

      {/* Main Image Container */}
      <div className="w-full h-84 sm:h-96 relative overflow-hidden">
        {customPhoto && viewMode === 'photo' ? (
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
            {alaCarteItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  if (allowEdit) {
                    handleOpenEditModal(index);
                  } else if (onExploreMenu) {
                    onExploreMenu();
                  }
                }}
                className={`relative w-full h-full overflow-hidden group/item bg-stone-800 ${
                  allowEdit || onExploreMenu ? 'cursor-pointer' : ''
                }`}
                title={
                  allowEdit
                    ? (language === 'en' ? `Click to edit ${item.name}` : `点击编辑 ${item.nameZh}`)
                    : (language === 'en' ? `View Menu for ${item.name}` : `浏览菜单 ${item.nameZh}`)
                }
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                />

                {/* Hover overlay hint */}
                {allowEdit ? (
                  <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-2 py-1 rounded-lg bg-stone-900/85 text-[11px] font-bold text-white flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-emerald-400" />
                      <span>{language === 'en' ? 'Edit' : '编辑'}</span>
                    </span>
                  </div>
                ) : onExploreMenu ? (
                  <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-2 py-1 rounded-lg bg-stone-900/80 text-[10px] font-bold text-white">
                      {language === 'en' ? 'View Menu' : '查看菜单'}
                    </span>
                  </div>
                ) : null}

                {/* Dish badge & protein */}
                <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1 items-start">
                  <span className="px-1.5 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-white/90 border border-white/15">
                    {language === 'en' ? item.name : item.nameZh}
                  </span>
                  {item.protein && (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-900/80 text-[9px] font-bold text-emerald-300 border border-emerald-500/20">
                      {item.protein}
                    </span>
                  )}
                </div>

                {/* Marker for the last two ala carte items */}
                {index >= 2 && (
                  <div className="absolute bottom-2 right-2 pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-[9px] font-black text-stone-900">
                      {index === 2 ? 'Ala Carte #3' : 'Ala Carte #4'}
                    </span>
                  </div>
                )}
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
              {language === 'en' ? '24 Fresh Choices · All Editable' : '24款单点现做 · 全部可自定义'}
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

      {/* =========================================================================
          ALA CARTE EDIT MODAL (PHOTO, NAME, PROTEIN, DESCRIPTION EDITABLE)
          Allows editing any item, specifically the last two ala carte items!
         ========================================================================= */}
      {allowEdit && isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-stone-900">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                <div>
                  <h4 className="font-heading font-extrabold text-base sm:text-lg text-stone-900">
                    {language === 'en' ? 'Edit Ala Carte Dish Details' : '编辑单点菜品信息与照片'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {language === 'en'
                      ? 'Edit photo, name, protein and description for any item including the last two ala carte.'
                      : '可随时修改菜品图片、中英文名称、蛋白质含量与描述（包括最后两款单点）。'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer border border-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dish Tabs (emphasizing the last two items) */}
            <div className="p-3 bg-stone-100/80 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto">
              {alaCarteItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectEditItem(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeEditIndex === idx
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200/80'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="truncate max-w-[120px]">{language === 'en' ? item.name : item.nameZh}</span>
                  {idx >= 2 && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
                        activeEditIndex === idx ? 'bg-amber-400 text-stone-900' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      Last 2
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEditItem} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Photo Preview & URL / File input */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <img
                  src={editForm.image}
                  alt={editForm.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="flex-1 w-full space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">
                    {language === 'en' ? 'Dish Photo (Image URL or File Upload) *' : '菜品照片 (图片链接或文件上传) *'}
                  </label>
                  <input
                    type="url"
                    required
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={singleItemImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSingleItemImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => singleItemImageRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'en' ? 'Upload Image File' : '从设备上传新照片'}</span>
                    </button>
                    <span className="text-[10px] text-stone-400">
                      {language === 'en' ? 'Supports JPG, PNG, WebP' : '支持 JPG、PNG、WebP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Dish Name (English) *' : '菜品名称 (英文) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Dish Name (Chinese) *' : '菜品名称 (中文) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nameZh}
                    onChange={(e) => setEditForm({ ...editForm, nameZh: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              {/* Protein and Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Protein Content (e.g. 52g Protein) *' : '蛋白质含量 (例如: 52g 蛋白质) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.protein || ''}
                    onChange={(e) => setEditForm({ ...editForm, protein: e.target.value, tag: e.target.value })}
                    placeholder="e.g. 42g Protein"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-semibold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Highlighted Feature / Tag' : '亮点标签'}
                  </label>
                  <input
                    type="text"
                    value={editForm.tag || ''}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    placeholder="e.g. Lean & Juicy"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Description (English) *' : '介绍描述 (英文) *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Description (Chinese) *' : '介绍描述 (中文) *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editForm.descriptionZh || ''}
                    onChange={(e) => setEditForm({ ...editForm, descriptionZh: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              {/* Save Success Alert */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'Changes saved to live menu! Persisted in localStorage.'
                      : '菜品已成功更新并保存！'}
                  </span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetAllAlaCarteItems}
                  className="text-xs text-stone-500 hover:text-stone-800 font-semibold"
                >
                  {language === 'en' ? 'Reset All to Defaults' : '恢复默认数据'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                  >
                    {language === 'en' ? 'Close' : '关闭'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Save Dish' : '保存更新'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
