import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Dumbbell, Sparkles, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { MealItem, Language, CartItem } from '../types';

interface MealDetailModalProps {
  meal: MealItem | null;
  language: Language;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  language,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [substitutions, setSubstitutions] = useState({
    lowCarbBase: false, // swap to cauliflower rice (+RM 3.50)
    extraProtein: false, // extra chicken or protein (+RM 6.00)
    dressingOnSide: true, // dressing on side
  });
  const [notes, setNotes] = useState('');

  if (!meal) return null;

  const calculateItemPrice = () => {
    let price = meal.price;
    if (substitutions.lowCarbBase) price += 3.5;
    if (substitutions.extraProtein) price += 6.0;
    return price;
  };

  const unitPrice = calculateItemPrice();
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    const cartItem: CartItem = {
      cartItemId: `meal-${meal.id}-${Date.now()}`,
      type: 'meal',
      title: language === 'en' ? meal.name : meal.nameZh,
      titleZh: meal.nameZh,
      price: unitPrice,
      quantity: quantity,
      image: meal.image,
      calories: meal.calories + (substitutions.extraProtein ? 120 : 0) - (substitutions.lowCarbBase ? 150 : 0),
      protein: meal.protein + (substitutions.extraProtein ? 25 : 0),
      substitutions: substitutions,
      notes: notes.trim() || undefined,
    };
    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-stone-100">
          <img
            src={meal.image}
            alt={meal.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              {meal.isChefSpecial && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-900 text-xs font-extrabold uppercase">
                  {language === 'en' ? 'Chef Special' : '主厨推荐'}
                </span>
              )}
              {meal.isPopular && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-extrabold uppercase">
                  {language === 'en' ? 'Best Seller' : '热销爆款'}
                </span>
              )}
              {meal.prepMethod && (
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  {language === 'en' ? meal.prepMethod : meal.prepMethodZh}
                </span>
              )}
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              {language === 'en' ? meal.name : meal.nameZh}
            </h2>
            <p className="text-xs sm:text-sm text-stone-200 mt-1">
              {language === 'en' ? meal.subtitle : meal.subtitleZh}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Nutrition Macro Pills */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              {language === 'en' ? 'Nutritional Facts (Per Box)' : '单份完整营养成分'}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block uppercase font-bold">
                  {language === 'en' ? 'Calories' : '热量'}
                </span>
                <span className="text-lg font-extrabold text-stone-900">{meal.calories}</span>
                <span className="text-[10px] text-stone-400 block">kcal</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  {language === 'en' ? 'Protein' : '蛋白质'}
                </span>
                <span className="text-lg font-extrabold text-emerald-700">{meal.protein}g</span>
                <span className="text-[10px] text-emerald-600 block">Lean</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block uppercase font-bold">
                  {language === 'en' ? 'Carbs' : '优质碳水'}
                </span>
                <span className="text-lg font-extrabold text-stone-900">{meal.carbs}g</span>
                <span className="text-[10px] text-stone-400 block">Low GI</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block uppercase font-bold">
                  {language === 'en' ? 'Healthy Fat' : '健康油脂'}
                </span>
                <span className="text-lg font-extrabold text-stone-900">{meal.fat}g</span>
                <span className="text-[10px] text-stone-400 block">Clean Oils</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-1.5">
              {language === 'en' ? 'Chef’s Notes & Prep' : '料理特色与烹饪说明'}
            </h4>
            <p className="text-sm text-stone-600 leading-relaxed">
              {language === 'en' ? meal.description : meal.descriptionZh}
            </p>
          </div>

          {/* Fresh Ingredients */}
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-2">
              {language === 'en' ? 'Fresh Whole Ingredients' : '新鲜天然全食材'}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(language === 'en' ? meal.ingredients : meal.ingredientsZh).map((ing, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                >
                  {ing}
                </span>
              ))}
            </div>
            {meal.allergens && meal.allergens.length > 0 && (
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'en'
                    ? `Contains: ${meal.allergens.join(', ')}`
                    : `过敏原提示: ${(meal.allergensZh || meal.allergens).join('，')}`}
                </span>
              </p>
            )}
          </div>

          {/* Customization & Substitutions */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <h4 className="text-sm font-bold text-stone-900">
              {language === 'en' ? 'Custom Adjustments' : '个性化定制选项'}
            </h4>

            {/* Low carb base swap */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors">
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
                  <span className="text-sm font-semibold text-stone-800 block">
                    {language === 'en'
                      ? 'Swap Rice with Cauliflower Rice (Keto Low-Carb)'
                      : '换为低卡花椰菜米（生酮减碳）'}
                  </span>
                  <span className="text-xs text-stone-500">
                    {language === 'en' ? 'Reduces carbs by ~30g' : '单份减少约30克碳水'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700">+RM 3.50</span>
            </label>

            {/* Extra protein */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors">
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
                  <span className="text-sm font-semibold text-stone-800 block">
                    {language === 'en'
                      ? 'Add Extra Protein Portion (+100g Meat)'
                      : '加倍肉量 (+100g 优质肉类)'}
                  </span>
                  <span className="text-xs text-stone-500">
                    {language === 'en' ? 'Adds ~25g pure protein' : '额外增加约25克蛋白质'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700">+RM 6.00</span>
            </label>

            {/* Dressing on side */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors">
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
                  <span className="text-sm font-semibold text-stone-800 block">
                    {language === 'en'
                      ? 'Pack Dressing / Sauce on the Side'
                      : '酱汁单独分装 (方便控制摄入)'}
                  </span>
                  <span className="text-xs text-stone-500">
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
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <span className="text-xs font-bold text-stone-500 uppercase">
              {language === 'en' ? 'Qty:' : '数量:'}
            </span>
            <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-bold text-sm text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button with dynamic total */}
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-md shadow-emerald-700/20 transition-transform active:scale-98 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>
              {language === 'en'
                ? `Add ${quantity} to Cart · RM ${totalPrice.toFixed(2)}`
                : `加入餐篮 · RM ${totalPrice.toFixed(2)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
