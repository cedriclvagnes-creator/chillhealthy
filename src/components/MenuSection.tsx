import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Flame, Dumbbell, ShieldCheck, Heart, Info } from 'lucide-react';
import { MealItem, Language, Category, CartItem } from '../types';
import { MEAL_ITEMS } from '../data/menuData';

interface MenuSectionProps {
  language: Language;
  onSelectMeal: (meal: MealItem) => void;
  onQuickAdd: (meal: MealItem) => void;
  menuItems?: MealItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  language,
  onSelectMeal,
  onQuickAdd,
  menuItems = MEAL_ITEMS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: Category; labelEn: string; labelZh: string }[] = [
    { id: 'all', labelEn: 'All Dishes', labelZh: '全部餐点' },
    { id: 'signature', labelEn: 'CHILL Signatures', labelZh: '潮牌招牌' },
    { id: 'high-protein', labelEn: 'High Protein (>35g)', labelZh: '高蛋白增肌' },
    { id: 'low-carb', labelEn: 'Keto Low-Carb', labelZh: '低碳极简' },
    { id: 'under-500', labelEn: 'Under 500 kcal', labelZh: '500大卡轻体' },
    { id: 'plant-based', labelEn: 'Plant-Based', labelZh: '纯素与蔬食' },
    { id: 'drinks', labelEn: 'Detox Drinks & Snacks', labelZh: '祛湿饮品与加点' },
  ];

  const filteredMeals = useMemo(() => {
    return menuItems.filter((meal) => {
      const matchesCategory =
        selectedCategory === 'all' || meal.category.includes(selectedCategory);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        meal.name.toLowerCase().includes(query) ||
        meal.nameZh.includes(query) ||
        meal.subtitle.toLowerCase().includes(query) ||
        meal.description.toLowerCase().includes(query) ||
        meal.ingredients.some((i) => i.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, menuItems]);

  return (
    <section id="menu" className="py-16 sm:py-20 bg-stone-50 border-b border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Daily Fresh Bento Menu' : '每日现烹轻食餐单'}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {language === 'en' ? 'Nutritious Bento Boxes' : '招牌营养餐盒系列'}
          </h2>
          <p className="mt-3 text-stone-600 text-base">
            {language === 'en'
              ? 'Every single meal is balanced by certified nutritionists, cooked with premium whole foods, and sealed fresh every morning.'
              : '每份餐盒均由专业营养团队精确配比三大宏量营养素，采用65°C低温真空慢煮与轻煎工艺，少油低钠，满足您对健康与美味的所有期待。'}
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4 mb-10">
          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search by meal name or ingredient (e.g. Salmon, Chicken, Soba)...'
                  : '搜索餐品或食材（如：三文鱼、慢煮鸡胸、荞麦面、虾仁）...'
              }
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-semibold px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {language === 'en' ? cat.labelEn : cat.labelZh}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Grid */}
        {filteredMeals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 max-w-md mx-auto p-8">
            <Info className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <p className="font-bold text-stone-800">
              {language === 'en' ? 'No meals found' : '未找到匹配的餐点'}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {language === 'en' ? 'Try adjusting your search keywords.' : '请尝试调整搜索关键词或重选分类。'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
            >
              {language === 'en' ? 'Reset Filters' : '重置所有筛选'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredMeals.map((meal) => (
              <div
                key={meal.id}
                id={`meal-card-${meal.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div
                  onClick={() => onSelectMeal(meal)}
                  className="relative h-56 overflow-hidden cursor-pointer bg-stone-100"
                >
                  <img
                    src={meal.image}
                    alt={meal.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {meal.isChefSpecial && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-900 text-[11px] font-extrabold uppercase shadow-xs">
                        {language === 'en' ? '★ Chef Pick' : '★ 潮厨力荐'}
                      </span>
                    )}
                    {meal.isPopular && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold uppercase shadow-xs">
                        {language === 'en' ? 'Popular' : '爆款'}
                      </span>
                    )}
                  </div>

                  {/* Calorie & Protein Overlay Chip */}
                  <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-semibold flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{meal.calories} kcal</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-amber-300 font-bold">{meal.protein}g Protein</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div onClick={() => onSelectMeal(meal)} className="cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {language === 'en' ? meal.name : meal.nameZh}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-500 mt-1 line-clamp-1 font-medium">
                      {language === 'en' ? meal.subtitle : meal.subtitleZh}
                    </p>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {language === 'en' ? meal.description : meal.descriptionZh}
                    </p>

                    {/* Macro Stats Strip */}
                    <div className="mt-3.5 pt-3 border-t border-stone-100 grid grid-cols-4 gap-1 text-center bg-stone-50/80 rounded-xl p-2">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Kcal</span>
                        <span className="text-xs font-extrabold text-stone-800">{meal.calories}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 block uppercase font-bold">Prot</span>
                        <span className="text-xs font-extrabold text-emerald-700">{meal.protein}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Carbs</span>
                        <span className="text-xs font-extrabold text-stone-800">{meal.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Fat</span>
                        <span className="text-xs font-extrabold text-stone-800">{meal.fat}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="mt-4 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-400 block uppercase font-semibold">
                        {language === 'en' ? 'Fresh Bento' : '单盒现做'}
                      </span>
                      <span className="font-heading text-xl font-extrabold text-stone-900">
                        RM {meal.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectMeal(meal)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                      >
                        {language === 'en' ? 'Customize' : '自选定制'}
                      </button>

                      <button
                        id={`btn-quick-add-${meal.id}`}
                        onClick={() => onQuickAdd(meal)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
                        title="Quick Add to Cart"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'en' ? 'Add' : '加点'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
