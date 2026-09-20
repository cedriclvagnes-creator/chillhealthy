import React, { useState, useRef } from 'react';
import { X, Upload, Save, Sparkles, Image as ImageIcon, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { MealItem, Language } from '../types';

interface DishEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealItem | null;
  language: Language;
  onSave: (updatedMeal: MealItem) => void;
}

export const DishEditModal: React.FC<DishEditModalProps> = ({
  isOpen,
  onClose,
  meal,
  language,
  onSave,
}) => {
  if (!isOpen || !meal) return null;

  const [name, setName] = useState(meal.name);
  const [nameZh, setNameZh] = useState(meal.nameZh);
  const [subtitle, setSubtitle] = useState(meal.subtitle || '');
  const [subtitleZh, setSubtitleZh] = useState(meal.subtitleZh || '');
  const [protein, setProtein] = useState<number>(meal.protein);
  const [calories, setCalories] = useState<number>(meal.calories);
  const [carbs, setCarbs] = useState<number>(meal.carbs || 0);
  const [fat, setFat] = useState<number>(meal.fat || 0);
  const [price, setPrice] = useState<number>(meal.price);
  const [description, setDescription] = useState(meal.description);
  const [descriptionZh, setDescriptionZh] = useState(meal.descriptionZh || '');
  const [imageUrl, setImageUrl] = useState(meal.image);
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(!!meal.isOutOfStock);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MealItem = {
      ...meal,
      name,
      nameZh,
      subtitle,
      subtitleZh,
      protein: Number(protein) || 0,
      calories: Number(calories) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      price: Number(price) || 0,
      description,
      descriptionZh: descriptionZh || description,
      image: imageUrl,
      isOutOfStock: isOutOfStock,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-stone-900 text-lg">
                  {language === 'en' ? 'Edit Dish, Photo & Stock' : '编辑餐品、图片与库存'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-stone-500">Dish ID: {meal.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          
          {/* Stock Availability Control Banner */}
          <div className="p-3.5 rounded-2xl border transition-all bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-600'}`}>
                {isOutOfStock ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </div>
              <div>
                <label className="font-bold text-stone-900 block text-xs">
                  {language === 'en' ? 'Stock Status (Mark Out of Stock)' : '库存状态（可标记为售罄/缺货）'}
                </label>
                <p className="text-[11px] text-stone-500">
                  {isOutOfStock
                    ? (language === 'en' ? '🔴 Marked as OUT OF STOCK. Customers cannot add this item to cart.' : '🔴 当前标记为【已售罄/缺货】，顾客无法加点此餐盒。')
                    : (language === 'en' ? '🟢 Available IN STOCK. Customers can order normally.' : '🟢 当前【正常供应有货】，顾客可自由下单定制。')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsOutOfStock(false)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  !isOutOfStock
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                {language === 'en' ? 'In Stock (有货)' : '正常有货'}
              </button>
              <button
                type="button"
                onClick={() => setIsOutOfStock(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-300'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                {language === 'en' ? 'Out of Stock (售罄)' : '标记售罄'}
              </button>
            </div>
          </div>

          {/* Photo & Upload */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-28 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-stone-200">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                }}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-red-400 bg-black/80 px-2 py-0.5 rounded">
                    OUT OF STOCK
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-stone-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              >
                <Upload className="w-4 h-4 mb-0.5" />
                <span>Upload New</span>
              </button>
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Photo Link or Upload from Device</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  Upload File
                </button>
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or data:image"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              <p className="text-[10px] text-stone-400">
                Direct URL or click &quot;Upload File&quot; to pick an image from your computer or phone.
              </p>
            </div>
          </div>

          {/* Dish Names (English & Chinese) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Dish Name (English) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Dish Name (中文名称) *
              </label>
              <input
                type="text"
                required
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Subtitle / Short Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Subtitle / Tagline (English)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Sous-Vide Chicken Fillet · 52g Protein"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Subtitle / Tagline (中文亮点)
              </label>
              <input
                type="text"
                value={subtitleZh}
                onChange={(e) => setSubtitleZh(e.target.value)}
                placeholder="例如：65°C法式慢煮鸡胸 · 52g纯净高蛋白"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Macros: Protein, Calories, Carbs, Fat, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Price (RM) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-emerald-800 block mb-1">
                Protein (g) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Calories (kcal) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>
          </div>

          {/* Description (English and Chinese) */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Description (English) *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full dish description in English..."
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Description (中文详细描述) *
              </label>
              <textarea
                rows={3}
                required
                value={descriptionZh}
                onChange={(e) => setDescriptionZh(e.target.value)}
                placeholder="详细中文餐品食材、烹饪工艺与口味描述..."
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <div className="text-[11px] text-stone-400">
              Changes apply immediately to live website and customer menus.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

