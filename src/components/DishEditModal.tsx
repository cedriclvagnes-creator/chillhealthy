import React, { useState, useRef } from 'react';
import { X, Upload, Save, Sparkles, Image as ImageIcon } from 'lucide-react';
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
  const [protein, setProtein] = useState<number>(meal.protein);
  const [calories, setCalories] = useState<number>(meal.calories);
  const [carbs, setCarbs] = useState<number>(meal.carbs || 0);
  const [fat, setFat] = useState<number>(meal.fat || 0);
  const [price, setPrice] = useState<number>(meal.price);
  const [description, setDescription] = useState(meal.description);
  const [descriptionZh, setDescriptionZh] = useState(meal.descriptionZh || '');
  const [imageUrl, setImageUrl] = useState(meal.image);

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
      protein: Number(protein) || 0,
      calories: Number(calories) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      price: Number(price) || 0,
      description,
      descriptionZh: descriptionZh || description,
      image: imageUrl,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-stone-900 text-lg">
                {language === 'en' ? 'Edit Dish Details & Photo' : '编辑餐品与图片'}
              </h3>
              <p className="text-xs text-stone-500">ID: {meal.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Photo & Upload */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-stone-200">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-stone-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              >
                <Upload className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
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
                  <span>Photo URL or Upload Device Photo</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  Choose Local File
                </button>
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or data:image"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
              />
              <p className="text-[10px] text-stone-400">
                You can paste any web image URL or click &quot;Choose Local File&quot; to pick from your computer/phone.
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

          {/* Macros: Protein, Calories, Carbs, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-emerald-800 block mb-1">
                Protein (g) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Description (English) *
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Description (中文描述)
              </label>
              <textarea
                rows={2}
                value={descriptionZh}
                onChange={(e) => setDescriptionZh(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
