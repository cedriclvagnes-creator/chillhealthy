export interface InstagramPost {
  id: string;
  category: 'all' | 'bento' | 'kitchen' | 'customer' | 'tips';
  imageUrl: string;
  type: 'photo' | 'carousel' | 'reel';
  likes: number;
  comments: number;
  dateEn: string;
  dateZh: string;
  captionEn: string;
  captionZh: string;
  tags: string[];
  relatedMealName?: string;
  relatedMealId?: string;
}

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'ig-post-1',
    category: 'bento',
    type: 'carousel',
    imageUrl: 'https://admin.chillhealthy.com/uploads/h2ia7y6vd60ogckg84.jpg',
    likes: 542,
    comments: 38,
    dateEn: 'Yesterday',
    dateZh: '昨天',
    captionEn: 'Fresh batch of our Combo Salmon & Sous-Vide Tender Chicken! Golden seared Norwegian salmon fillet with 52g of clean protein. Prepared fresh this morning for our Klang Valley office deliveries. Swipe to see the macro breakdown! 🍱✨',
    captionZh: '今日新鲜出炉的挪威深海三文鱼搭配嫩鸡胸双拼餐盒！单份富含52g优质高蛋白，外焦内嫩，搭配香甜玉米、日本毛豆和高纤糙米。巴生河流域每日准时配送！🍱✨',
    tags: ['#chillhealthybox', '#sousvidebento', '#eatcleanmalaysia', '#klangfood', '#macrobowls'],
    relatedMealName: 'Combo Salmon & Chicken',
    relatedMealId: 'prod-10',
  },
  {
    id: 'ig-post-2',
    category: 'kitchen',
    type: 'reel',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    likes: 689,
    comments: 54,
    dateEn: '2 days ago',
    dateZh: '2天前',
    captionEn: 'Inside the CHILL Healthy central kitchen: 64°C constant temperature sous-vide bath in action! ⏱️ Why is our chicken breast never dry or chalky? Gentle vacuum cooking locks in 100% of natural meat juices with ZERO added oil or preservatives.',
    captionZh: '探秘潮轻食中央厨房：64°C恒温慢煮实拍！为什么我们的鸡胸肉嫩滑多汁毫无柴感？法式真空低温慢煮技术，紧锁肉汁原味，零多余油脂与防腐剂。',
    tags: ['#chillhealthybox', '#sousvidesecrets', '#cleaneating', '#zeromsg', '#kitchenstories'],
  },
  {
    id: 'ig-post-3',
    category: 'bento',
    type: 'photo',
    imageUrl: 'https://admin.chillhealthy.com/uploads/d1j2uwbv4mgowsccow.jpg',
    likes: 478,
    comments: 29,
    dateEn: '3 days ago',
    dateZh: '3天前',
    captionEn: 'Rainy afternoon calls for our signature Chi Kut Teh (潮式清补鸡骨茶)! Angelica herbs, wolfberries, and slow-simmered lean chicken with aromatic shiitake broth. Zero pork lard, purely nourishing comfort. 🍲',
    captionZh: '雨天最适合来一碗招牌潮式清补鸡骨茶！精选当归、红枣、枸杞草本，搭配鲜嫩去皮鸡肉与香菇清炖慢熬，甘醇清爽，零动物油脂负担。🍲',
    tags: ['#chillhealthybox', '#chikutteh', '#healthycomfortfood', '#klanghealthyfood'],
    relatedMealName: 'Chi Kut Teh',
    relatedMealId: 'prod-20',
  },
  {
    id: 'ig-post-4',
    category: 'customer',
    type: 'carousel',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    likes: 615,
    comments: 42,
    dateEn: '4 days ago',
    dateZh: '4天前',
    captionEn: 'Customer Tag of the Week! 📸 Shoutout to the Subang Jaya accounting team ordering 12 bentos daily on our 4-Person Corporate Plan. "Finally a healthy lunch that actually tastes like home-cooked comfort!" Thank you for trusting @chillhealthybox!',
    captionZh: '本周顾客晒图精选！📸 感谢梳邦再也团队连续订购4人企业健康餐配套：“终于找到一家既健康、清爽又像家常菜一样入味的健康餐盒！” 感谢大家对 @chillhealthybox 的支持！',
    tags: ['#chillhealthybox', '#customertags', '#officelunchkl', '#subangfoodie', '#teamlunch'],
  },
  {
    id: 'ig-post-5',
    category: 'bento',
    type: 'photo',
    imageUrl: 'https://admin.chillhealthy.com/uploads/1uijdxelztq8w0s80o.jpg',
    likes: 395,
    comments: 24,
    dateEn: '5 days ago',
    dateZh: '5天前',
    captionEn: 'Golden Garlic Roasted Chicken bento fresh off the convection grill! 🧄 44g protein, under 480 kcal. Seasoned with crushed roasted garlic cloves, rosemary sprigs, and extra virgin olive oil.',
    captionZh: '刚出炉的金蒜香烤鸡胸餐盒！🧄 44g优质蛋白质，热量严控在480大卡内。金黄焙香蒜蓉与迷迭香天然腌制，香气扑鼻，是减脂期的必选人气王！',
    tags: ['#chillhealthybox', '#goldengarlic', '#highprotein', '#lowcaloriebento'],
    relatedMealName: 'Golden Garlic Chicken',
    relatedMealId: 'prod-19',
  },
  {
    id: 'ig-post-6',
    category: 'tips',
    type: 'carousel',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    likes: 528,
    comments: 47,
    dateEn: '6 days ago',
    dateZh: '6天前',
    captionEn: 'Macro Nutrition Guide: How to choose your lunch when aiming for fat loss vs muscle gain? 🥗 Check our Calorie Matcher tool on chillhealthy.com or drop us a DM on @chillhealthybox for customized meal advice!',
    captionZh: '轻食营养搭配指南：减脂期与增肌期该如何挑选热量？🥗 欢迎使用官网热量匹配工具，或直接在 Instagram @chillhealthybox 私信我们获取一对一定制建议！',
    tags: ['#chillhealthybox', '#nutritiontips', '#caloriedeficit', '#fitnessmalaysia'],
  },
  {
    id: 'ig-post-7',
    category: 'kitchen',
    type: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=800&q=80',
    likes: 462,
    comments: 31,
    dateEn: '1 week ago',
    dateZh: '1周前',
    captionEn: '7:30 AM Farm-to-Kitchen arrivals: Crisp Japanese cucumbers, heirloom sweet cherry tomatoes, and pesticide-tested broccoli. We only prep what we deliver on the same day for peak crunch and vitamin retention. 🥦',
    captionZh: '清晨7:30的新鲜蔬菜到店：高山清甜樱桃番茄、有机西兰花与日本小青瓜。坚持当日新鲜采买现做，确保每一份蔬菜爽脆可口，锁住天然营养素。🥦',
    tags: ['#chillhealthybox', '#freshingredients', '#sustainableeating', '#farmtotable'],
  },
  {
    id: 'ig-post-8',
    category: 'customer',
    type: 'reel',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    likes: 734,
    comments: 65,
    dateEn: '1 week ago',
    dateZh: '1周前',
    captionEn: 'Unboxing our 20-Meal Slim Fit Monthly Plan! 📦 Heat-safe sugarcane eco-containers, leak-proof sous-vide sauce cups, and color-coded labels with full macro counts. Tag @chillhealthybox on your next reel for a RM10 voucher!',
    captionZh: '开箱20餐月度健康享瘦餐！📦 选用甘蔗环保热封餐盒，隔水加热安全无异味，附带精准卡路里与营养标贴。发布便当开箱并 @chillhealthybox，即可领取RM10专属折扣券！',
    tags: ['#chillhealthybox', '#unboxingvideo', '#ecofriendlybento', '#mealprepcommunity'],
  },
];
