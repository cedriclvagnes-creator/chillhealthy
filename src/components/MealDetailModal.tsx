import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  AlertCircle,
  ShoppingBag,
  Edit3,
  Save,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { MealItem, Language, CartItem } from '../types';

interface MealDetailModalProps {
  meal: MealItem | null;
  language: Language;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onUpdateMeal?: (updatedMeal: MealItem) => void;
  allowEdit?: boolean;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  language,
  onClose,
  onAddToCart,
  onUpdateMeal,
  allowEdit = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [substitutions, setSubstitutions] = useState({
    lowCarbBase: false, // swap to cauliflower rice (+RM 3.50)
    extraProtein: false, // extra chicken or protein (+RM 6.00)
    dressingOnSide: true, // dressing on side
  });
  const [notes, setNotes] = useState('');

  // Edit Mode state for Photo, Name, Protein, Description (Admin only)
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeal, setEditedMeal] = useState<MealItem | null>(meal);
  const [editSavedToast, setEditSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editedMeal if incoming meal changes
  useEffect(() => {
    setEditedMeal(meal);
  }, [meal]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!meal) return null;

  const currentMeal = editedMeal || meal;
  const isOutOfStock = Boolean(currentMeal.isOutOfStock);

  const calculateItemPrice = () => {
    let price = currentMeal.price;
    if (substitutions.lowCarbBase) price += 3.5;
    if (substitutions.extraProtein) price += 6.0;
    return price;
  };

  const unitPrice = calculateItemPrice();
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (isOutOfStock) return;
    const cartItem: CartItem = {
      cartItemId: `meal-${currentMeal.id}-${Date.now()}`,
      type: 'meal',
      title: language === 'en' ? currentMeal.name : currentMeal.nameZh,
      titleZh: currentMeal.nameZh,
      price: unitPrice,
      quantity: quantity,
      image: currentMeal.image,
      calories: currentMeal.calories + (substitutions.extraProtein ? 120 : 0) - (substitutions.lowCarbBase ? 150 : 0),
      protein: currentMeal.protein + (substitutions.extraProtein ? 25 : 0),
      substitutions: substitutions,
      notes: notes.trim() || undefined,
    };
    onAddToCart(cartItem);
    onClose();
  };

  // Image Upload handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedMeal) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditedMeal({
        ...editedMeal,
        image: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMealEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedMeal) return;

    if (onUpdateMeal) {
      onUpdateMeal(editedMeal);
    }
    setEditSavedToast(true);
    setTimeout(() => {
      setEditSavedToast(false);
      setIsEditing(false);
    }, 1200);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-detail-title"
    >
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Dedicated High-Visibility Top Command Header (Always accessible and visible on Mobile, Tablet & Desktop) */}
        <div className="shrink-0 bg-white border-b border-stone-200/80 px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-2xs">
              <img
                src={currentMeal.image}
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="meal-detail-title" className="font-heading font-extrabold text-xs sm:text-sm text-stone-900 truncate">
                  {language === 'en' ? currentMeal.name : currentMeal.nameZh}
                </h3>
                {isOutOfStock ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                    {language === 'en' ? 'Sold Out' : '已售罄'}
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {currentMeal.calories} kcal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                {language === 'en' ? currentMeal.nameZh : currentMeal.name} · RM {unitPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allowEdit && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) {
                    setEditedMeal({ ...meal });
                  }
                  setIsEditing(!isEditing);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-amber-500 text-stone-900 ring-2 ring-amber-400'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Edit Photo, Name, Protein, and Description"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">
                  {isEditing ? (language === 'en' ? 'Cancel Edit' : '取消编辑') : (language === 'en' ? 'Edit Dish' : '编辑菜品')}
                </span>
              </button>
            )}

            {/* Prominent High-Contrast Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 hover:text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-stone-200 shadow-2xs"
              aria-label="Close modal"
              title={language === 'en' ? 'Close view (Esc)' : '关闭窗口 (Esc)'}
            >
              <X className="w-4 h-4 text-stone-600" />
              <span>{language === 'en' ? 'Close' : '关闭'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-left">
          {/* Hero Image Box */}
          <div className="relative h-48 sm:h-60 w-full rounded-2xl overflow-hidden bg-stone-100 shadow-xs shrink-0">
            <img
              src={currentMeal.image}
              alt={currentMeal.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
              }}
              className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-70 grayscale-[40%]' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {isOutOfStock && (
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-xs font-black uppercase shadow-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{language === 'en' ? 'Sold Out · Out of Stock' : '已售罄 · 厨房补货中'}</span>
                  </span>
                )}
                {currentMeal.isChefSpecial && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-900 text-[11px] font-extrabold uppercase">
                    {language === 'en' ? '★ Chef Pick' : '★ 主厨推荐'}
                  </span>
                )}
                {currentMeal.isPopular && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[11px] font-extrabold uppercase">
                    {language === 'en' ? 'Best Seller' : '热销爆款'}
                  </span>
                )}
                {currentMeal.prepMethod && (
                  <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                    {language === 'en' ? currentMeal.prepMethod : currentMeal.prepMethodZh}
                  </span>
                )}
              </div>

              <h2 id="meal-detail-title" className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
                {language === 'en' ? currentMeal.name : currentMeal.nameZh}
              </h2>
              <p className="text-xs sm:text-sm text-stone-200 mt-1 line-clamp-2">
                {language === 'en' ? currentMeal.subtitle : currentMeal.subtitleZh}
              </p>
            </div>
          </div>

          {/* Out of Stock Notice Banner */}
          {isOutOfStock && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-950 font-bold text-xs sm:text-sm shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span>{language === 'en' ? 'Currently Out of Stock / Sold Out' : '此餐品当前已售罄 / 厨房补货中'}</span>
                <p className="text-[11px] font-normal text-rose-700 mt-0.5">
                  {language === 'en'
                    ? 'This item has been marked as Out of Stock by kitchen admin. Please view details and choose another delicious meal!'
                    : '该餐品已在后台标记为缺货售罄，您可以完整查看成分与营养说明，并在前台选购其他丰盛餐品！'}
                </p>
              </div>
            </div>
          )}

          {/* Edit Mode vs Standard View Mode */}
          {isEditing && editedMeal ? (
            <form onSubmit={handleSaveMealEdits} className="space-y-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Edit Dish Information' : '编辑菜品信息（照片、名称、蛋白质、描述）'}</span>
                </span>
                <span className="text-[11px] text-stone-400">ID: {editedMeal.id}</span>
              </div>

              {/* Photo URL & Device Upload */}
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'en' ? 'Dish Photo (URL or File Upload) *' : '菜品照片 (URL链接或文件上传) *'}</span>
                </label>
                <input
                  type="url"
                  required
                  value={editedMeal.image}
                  onChange={(e) => setEditedMeal({ ...editedMeal, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'en' ? 'Upload Image from Device' : '从设备上传新照片'}</span>
                  </button>
                </div>
              </div>

              {/* Dish Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Dish Name (English) *' : '菜品名称 (英文) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editedMeal.name}
                    onChange={(e) => setEditedMeal({ ...editedMeal, name: e.target.value })}
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
                    value={editedMeal.nameZh}
                    onChange={(e) => setEditedMeal({ ...editedMeal, nameZh: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              {/* Price & Calories & Protein */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Price (RM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editedMeal.price}
                    onChange={(e) => setEditedMeal({ ...editedMeal, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={editedMeal.calories}
                    onChange={(e) => setEditedMeal({ ...editedMeal, calories: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editedMeal.protein}
                    onChange={(e) => setEditedMeal({ ...editedMeal, protein: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Description (Chinese)</label>
                <textarea
                  rows={2}
                  value={editedMeal.descriptionZh}
                  onChange={(e) => setEditedMeal({ ...editedMeal, descriptionZh: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  {language === 'en' ? 'Cancel' : '取消'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editSavedToast ? (language === 'en' ? 'Saved!' : '已保存!') : (language === 'en' ? 'Save Changes' : '保存菜品')}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Nutrition Macro Pills */}
              <div className="bg-stone-50 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Nutritional Facts (Per Box)' : '单份完整营养成分'}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      {language === 'en' ? 'Calories' : '热量'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-stone-900">{currentMeal.calories}</span>
                    <span className="text-[10px] text-stone-400 block">kcal</span>
                  </div>
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
                    <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                      {language === 'en' ? 'Protein' : '蛋白质'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-emerald-700">{currentMeal.protein}g</span>
                    <span className="text-[10px] text-emerald-600 block">Lean</span>
                  </div>
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      {language === 'en' ? 'Carbs' : '优质碳水'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-stone-900">{currentMeal.carbs}g</span>
                    <span className="text-[10px] text-stone-400 block">Low GI</span>
                  </div>
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      {language === 'en' ? 'Healthy Fat' : '健康油脂'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-stone-900">{currentMeal.fat}g</span>
                    <span className="text-[10px] text-stone-400 block">Clean</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 mb-1">
                  {language === 'en' ? 'Chef’s Notes & Prep' : '料理特色与烹饪说明'}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {language === 'en' ? currentMeal.description : currentMeal.descriptionZh}
                </p>
              </div>

              {/* Fresh Ingredients */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 mb-2">
                  {language === 'en' ? 'Fresh Whole Ingredients' : '新鲜天然全食材'}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(language === 'en' ? currentMeal.ingredients : currentMeal.ingredientsZh).map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
                {currentMeal.allergens && currentMeal.allergens.length > 0 && (
                  <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {language === 'en'
                        ? `Contains: ${currentMeal.allergens.join(', ')}`
                        : `过敏原提示: ${(currentMeal.allergensZh || currentMeal.allergens).join('，')}`}
                    </span>
                  </p>
                )}
              </div>

              {/* Customization & Substitutions (Only relevant when in stock) */}
              {!isOutOfStock && (
                <div className="pt-2 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>{language === 'en' ? 'Customize Meal Options' : '个性化定制选项'}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                        {language === 'en' ? 'Ala Carte Exclusive' : '仅限单点顾客'}
                      </span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    {language === 'en'
                      ? 'Custom adjustments are available for Ala Carte orders. (Meal plan package customers remain on certified chef standard balanced nutrition).'
                      : '个性化定制选项仅对单点顾客开放（月度/周期套餐顾客严格按主厨标准科学配比出品，不设定制）。'}
                  </p>

                  {/* Low carb base swap */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={substitutions.lowCarbBase}
                        onChange={(e) =>
                          setSubstitutions({ ...substitutions, lowCarbBase: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 block">
                          {language === 'en'
                            ? 'Swap Rice with Cauliflower Rice (Keto Low-Carb)'
                            : '换为低卡花椰菜米（生酮减碳）'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {language === 'en' ? 'Reduces carbs by ~30g' : '单份减少约30克碳水'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">+RM 3.50</span>
                  </label>

                  {/* Extra protein */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={substitutions.extraProtein}
                        onChange={(e) =>
                          setSubstitutions({ ...substitutions, extraProtein: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 block">
                          {language === 'en'
                            ? 'Extra Double Protein (+100g Chicken / Tofu)'
                            : '加倍优质肉量 (+100g 鸡胸 / 有机豆腐)'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {language === 'en' ? 'Adds ~25g pure protein' : '额外增加约25克蛋白质'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">+RM 6.00</span>
                  </label>

                  {/* Dressing on side */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={substitutions.dressingOnSide}
                        onChange={(e) =>
                          setSubstitutions({ ...substitutions, dressingOnSide: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 block">
                          {language === 'en'
                            ? 'Pack Dressing / Sauce on the Side'
                            : '酱汁单独分装 (方便控制摄入)'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {language === 'en' ? 'Dip as you like' : '蘸食更轻盈'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-stone-400">FREE</span>
                  </label>

                  {/* Special Instructions */}
                  <div className="pt-1">
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {language === 'en' ? 'Kitchen Notes / Dietary Request' : '特殊备注 (如不吃香菜、少盐等)'}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. No onion, cutlery needed...' : '如：不要葱蒜、附环保餐具等'}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Sticky Bottom Bar (Always viewable and easy to close across mobile, tablet, and website) */}
        <div className="shrink-0 p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2.5 sm:gap-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          {/* Prominent Always-Visible Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title={language === 'en' ? 'Close item view' : '关闭餐品详情'}
          >
            <X className="w-4 h-4 text-stone-600" />
            <span>{language === 'en' ? 'Close' : '关闭窗口'}</span>
          </button>

          {isOutOfStock ? (
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 py-2 px-3 sm:px-4 rounded-xl bg-rose-50 border border-rose-200 text-left">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Sold Out · Out of Stock' : '此餐品已售罄 / 厨房补货中'}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Close & Return to Menu' : '关闭并返回餐单'}</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 sm:gap-3 justify-end min-w-0">
              {/* Quantity selector */}
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 sm:p-2.5 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <span className="px-2.5 sm:px-3 font-bold text-xs sm:text-sm text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 sm:p-2.5 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-transform active:scale-98 cursor-pointer truncate"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {language === 'en'
                    ? `Add ${quantity} · RM ${totalPrice.toFixed(2)}`
                    : `加点 ${quantity} 份 · RM ${totalPrice.toFixed(2)}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
