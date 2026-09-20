const fs = require('fs');

const itemsConfig = JSON.parse(fs.readFileSync('scripts/generated_items.json', 'utf8'));

// Read rest of menuData.ts starting from MEAL_PLANS
const originalContent = fs.readFileSync('src/data/menuData.ts', 'utf8');
const mealPlansIndex = originalContent.indexOf('export const MEAL_PLANS: MealPlan[] = [');
if (mealPlansIndex === -1) {
  throw new Error('Could not find MEAL_PLANS in menuData.ts');
}
const afterMealItems = originalContent.slice(mealPlansIndex);

const drinkItems = [
  {
    id: 'drink-lemongrass-barley',
    name: 'Sugar-Free Lemongrass Barley Detox',
    nameZh: '纯天然无糖香茅薏米水',
    subtitle: 'Zero Cane Sugar · De-bloat & Cooling Herb Drink',
    subtitleZh: '零蔗糖添加 · 排湿消肿 · 清热利水',
    category: ['drinks', 'under-500'],
    price: 6.9,
    calories: 45,
    protein: 1,
    carbs: 9,
    fat: 0,
    fiber: 2,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    description: 'Slow-simmered holistically using premium Dutch pearl barley, fresh pandan leaves, and wild lemongrass. Naturally refreshing, zero added cane sugar or syrups.',
    descriptionZh: '选用高品质荷兰洋薏米、新鲜斑斓叶与鲜采香茅慢火清炖数小时，完全不添加白砂糖或任何人工糖浆，天然温润微甘，利水消水肿，餐后解腻首选。',
    ingredients: ['Pearl Barley', 'Fresh Lemongrass Stalks', 'Pandan Leaf', 'Filtered Water', 'Winter Melon Seed Extract'],
    ingredientsZh: ['精选洋薏米', '鲜香茅', '新鲜斑斓叶', '纯净水', '冬瓜子提取物'],
    prepMethod: 'Slow Simmered Botanical Infusion',
    prepMethodZh: '草本慢火清煮',
  },
  {
    id: 'drink-green-glow-cold-pressed',
    name: 'Cold-Pressed Green Glow Celery Detox',
    nameZh: '鲜榨冷压青西芹排毒纯汁',
    subtitle: 'Celery · Green Apple · Cucumber · Zero Added Water',
    subtitleZh: '鲜西芹 · 青苹果 · 水嫩黄瓜 · 滴水不加',
    category: ['drinks', 'under-500'],
    price: 9.9,
    calories: 65,
    protein: 2,
    carbs: 14,
    fat: 0,
    fiber: 3,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    description: 'Hydraulic cold-pressed fresh celery stalks, Granny Smith green apples, English cucumber, and fresh ginger. No water added, no added sugar, nutrient density intact.',
    descriptionZh: '采用工业级冷压慢榨机压榨，保留整株西芹、青苹果、黄瓜与少许柠檬生姜的所有活性酶与维他命，滴水不加，肠胃清爽零负担。',
    ingredients: ['Crisp Celery', 'Granny Smith Apple', 'Cucumber', 'Lemon Juice', 'Ginger Root'],
    ingredientsZh: ['新鲜西芹', '青苹果', '清爽黄瓜', '鲜柠檬汁', '微量生姜'],
    prepMethod: 'Cold-Pressed Hydraulic Extraction',
    prepMethodZh: '原汁冷压慢榨',
  }
];

const allMeals = [...itemsConfig, ...drinkItems];

let newFileContent = `import { MealItem, MealPlan, CustomOption, Review } from '../types';

export const MEAL_ITEMS: MealItem[] = ${JSON.stringify(allMeals, null, 2)};

${afterMealItems}`;

fs.writeFileSync('src/data/menuData.ts', newFileContent, 'utf8');
console.log('Successfully updated src/data/menuData.ts with all 24 ala carte items!');
