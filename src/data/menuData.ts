import { MealItem, MealPlan, CustomOption, Review } from '../types';

export const MEAL_ITEMS: MealItem[] = [
  {
    "id": "prod-20",
    "originalId": "20",
    "name": "Chi Kut Teh",
    "nameZh": "潮式清补鸡骨茶",
    "subtitle": "Heritage Herbal Broth · Free-Range Chicken · Brown Rice",
    "subtitleZh": "草本慢熬清补 · 无油脂负担 · 养生糙米",
    "category": [
      "signature",
      "under-500"
    ],
    "price": 15.9,
    "calories": 460,
    "protein": 38,
    "carbs": 48,
    "fat": 9,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/d1j2uwbv4mgowsccow.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "CHILL Healthy’s legendary clean herbal broth soup infused with traditional Angelica, goji berries, garlic, and lean chicken. Warm, deeply comforting, and prepared without pork lard or heavy oil.",
    "descriptionZh": "CHILL Healthy 招牌首创清补养生鸡骨茶！精选当归、红枣、枸杞及大蒜，搭配去皮嫩鸡肉与香菇清炖慢熬，甘温醇厚，零动物油脂负担，暖心暖胃。",
    "ingredients": [
      "Lean Chicken",
      "Herbal Broth Base (Angelica, Wolfberry, Licorice)",
      "Shiitake Mushroom",
      "Tofu Puffs",
      "Organic Brown Rice",
      "Bok Choy"
    ],
    "ingredientsZh": [
      "农场鲜嫩鸡肉",
      "天然本草汤底(当归、枸杞、甘草)",
      "精选香菇",
      "豆卜豆腐泡",
      "有机糙米",
      "清脆青梗菜"
    ],
    "allergens": [
      "Soy"
    ],
    "allergensZh": [
      "大豆"
    ],
    "prepMethod": "Slow Simmered Heritage Broth",
    "prepMethodZh": "草本慢火清炖"
  },
  {
    "id": "prod-10",
    "originalId": "10",
    "name": "Combo Salmon & Chicken",
    "nameZh": "三文鱼与鸡肉双拼餐盒",
    "subtitle": "Dual High-Protein Power · Grilled Salmon & Tender Chicken",
    "subtitleZh": "双重高蛋白能量 · 香煎深海三文鱼搭配嫩鸡胸",
    "category": [
      "signature",
      "high-protein"
    ],
    "price": 21.9,
    "calories": 590,
    "protein": 52,
    "carbs": 45,
    "fat": 18,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/h2ia7y6vd60ogckg84.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "The ultimate fitness fuel. Featuring golden pan-seared Norwegian salmon fillet paired with lean grilled chicken breast, fiber-rich brown rice, fresh edamame, sweet corn, and broccoli.",
    "descriptionZh": "增肌燃脂终极双拼！外焦内嫩的深海三文鱼排搭配香烤嫩鸡胸肉，一餐摄入超过50g优质蛋白，搭配有机糙米饭、甜玉米、西兰花及日本毛豆仁。",
    "ingredients": [
      "Norwegian Salmon",
      "Grilled Chicken Breast",
      "Organic Brown Rice",
      "Steamed Broccoli",
      "Sweet Corn",
      "Japanese Edamame",
      "Olive Oil"
    ],
    "ingredientsZh": [
      "挪威三文鱼排",
      "香烤鸡胸肉",
      "有机原粒糙米",
      "鲜西兰花",
      "甜玉米粒",
      "日式毛豆仁",
      "冷压橄榄油"
    ],
    "allergens": [
      "Fish",
      "Soy"
    ],
    "allergensZh": [
      "鱼类",
      "大豆"
    ],
    "prepMethod": "Pan-Seared & Light Oven Roast",
    "prepMethodZh": "轻煎与原味烘烤"
  },
  {
    "id": "prod-19",
    "originalId": "19",
    "name": "Golden Garlic Chicken",
    "nameZh": "金蒜香烤鸡胸餐盒",
    "subtitle": "Aromatic Roasted Garlic Glaze · Juicy Lean Chicken",
    "subtitleZh": "浓郁焙烤蒜香 · 多汁嫩烤鸡胸",
    "category": [
      "high-protein",
      "under-500"
    ],
    "price": 15.9,
    "calories": 470,
    "protein": 44,
    "carbs": 46,
    "fat": 10,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/1uijdxelztq8w0s80o.jpg",
    "isPopular": true,
    "description": "Juicy chicken breast marinated with golden crushed garlic and herbs, oven-baked to succulent tenderness. Served with steamed brown rice and vibrant garden greens.",
    "descriptionZh": "精选鲜嫩鸡胸肉，以金黄香蒜与天然香草精心腌制入味，高温烘烤锁住肉汁，蒜香浓郁扑鼻，搭配高纤糙米与新鲜时蔬，健康营养满分。",
    "ingredients": [
      "Fresh Chicken Breast",
      "Roasted Garlic",
      "Organic Brown Rice",
      "Steamed Broccoli",
      "Carrots",
      "Sea Salt",
      "Extra Virgin Olive Oil"
    ],
    "ingredientsZh": [
      "农场鲜鸡胸肉",
      "焙香大蒜",
      "有机糙米",
      "清蒸西兰花",
      "胡萝卜",
      "天然海盐",
      "特级初榨橄榄油"
    ],
    "prepMethod": "Herb Oven Baked",
    "prepMethodZh": "香草高温慢烤"
  },
  {
    "id": "prod-16",
    "originalId": "16",
    "name": "Golden Prawn Omelette",
    "nameZh": "金黄香煎虾仁烘蛋餐盒",
    "subtitle": "Succulent Prawns · Fluffy Egg · Nutrient-Dense Greens",
    "subtitleZh": "鲜嫩饱满虾仁 · 蓬松蛋香 · 均衡健康时蔬",
    "category": [
      "signature",
      "high-protein",
      "under-500"
    ],
    "price": 15.9,
    "calories": 450,
    "protein": 36,
    "carbs": 42,
    "fat": 14,
    "fiber": 5,
    "image": "https://admin.chillhealthy.com/uploads/y92l27dzynko4kock.jpg",
    "isPopular": true,
    "description": "Plump wild sea prawns folded into farm-fresh fluffy eggs with spring onions and a touch of white pepper, lightly pan-seared with minimum oil. Paired with warm brown rice and greens.",
    "descriptionZh": "精选大颗鲜甜海虾仁，融入农场走地鸡蛋与细葱花，小火少油慢烘至金黄蓬松，香气四溢，搭配糙米饭与清脆蔬菜，高蛋白低负担。",
    "ingredients": [
      "Wild Sea Prawns",
      "Farm Eggs",
      "Spring Onions",
      "Organic Brown Rice",
      "Steamed Vegetables",
      "White Pepper"
    ],
    "ingredientsZh": [
      "野生海虾仁",
      "优质农场鸡蛋",
      "鲜葱花",
      "有机原粒糙米",
      "清蒸健康时蔬",
      "白胡椒"
    ],
    "allergens": [
      "Crustacean",
      "Egg"
    ],
    "allergensZh": [
      "甲壳类",
      "蛋类"
    ],
    "prepMethod": "Light Pan Sear",
    "prepMethodZh": "少油金黄轻烘"
  },
  {
    "id": "prod-13",
    "originalId": "13",
    "name": "Grilled Black Pepper Chicken",
    "nameZh": "黑胡椒烤鸡胸餐盒",
    "subtitle": "Cracked Sarawak Peppercorn · Bold Savory Flavor",
    "subtitleZh": "砂拉越黑胡椒香气 · 浓郁鲜嫩无多余油脂",
    "category": [
      "high-protein",
      "under-500"
    ],
    "price": 13.9,
    "calories": 460,
    "protein": 43,
    "carbs": 47,
    "fat": 9,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/rqooi0lb6yo08gkgc8.jpg",
    "isPopular": true,
    "description": "Tender chicken breast coated in freshly cracked black pepper sauce made from scratch without cornstarch slurry or MSG. Served alongside wholesome brown rice and farm vegetables.",
    "descriptionZh": "严选砂拉越手磨纯黑胡椒，特调无淀粉健康轻黑椒酱，均匀裹附在多汁烤鸡胸肉上，微辣辛香开胃，搭配热气腾腾的糙米饭与健康蒸菜。",
    "ingredients": [
      "Chicken Breast",
      "Sarawak Black Pepper",
      "Organic Brown Rice",
      "Broccoli",
      "Cherry Tomatoes",
      "Low-Sodium Soy Glaze"
    ],
    "ingredientsZh": [
      "鲜鸡胸肉",
      "砂拉越纯黑胡椒",
      "有机糙米",
      "鲜西兰花",
      "小番茄",
      "低钠秘制酱汁"
    ],
    "allergens": [
      "Soy"
    ],
    "allergensZh": [
      "大豆"
    ],
    "prepMethod": "Flame Grilled",
    "prepMethodZh": "原香炙烤"
  },
  {
    "id": "prod-14",
    "originalId": "14",
    "name": "Grilled Korean Chicken",
    "nameZh": "韩式秘酱烤鸡餐盒",
    "subtitle": "Gochujang Spiced · Sesame Glaze · Balanced Heat",
    "subtitleZh": "韩式轻发酵辣酱 · 焙煎芝麻提香 · 开胃下饭",
    "category": [
      "high-protein",
      "under-500"
    ],
    "price": 13.9,
    "calories": 480,
    "protein": 42,
    "carbs": 49,
    "fat": 11,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/uapypptvpdwg0ggsc.jpg",
    "isPopular": true,
    "description": "Juicy chicken breast glazed with traditional Korean gochujang, toasted sesame, and apple cider reduction. Savory, sweet, and tangy with vibrant healthy sides.",
    "descriptionZh": "精研改良韩式轻食酱料，结合发酵辣酱与苹果醋甘甜，炙烤入味，肉质鲜嫩不发柴，香气浓郁微辣诱人，配以糙米饭与季节时蔬。",
    "ingredients": [
      "Chicken Breast",
      "Korean Gochujang",
      "Sesame Oil",
      "Organic Brown Rice",
      "Sweet Corn",
      "Carrots",
      "Edamame"
    ],
    "ingredientsZh": [
      "鲜鸡胸肉",
      "韩式辣椒酱",
      "纯芝麻油",
      "有机糙米",
      "甜玉米粒",
      "胡萝卜",
      "毛豆仁"
    ],
    "allergens": [
      "Soy",
      "Sesame"
    ],
    "allergensZh": [
      "大豆",
      "芝麻"
    ],
    "prepMethod": "Glazed & Grilled",
    "prepMethodZh": "刷酱炙烤"
  },
  {
    "id": "prod-22",
    "originalId": "22",
    "name": "Grilled Korean Salad Bowl",
    "nameZh": "韩式烤鸡轻食温沙拉碗",
    "subtitle": "Zero Heavy Carbs · Fresh Greens · House Dressing",
    "subtitleZh": "低碳无负担 · 水培爽脆生菜 · 特调清爽酱汁",
    "category": [
      "low-carb",
      "under-500"
    ],
    "price": 15.9,
    "calories": 360,
    "protein": 38,
    "carbs": 18,
    "fat": 14,
    "fiber": 8,
    "image": "https://admin.chillhealthy.com/uploads/21q2qlhhq2v40ccwko.jpg",
    "isPopular": true,
    "description": "Crisp mixed salad greens loaded with Korean-spiced grilled chicken slices, cherry tomatoes, cucumbers, and roasted sesame with light vinaigrette on the side.",
    "descriptionZh": "清爽减脂首选！精选多种新鲜无公害水培生菜、小番茄与爽脆小黄瓜，铺上热腾腾的韩式烤鸡肉条与熟芝麻，淋上特调轻醋汁，低卡爽口饱腹。",
    "ingredients": [
      "Grilled Korean Chicken",
      "Mixed Salad Greens",
      "Cherry Tomatoes",
      "Japanese Cucumber",
      "Toasted Sesame",
      "Light Vinaigrette"
    ],
    "ingredientsZh": [
      "韩式烤鸡条",
      "综合新鲜生菜",
      "小番茄",
      "日本小黄瓜",
      "焙香芝麻",
      "特调轻沙拉汁"
    ],
    "allergens": [
      "Soy",
      "Sesame"
    ],
    "allergensZh": [
      "大豆",
      "芝麻"
    ],
    "prepMethod": "Fresh Tossed Salad",
    "prepMethodZh": "鲜切拌沙拉"
  },
  {
    "id": "prod-28",
    "originalId": "28",
    "name": "Grilled Shrimp Salad Bowl",
    "nameZh": "鲜烤大虾轻食沙拉碗",
    "subtitle": "Seared Wild Sea Prawns · Garden Greens · Omega Olive Oil",
    "subtitleZh": "鲜烤海大虾 · 脆爽花园生菜 · 优质特级橄榄油",
    "category": [
      "low-carb",
      "under-500",
      "high-protein"
    ],
    "price": 18.9,
    "calories": 340,
    "protein": 34,
    "carbs": 16,
    "fat": 12,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/py62an5423488s8ooc.png",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "Succulent grilled sea prawns seasoned with sea salt and herbs atop a mountain of fresh crispy salad leaves, purple cabbage, sweet corn, and cherry tomatoes.",
    "descriptionZh": "精选大只弹牙海虾，以海盐及天然香草轻烤激发出海鲜原汁甜味，搭配新鲜脆嫩生菜、紫甘蓝、甜玉米粒及多汁小番茄，极低卡路里，高蛋白饱腹。",
    "ingredients": [
      "Grilled Sea Prawns",
      "Romaine & Butterhead Lettuce",
      "Purple Cabbage",
      "Sweet Corn",
      "Cherry Tomatoes",
      "Lemon Olive Dressing"
    ],
    "ingredientsZh": [
      "鲜烤海大虾",
      "罗马及奶油生菜",
      "紫甘蓝",
      "甜玉米粒",
      "小番茄",
      "清新柠檬橄榄汁"
    ],
    "allergens": [
      "Crustacean"
    ],
    "allergensZh": [
      "甲壳类"
    ],
    "prepMethod": "Lightly Char-Grilled & Fresh Salad",
    "prepMethodZh": "原味炙烤与鲜蔬拼配"
  },
  {
    "id": "prod-29",
    "originalId": "29",
    "name": "Grilled Shrimp with Brown Rice",
    "nameZh": "鲜烤大虾糙米餐盒",
    "subtitle": "Sweet Sea Prawns · Brown Rice Energy · Steamed Greens",
    "subtitleZh": "弹牙鲜虾 · 高纤糙米持久饱腹 · 清爽时蔬",
    "category": [
      "high-protein",
      "under-500"
    ],
    "price": 18.9,
    "calories": 470,
    "protein": 36,
    "carbs": 48,
    "fat": 10,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/2uvab1hboiucwckw4w.jpg",
    "isPopular": true,
    "description": "Plump sea prawns seared with fragrant garlic olive oil, served over wholesome whole-grain brown rice with fresh steamed broccoli and sweet carrots.",
    "descriptionZh": "鲜嫩饱满的优质海虾以蒜香初榨橄榄油轻煎，搭配高纤维原粒糙米饭、清甜西兰花与胡萝卜，鲜美不油腻，完美平衡碳水与高蛋白。",
    "ingredients": [
      "Sea Prawns",
      "Organic Brown Rice",
      "Broccoli Florets",
      "Carrots",
      "Garlic Olive Glaze",
      "Sea Salt"
    ],
    "ingredientsZh": [
      "优质鲜海虾",
      "有机糙米饭",
      "西兰花",
      "胡萝卜",
      "蒜香橄榄油",
      "天然海盐"
    ],
    "allergens": [
      "Crustacean"
    ],
    "allergensZh": [
      "甲壳类"
    ],
    "prepMethod": "Pan-Seared & Steamed",
    "prepMethodZh": "香煎清蒸"
  },
  {
    "id": "prod-34",
    "originalId": "34",
    "name": "Grilled Smoke Duck Salad Bowl",
    "nameZh": "香烤烟熏鸭胸轻食沙拉碗",
    "subtitle": "Rich Smoked Duck Breast · Zero Carbs · Balsamic Crisp",
    "subtitleZh": "醇香熏烤鸭胸 · 极低碳水化合物 · 意式香醋提味",
    "category": [
      "low-carb",
      "under-500"
    ],
    "price": 15.9,
    "calories": 390,
    "protein": 28,
    "carbs": 14,
    "fat": 22,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/ut0qudng9f4o0c0k4c.jpg",
    "description": "Thinly carved tender smoked duck breast pan-rendered to shed excess fat, placed over garden fresh greens, cucumber slices, sweet cherry tomatoes, and aged balsamic glaze.",
    "descriptionZh": "薄切烟熏鸭胸肉小火慢煎逼出多余油脂，外皮微微金黄，肉质柔嫩多汁且带有诱人木烟香，搭配爽脆蔬菜与低卡油醋汁，轻盈美味。",
    "ingredients": [
      "Smoked Duck Breast",
      "Mixed Crisp Greens",
      "Cherry Tomatoes",
      "Cucumbers",
      "Edamame",
      "Aged Balsamic Dressing"
    ],
    "ingredientsZh": [
      "精选烟熏鸭胸",
      "综合爽脆生菜",
      "多汁小番茄",
      "小黄瓜",
      "日式毛豆",
      "香醇意式油醋汁"
    ],
    "prepMethod": "Rendered Pan Sear",
    "prepMethodZh": "慢火逼油煎香"
  },
  {
    "id": "prod-12",
    "originalId": "12",
    "name": "Grilled Smoked Duck",
    "nameZh": "香嫩烟熏鸭胸糙米餐盒",
    "subtitle": "Smoky Aromas · Wholesome Brown Rice · Crisp Broccoli",
    "subtitleZh": "烟熏木香浓郁 · 养生高纤糙米 · 鲜嫩西兰花",
    "category": [
      "signature",
      "under-500"
    ],
    "price": 13.9,
    "calories": 510,
    "protein": 32,
    "carbs": 48,
    "fat": 18,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/ut0qudng9f4o0c0k4c.jpg",
    "description": "Aromatic smoked duck slices grilled until the skin is lightly crisp and excess fat rendered away. Served with wholesome brown rice and farm-steamed broccoli florets.",
    "descriptionZh": "特制烟熏鸭胸经高温轻烤，去除多余油脂同时保留鲜甜肉质与浓郁烟熏香气，搭配热气腾腾的有机糙米饭与清甜西兰花，美味下饭。",
    "ingredients": [
      "Smoked Duck Slices",
      "Organic Brown Rice",
      "Steamed Broccoli",
      "Carrots",
      "Black Pepper",
      "Natural Seasoning"
    ],
    "ingredientsZh": [
      "精选烟熏鸭胸肉片",
      "有机糙米",
      "清蒸西兰花",
      "胡萝卜",
      "现磨黑胡椒",
      "天然调味"
    ],
    "prepMethod": "Crisp Grilled & Steamed",
    "prepMethodZh": "高温香烤与原味蒸煮"
  },
  {
    "id": "prod-24",
    "originalId": "24",
    "name": "Herbed Chicken Mince Pasta",
    "nameZh": "意式香草鸡肉碎全麦意面",
    "subtitle": "Al Dente Pasta · Lean Minced Chicken · Tomato Herb Sauce",
    "subtitleZh": "弹牙全麦意面 · 精瘦低脂鸡肉碎 · 慢熬番茄香草酱",
    "category": [
      "high-protein"
    ],
    "price": 18.9,
    "calories": 530,
    "protein": 44,
    "carbs": 56,
    "fat": 12,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/yjocs3fc6xw08ccgog.jpg",
    "isPopular": true,
    "description": "Al dente Italian whole-wheat spaghetti tossed in an aromatic slow-simmered tomato sauce loaded with lean minced chicken breast, fresh basil, oregano, and zucchini cubes.",
    "descriptionZh": "筋道全麦意面搭配用天然成熟番茄与新鲜罗勒、牛至慢熬而成的特调意式红酱，融入大量精瘦鲜鸡肉碎与嫩西葫芦丁，浓郁可口，减脂期也能尽享意面美味！",
    "ingredients": [
      "Whole Wheat Pasta",
      "Lean Minced Chicken",
      "Simmered Tomato Sauce",
      "Italian Herbs & Basil",
      "Zucchini",
      "Olive Oil"
    ],
    "ingredientsZh": [
      "全麦意面",
      "精瘦农场鸡胸肉碎",
      "慢熬番茄酱",
      "意式香草罗勒",
      "嫩西葫芦",
      "特级初榨橄榄油"
    ],
    "allergens": [
      "Gluten"
    ],
    "allergensZh": [
      "麸质"
    ],
    "prepMethod": "Simmered Sauce & Tossed",
    "prepMethodZh": "慢熬肉酱拌煮"
  },
  {
    "id": "prod-31",
    "originalId": "31",
    "name": "Hokkian Style Chicken with Brown Rice",
    "nameZh": "福建风味焖鸡肉糙米餐",
    "subtitle": "Heritage Soy Reduction · Tender Chicken · Shiitake & Garlic",
    "subtitleZh": "传统古法酱香 · 嫩滑多汁鸡块 · 鲜香菇与整颗大蒜",
    "category": [
      "signature",
      "high-protein",
      "under-500"
    ],
    "price": 15.9,
    "calories": 490,
    "protein": 41,
    "carbs": 50,
    "fat": 11,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/r12gdsxp8xcsk0goo4.jpg",
    "isPopular": true,
    "description": "Inspired by traditional Hokkien home-cooking. Lean chicken braised in a savory, aromatic reduction of premium dark soy, whole garlic cloves, and shiitake mushrooms with zero lard.",
    "descriptionZh": "传承福建家常古早风味，选用精选去皮嫩鸡肉，搭配整颗大蒜、优质香菇及天然酿造酱油轻慢焖煮，酱香醇厚入味，完全摒弃传统多余猪油，暖心下饭。",
    "ingredients": [
      "Chicken Thigh & Breast",
      "Shiitake Mushrooms",
      "Whole Garlic",
      "Premium Dark Soy",
      "Organic Brown Rice",
      "Steamed Bok Choy"
    ],
    "ingredientsZh": [
      "去皮嫩鸡肉",
      "天然香菇",
      "整颗大蒜",
      "传统特级黑酱油",
      "有机糙米",
      "清脆青梗菜"
    ],
    "allergens": [
      "Soy"
    ],
    "allergensZh": [
      "大豆"
    ],
    "prepMethod": "Traditional Braised with Zero Lard",
    "prepMethodZh": "少油古法轻焖"
  },
  {
    "id": "prod-26",
    "originalId": "26",
    "name": "Omega Grilled Salmon",
    "nameZh": "深海Omega炙烤三文鱼糙米餐盒",
    "subtitle": "Crispy Skin Salmon · Heart-Healthy Fats · Brown Rice",
    "subtitleZh": "酥脆金黄鱼皮 · 丰富深海鱼油 · 有机高纤糙米",
    "category": [
      "signature",
      "high-protein"
    ],
    "price": 18.9,
    "calories": 540,
    "protein": 40,
    "carbs": 46,
    "fat": 20,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/670318xg9o8wgggcw.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "Fresh Atlantic salmon fillet pan-seared skin-down for that satisfying crunch, retaining its naturally rich Omega-3 oils. Served with brown rice, sweet corn, and crisp broccoli florets.",
    "descriptionZh": "严选大西洋优质三文鱼排，高温轻煎锁住鲜嫩原汁，外皮焦脆，富含天然深海Omega-3脂肪酸，搭配有机糙米、甜玉米粒与西兰花，营养极为丰富。",
    "ingredients": [
      "Atlantic Salmon Fillet",
      "Organic Brown Rice",
      "Steamed Broccoli",
      "Sweet Corn",
      "Lemon Wedge",
      "Sea Salt & Pepper"
    ],
    "ingredientsZh": [
      "大西洋三文鱼排",
      "有机原粒糙米",
      "清蒸西兰花",
      "甜玉米粒",
      "鲜柠檬角",
      "海盐黑胡椒"
    ],
    "allergens": [
      "Fish"
    ],
    "allergensZh": [
      "鱼类"
    ],
    "prepMethod": "Pan-Seared Crispy Skin",
    "prepMethodZh": "香煎脆皮"
  },
  {
    "id": "prod-36",
    "originalId": "36",
    "name": "Omega Grilled Salmon Salad Bowl",
    "nameZh": "深海炙烤三文鱼轻食沙拉碗",
    "subtitle": "Zero Grain Carbs · Fresh Salmon Flakes · Vibrant Greens",
    "subtitleZh": "零谷物碳水负担 · 大块香煎三文鱼 · 鲜爽高纤水培生菜",
    "category": [
      "signature",
      "low-carb",
      "high-protein",
      "under-500"
    ],
    "price": 18.9,
    "calories": 380,
    "protein": 36,
    "carbs": 12,
    "fat": 19,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/k7zdnjq9nhcgkskg4.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "Pan-seared Norwegian salmon steak served over a generous bowl of hydro-crisp mixed lettuces, edamame, cherry tomatoes, and cucumber, accompanied by a light lemon vinaigrette.",
    "descriptionZh": "生酮减脂强推！整块外焦里嫩的挪威三文鱼，搭配大份爽脆水培生菜、日本毛豆仁、新鲜小番茄与黄瓜片，佐以特调青柠清爽油醋汁，美味低卡轻盈。",
    "ingredients": [
      "Norwegian Salmon Fillet",
      "Crisp Hydroponic Lettuce",
      "Japanese Edamame",
      "Cherry Tomatoes",
      "Cucumbers",
      "Lemon Herb Vinaigrette"
    ],
    "ingredientsZh": [
      "挪威三文鱼排",
      "水培鲜嫩生菜",
      "日式毛豆仁",
      "小番茄",
      "黄瓜片",
      "柠檬香草轻醋汁"
    ],
    "allergens": [
      "Fish",
      "Soy"
    ],
    "allergensZh": [
      "鱼类",
      "大豆"
    ],
    "prepMethod": "Light Sear & Fresh Toss",
    "prepMethodZh": "轻煎与原味生拌"
  },
  {
    "id": "prod-30",
    "originalId": "30",
    "name": "Rempah Chicken Brown Rice",
    "nameZh": "马来香料Rempah鸡肉糙米餐",
    "subtitle": "Lemongrass, Galangal & Turmeric · Fragrant & Lean",
    "subtitleZh": "香茅、南姜与野生姜黄慢腌 · 浓郁芳香低卡健康",
    "category": [
      "signature",
      "high-protein",
      "under-500"
    ],
    "price": 15.9,
    "calories": 480,
    "protein": 43,
    "carbs": 47,
    "fat": 10,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/36yvg4y1z0aoc0wwsg.jpg",
    "isPopular": true,
    "description": "Authentic Southeast Asian flavors without the deep-fried oil! Chicken breast marinated with fresh lemongrass, galangal, turmeric, and shallots, then roasted to golden perfection.",
    "descriptionZh": "告别高热量传统炸鸡！选用新鲜香茅、南姜、天然姜黄及红葱头调制独家健康Rempah香料糊，低温腌制入味后高温无油轻烤，辛香扑鼻多汁，配有机糙米饭。",
    "ingredients": [
      "Chicken Breast",
      "Fresh Lemongrass",
      "Galangal",
      "Turmeric",
      "Shallots",
      "Organic Brown Rice",
      "Steamed Vegetables"
    ],
    "ingredientsZh": [
      "农场鲜鸡胸",
      "新鲜香茅",
      "南姜",
      "野生天然姜黄",
      "红葱头",
      "有机糙米",
      "清蒸健康蔬菜"
    ],
    "prepMethod": "Spice Marinated & Oven Roasted",
    "prepMethodZh": "秘制香料慢腌香烤"
  },
  {
    "id": "prod-18",
    "originalId": "18",
    "name": "Signature Chicken Patty",
    "nameZh": "招牌手打多汁鸡肉饼餐盒",
    "subtitle": "100% Chicken Breast · Herb Infused · Juicy & Lean",
    "subtitleZh": "纯鸡胸肉手工精打 · 天然香草提味 · 嫩爽多汁不干柴",
    "category": [
      "signature",
      "high-protein",
      "under-500"
    ],
    "price": 15.9,
    "calories": 470,
    "protein": 45,
    "carbs": 44,
    "fat": 11,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/h0pwziy27xw8sgss8o.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "House-made from scratch with minced lean chicken breast, diced onions, herbs, and egg whites. Pan-seared to a golden crust while keeping the interior bursting with natural juices.",
    "descriptionZh": "CHILL Healthy 独创手工纯鸡肉饼！选用新鲜精瘦鸡胸肉细切手打，融入洋葱丁与特选香草，少油煎出诱人微焦外皮，肉汁紧锁鲜美，配以糙米饭与时蔬。",
    "ingredients": [
      "Minced Chicken Breast",
      "Egg Whites",
      "Diced Onions",
      "Fresh Parsley",
      "Organic Brown Rice",
      "Steamed Vegetables"
    ],
    "ingredientsZh": [
      "精打鸡胸肉碎",
      "农场蛋白",
      "新鲜洋葱丁",
      "欧芹香草",
      "有机原粒糙米",
      "清蒸鲜蔬"
    ],
    "allergens": [
      "Egg"
    ],
    "allergensZh": [
      "蛋类"
    ],
    "prepMethod": "Hand-Shaped & Pan Grilled",
    "prepMethodZh": "手工制作微焦轻煎"
  },
  {
    "id": "prod-23",
    "originalId": "23",
    "name": "Signature Sauce Chicken Salad Bowl",
    "nameZh": "招牌秘制酱汁鸡肉沙拉碗",
    "subtitle": "Signature Dressing · Juicy Sliced Chicken · Crisp Salad",
    "subtitleZh": "独家特调秘制酱汁 · 鲜嫩多汁鸡肉切片 · 爽口健康水培生菜",
    "category": [
      "low-carb",
      "under-500"
    ],
    "price": 15.9,
    "calories": 370,
    "protein": 40,
    "carbs": 16,
    "fat": 13,
    "fiber": 8,
    "image": "https://admin.chillhealthy.com/uploads/11xwx4yb8qk0ss00s.jpg",
    "isPopular": true,
    "description": "Generous tender chicken breast slices drizzled with our house-recipe low-sodium signature sauce, set on a bed of fresh mixed greens, cucumbers, carrots, and cherry tomatoes.",
    "descriptionZh": "铺满大片鲜嫩多汁的无油烤鸡胸肉，淋上主厨特调低卡招牌秘制轻酱汁，搭配清甜爽口的新鲜水培生菜、小黄瓜丁与胡萝卜丝，口感多层次，减脂大满足。",
    "ingredients": [
      "Grilled Chicken Breast",
      "House Signature Sauce",
      "Mixed Lettuce Greens",
      "Cherry Tomatoes",
      "Cucumbers",
      "Carrot Slaw"
    ],
    "ingredientsZh": [
      "香烤鲜鸡胸肉片",
      "独家招牌低卡酱汁",
      "综合新鲜生菜",
      "小番茄",
      "黄瓜丁",
      "胡萝卜丝"
    ],
    "allergens": [
      "Soy"
    ],
    "allergensZh": [
      "大豆"
    ],
    "prepMethod": "Fresh Tossed & Drizzled",
    "prepMethodZh": "鲜蔬配比与特调淋酱"
  },
  {
    "id": "prod-33",
    "originalId": "33",
    "name": "Silky Prawn Paste Salad Bowl",
    "nameZh": "滑嫩手打虾滑轻食沙拉碗",
    "subtitle": "Hand-Made 100% Prawn Paste · Light Poached · Low Carb",
    "subtitleZh": "100%纯海虾手工打滑 · 清水慢灼弹牙 · 极低碳水",
    "category": [
      "signature",
      "low-carb",
      "under-500",
      "high-protein"
    ],
    "price": 15.9,
    "calories": 330,
    "protein": 35,
    "carbs": 14,
    "fat": 9,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/s758qce1itwss44wo0.jpg",
    "isPopular": true,
    "isChefSpecial": true,
    "description": "Pure wild prawn paste hand-whipped to bouncy perfection, gently poached to lock in oceanic sweetness. Served over a refreshing bed of garden salads with light dressing.",
    "descriptionZh": "纯天然鲜虾手工打制，不添加多余淀粉与添加剂，热水慢灼至晶莹透亮、口感紧致弹牙，散发纯粹海鲜清甜，搭配多款爽脆生菜，高蛋白低热量。",
    "ingredients": [
      "100% Sea Prawn Paste",
      "Garden Salad Mix",
      "Purple Cabbage",
      "Sweet Corn",
      "Cherry Tomatoes",
      "Light Sesame Shoyu Dressing"
    ],
    "ingredientsZh": [
      "100%纯海虾滑",
      "花园生菜综合包",
      "紫甘蓝",
      "甜玉米粒",
      "小番茄",
      "特调轻芝麻和风汁"
    ],
    "allergens": [
      "Crustacean",
      "Sesame"
    ],
    "allergensZh": [
      "甲壳类",
      "芝麻"
    ],
    "prepMethod": "Gentle Poaching",
    "prepMethodZh": "原汤慢灼"
  },
  {
    "id": "prod-17",
    "originalId": "17",
    "name": "Soba Chicken Patty",
    "nameZh": "手打鸡肉饼日式荞麦冷面",
    "subtitle": "100% Buckwheat Soba · Handcrafted Chicken Patty · Light Shoyu",
    "subtitleZh": "纯荞麦慢消化主食 · 手工多汁鸡肉饼 · 清爽和风汁",
    "category": [
      "signature",
      "under-500"
    ],
    "price": 15.9,
    "calories": 470,
    "protein": 42,
    "carbs": 52,
    "fat": 10,
    "fiber": 7,
    "image": "https://admin.chillhealthy.com/uploads/4rukn1oe6w00cgoow4.jpg",
    "isPopular": true,
    "description": "Chilled Japanese buckwheat soba noodles served with our juicy handcrafted chicken patty, crisp cucumber strips, roasted seaweed nori, and a light dashi shoyu dipping sauce.",
    "descriptionZh": "低升糖高纤维的日式纯荞麦面，经过冰水过凉筋道爽滑，搭配金黄焦香的独创手工鸡肉饼、黄瓜丝及香脆紫菜，蘸上特调清爽和风酱汁，炎炎夏日极佳轻食。",
    "ingredients": [
      "Buckwheat Soba Noodles",
      "Signature Chicken Patty",
      "Japanese Cucumber",
      "Shredded Nori",
      "Light Dashi Shoyu",
      "White Sesame"
    ],
    "ingredientsZh": [
      "日式高纤荞麦面",
      "招牌手打鸡肉饼",
      "日本小黄瓜丝",
      "香脆海苔丝",
      "和风昆布清酱油",
      "焙煎白芝麻"
    ],
    "allergens": [
      "Gluten",
      "Soy",
      "Egg"
    ],
    "allergensZh": [
      "麸质",
      "大豆",
      "蛋类"
    ],
    "prepMethod": "Chilled Soba & Pan Seared Patty",
    "prepMethodZh": "冰镇冷面与少油轻煎"
  },
  {
    "id": "prod-32",
    "originalId": "32",
    "name": "Tempeh with Brown Rice",
    "nameZh": "高纤印尼天贝养生糙米餐",
    "subtitle": "Plant-Based Fermented Protein · Pan-Grilled Crispy Tempeh",
    "subtitleZh": "植物性优质发酵蛋白 · 香煎焦香天贝 · 养生糙米",
    "category": [
      "plant-based",
      "under-500"
    ],
    "price": 15.9,
    "calories": 440,
    "protein": 26,
    "carbs": 55,
    "fat": 12,
    "fiber": 12,
    "image": "https://admin.chillhealthy.com/uploads/cjjbn55mdvs48c8sw.jpg",
    "isChefSpecial": true,
    "description": "Naturally fermented non-GMO organic soybean tempeh sliced and pan-grilled until golden and nutty. A probiotic, gut-friendly protein powerhouse served with brown rice and greens.",
    "descriptionZh": "严选非转基因天然有机发酵大豆天贝，富含益生元与全植物蛋白质，小火轻煎至外皮焦脆并散发浓郁坚果豆香，搭配有机糙米饭与新鲜蔬菜，纯植物养生典范。",
    "ingredients": [
      "Organic Soybean Tempeh",
      "Organic Brown Rice",
      "Steamed Broccoli",
      "Sweet Corn",
      "Carrots",
      "Low-Sodium Soy Marinade"
    ],
    "ingredientsZh": [
      "有机发酵大豆天贝",
      "有机原粒糙米",
      "清蒸西兰花",
      "甜玉米粒",
      "胡萝卜",
      "低钠秘制豆酱"
    ],
    "allergens": [
      "Soy"
    ],
    "allergensZh": [
      "大豆"
    ],
    "prepMethod": "Pan-Grilled Fermented Tempeh",
    "prepMethodZh": "少油香煎"
  },
  {
    "id": "prod-35",
    "originalId": "35",
    "name": "Tempeh Salad Bowl",
    "nameZh": "高纤印尼天贝蔬食沙拉碗",
    "subtitle": "Superfood Plant Protein · Rainbow Greens · Probiotic Goodness",
    "subtitleZh": "超级植物蛋白力量 · 彩虹高纤时蔬 · 呵护肠道健康",
    "category": [
      "plant-based",
      "low-carb",
      "under-500"
    ],
    "price": 15.9,
    "calories": 320,
    "protein": 24,
    "carbs": 22,
    "fat": 14,
    "fiber": 11,
    "image": "https://admin.chillhealthy.com/uploads/26wlcdaied8gs8o404.jpg",
    "description": "Golden grilled tempeh cubes layered over vibrant salad greens, edamame, purple cabbage, and cucumbers. High in dietary fiber, completely cholesterol-free and delicious.",
    "descriptionZh": "素食与轻体达人至爱！金黄香煎天贝丁搭配五彩斑斓的新鲜脆嫩生菜、日式毛豆、紫甘蓝丝与黄瓜片，高膳食纤维，零胆固醇负担，清爽又充满咀嚼香气。",
    "ingredients": [
      "Pan-Seared Organic Tempeh",
      "Mixed Salad Greens",
      "Japanese Edamame",
      "Purple Cabbage",
      "Cucumbers",
      "Sesame Ginger Dressing"
    ],
    "ingredientsZh": [
      "香煎有机天贝丁",
      "综合新鲜生菜",
      "日式毛豆仁",
      "紫甘蓝",
      "爽脆黄瓜片",
      "芝麻姜汁轻沙拉汁"
    ],
    "allergens": [
      "Soy",
      "Sesame"
    ],
    "allergensZh": [
      "大豆",
      "芝麻"
    ],
    "prepMethod": "Crispy Grilled & Fresh Tossed",
    "prepMethodZh": "轻煎与蔬菜原拌"
  },
  {
    "id": "prod-25",
    "originalId": "25",
    "name": "Thai Basil Minced Chicken",
    "nameZh": "泰式打抛九层塔鸡肉碎意面",
    "subtitle": "Authentic Thai Holy Basil · Fragrant Spices · Pasta",
    "subtitleZh": "正宗泰式打抛九层塔香 · 鲜辣浓郁 · 筋道意面",
    "category": [
      "high-protein",
      "signature"
    ],
    "price": 18.9,
    "calories": 520,
    "protein": 43,
    "carbs": 54,
    "fat": 12,
    "fiber": 6,
    "image": "https://admin.chillhealthy.com/uploads/75pxr1l3wgkcg4c80g.jpg",
    "isPopular": true,
    "description": "Lean chicken breast mince wok-tossed with fresh aromatic Thai holy basil, garlic, and mild chilies, paired with hearty pasta for a flavorful Southeast Asian protein kick.",
    "descriptionZh": "经典泰式打抛风味健康改良！以鲜采九层塔罗勒、蒜末与适度温和辣椒大火快炒精瘦鸡肉碎，香气扑鼻辛香开胃，搭配弹牙意面，口口过瘾。",
    "ingredients": [
      "Minced Chicken Breast",
      "Fresh Thai Holy Basil",
      "Garlic & Mild Chili",
      "Al Dente Pasta",
      "Light Fish Sauce & Soy",
      "Olive Oil"
    ],
    "ingredientsZh": [
      "精瘦鸡肉碎",
      "新鲜泰式打抛九层塔",
      "大蒜与鲜辣椒",
      "筋道意面",
      "特调低钠鱼露轻酱",
      "冷压橄榄油"
    ],
    "allergens": [
      "Gluten",
      "Fish",
      "Soy"
    ],
    "allergensZh": [
      "麸质",
      "鱼类",
      "大豆"
    ],
    "prepMethod": "Wok Sautéed with Herbs",
    "prepMethodZh": "香草快炒与拌煮"
  },
  {
    "id": "prod-21",
    "originalId": "21",
    "name": "Wild Mushroom Stir-Fry",
    "nameZh": "野菌鲜菇养生轻食小炒餐盒",
    "subtitle": "King Oyster & Shiitake Medley · Earthy Umami · Brown Rice",
    "subtitleZh": "杏鲍菇与鲜香菇天然鲜香 · 浓郁菇香低卡养生 · 糙米饭",
    "category": [
      "plant-based",
      "under-500",
      "low-carb"
    ],
    "price": 15.9,
    "calories": 390,
    "protein": 18,
    "carbs": 52,
    "fat": 9,
    "fiber": 10,
    "image": "https://admin.chillhealthy.com/uploads/1a0lff8fu8qsowc4w8.jpg",
    "isChefSpecial": true,
    "description": "An umami-packed medley of fresh king oyster mushrooms, shiitake, and shimeji sautéed with garlic, sweet peppers, and low-sodium sauce. Served with fiber-rich brown rice.",
    "descriptionZh": "精选新鲜杏鲍菇、鲜香菇与白玉菇等多重天然珍菌，以蒜香初榨橄榄油少油轻炒，锁住菌菇独有的浓郁天然鲜味与多糖体，搭配有机糙米饭，菌香四溢。",
    "ingredients": [
      "King Oyster Mushrooms",
      "Shiitake Mushrooms",
      "Shimeji Mushrooms",
      "Organic Brown Rice",
      "Bell Peppers",
      "Garlic & Herbs"
    ],
    "ingredientsZh": [
      "新鲜杏鲍菇",
      "天然香菇",
      "白玉菇",
      "有机原粒糙米",
      "甜彩椒",
      "大蒜与香草"
    ],
    "prepMethod": "Light Garlic Olive Oil Sauté",
    "prepMethodZh": "蒜香少油温炒"
  },
  {
    "id": "drink-lemongrass-barley",
    "name": "Sugar-Free Lemongrass Barley Detox",
    "nameZh": "纯天然无糖香茅薏米水",
    "subtitle": "Zero Cane Sugar · De-bloat & Cooling Herb Drink",
    "subtitleZh": "零蔗糖添加 · 排湿消肿 · 清热利水",
    "category": [
      "drinks",
      "under-500"
    ],
    "price": 6.9,
    "calories": 45,
    "protein": 1,
    "carbs": 9,
    "fat": 0,
    "fiber": 2,
    "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    "description": "Slow-simmered holistically using premium Dutch pearl barley, fresh pandan leaves, and wild lemongrass. Naturally refreshing, zero added cane sugar or syrups.",
    "descriptionZh": "选用高品质荷兰洋薏米、新鲜斑斓叶与鲜采香茅慢火清炖数小时，完全不添加白砂糖或任何人工糖浆，天然温润微甘，利水消水肿，餐后解腻首选。",
    "ingredients": [
      "Pearl Barley",
      "Fresh Lemongrass Stalks",
      "Pandan Leaf",
      "Filtered Water",
      "Winter Melon Seed Extract"
    ],
    "ingredientsZh": [
      "精选洋薏米",
      "鲜香茅",
      "新鲜斑斓叶",
      "纯净水",
      "冬瓜子提取物"
    ],
    "prepMethod": "Slow Simmered Botanical Infusion",
    "prepMethodZh": "草本慢火清煮"
  },
  {
    "id": "drink-green-glow-cold-pressed",
    "name": "Cold-Pressed Green Glow Celery Detox",
    "nameZh": "鲜榨冷压青西芹排毒纯汁",
    "subtitle": "Celery · Green Apple · Cucumber · Zero Added Water",
    "subtitleZh": "鲜西芹 · 青苹果 · 水嫩黄瓜 · 滴水不加",
    "category": [
      "drinks",
      "under-500"
    ],
    "price": 9.9,
    "calories": 65,
    "protein": 2,
    "carbs": 14,
    "fat": 0,
    "fiber": 3,
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    "description": "Hydraulic cold-pressed fresh celery stalks, Granny Smith green apples, English cucumber, and fresh ginger. No water added, no added sugar, nutrient density intact.",
    "descriptionZh": "采用工业级冷压慢榨机压榨，保留整株西芹、青苹果、黄瓜与少许柠檬生姜的所有活性酶与维他命，滴水不加，肠胃清爽零负担。",
    "ingredients": [
      "Crisp Celery",
      "Granny Smith Apple",
      "Cucumber",
      "Lemon Juice",
      "Ginger Root"
    ],
    "ingredientsZh": [
      "新鲜西芹",
      "青苹果",
      "清爽黄瓜",
      "鲜柠檬汁",
      "微量生姜"
    ],
    "prepMethod": "Cold-Pressed Hydraulic Extraction",
    "prepMethodZh": "原汁冷压慢榨"
  }
];

export const MEAL_PLANS: MealPlan[] = [
  {
    id: 'plan-5-day-pass',
    title: '5-Day Workday Lunch Pass',
    titleZh: '5天工作日午餐畅享卡（单人）',
    tagline: 'Fix Your Office Lunches · Healthy & Effortless',
    taglineZh: '解决上班午餐 · 健康无负担',
    persons: 1,
    days: 5,
    validityDays: 14,
    mealsTotal: 5,
    mealsPerDay: 1,
    deliveryAddressesMax: 2,
    pricePerMeal: 25.6,
    totalPrice: 128.0,
    originalPrice: 145.0,
    upsizePrice: 25,
    upsizeOriginalPrice: 30,
    popular: false,
    bestFor: 'Office professionals wanting effortless, delicious workday lunches without meal prep hassle',
    bestForZh: '解决上班族午餐选择困难症，5天工作日现做免运配送到工位',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      '5 fresh weekday lunches (1 meal/day) delivered to your desk or home',
      'Fix Your Office Lunches · Healthy & Effortless',
      'Enjoy 5 meals within 14 days, Monday to Friday (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online system ordering & redemption before 5:00 PM',
      'Optional Portion Upsize upgrade: RM25 / plan (NP: RM30)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '5 天工作日现做午餐（每天1餐）准时送达工位或家中',
      '解决上班午餐 · 健康无负担',
      '14 天内弹性享用 5 餐，星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐与每日餐点自选',
      '加大分量选项：RM25 一个配套（原价 RM30）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 1 meal/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送1餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'emerald',
  },
  {
    id: 'plan-10-day-kickstart',
    title: '10-Day Fat-Loss Kickstart',
    titleZh: '10天轻体启动减脂冲刺（单人）',
    tagline: 'Scientific Calorie Deficit · Clean Delicious Fuel',
    taglineZh: '科学热量缺口 · 干净美味燃脂',
    persons: 1,
    days: 10,
    validityDays: 20,
    mealsTotal: 10,
    mealsPerDay: 1,
    deliveryAddressesMax: 2,
    pricePerMeal: 21.8,
    totalPrice: 218.0,
    originalPrice: 245.0,
    upsizePrice: 50,
    upsizeOriginalPrice: 60,
    popular: false,
    bestFor: 'Fitness kickstarters, calorie-deficit seekers, short-term body lean goals',
    bestForZh: '健身刷脂冲刺、科学卡路里缺口、告别外卖重油重盐快速轻体',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      '10 structured calorie-controlled meals within 20 days (Mon–Fri)',
      'Scientific Calorie Deficit · Clean Delicious Fuel',
      'Enjoy 10 meals within 20 days, Monday to Friday (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online system ordering & redemption before 5:00 PM',
      'Optional Portion Upsize upgrade: RM50 / plan (NP: RM60)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '10 餐科学控卡精修减脂餐（每天1餐）',
      '科学热量缺口 · 干净美味燃脂',
      '20 天内弹性享用 10 餐，星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐与每日餐点自选',
      '加大分量选项：RM50 一个配套（原价 RM60）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 1 meal/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送1餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'teal',
  },
  {
    id: 'plan-20-day-transformation',
    title: '20-Day Lifestyle Transformation',
    titleZh: '20天健康生活蜕变月度计划（单人）',
    tagline: 'Build Long-Term Healthy Habits · Maximum Value',
    taglineZh: '养成长期健康习惯 · 超高性价比',
    persons: 1,
    days: 20,
    validityDays: 30,
    mealsTotal: 20,
    mealsPerDay: 1,
    deliveryAddressesMax: 2,
    pricePerMeal: 19.9,
    totalPrice: 398.0,
    originalPrice: 440.0,
    upsizePrice: 100,
    upsizeOriginalPrice: 120,
    popular: true,
    bestFor: 'Solo professionals, fitness enthusiasts, long-term healthy habit builders',
    bestForZh: '单人月度日常健康饮食、养成健康生活方式、全月控卡性价比之王',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      'Enjoy 20 meals within 30 days, Monday to Friday (excluding public holidays & weekends)',
      'Build Long-Term Healthy Habits · Maximum Value (Only RM 19.90 / meal)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online computer system ordering & redemption',
      'Delivers 1 meal per day to 1 designated address',
      'Optional Portion Upsize upgrade: RM100 / plan (NP: RM120)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '30 天内享用 20 餐，星期一至五（公假周末除外）',
      '养成长期健康习惯 · 超高性价比（每餐仅 RM 19.90）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐',
      '一天送一餐一个地址',
      '加大分量选项：RM100 一个配套（原价 RM120）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 1 meal/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送1餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'emerald',
  },
  {
    id: 'plan-2-person',
    title: '2-Person Duo Meal Plan',
    titleZh: '双人餐食配套',
    tagline: 'Best for Couples & Partners · 2 Meals/Day · 40 Meals Total',
    taglineZh: '情侣夫妻与办公搭子首选 · 每日送2餐 · 共40餐',
    persons: 2,
    days: 20,
    validityDays: 30,
    mealsTotal: 40,
    mealsPerDay: 2,
    deliveryAddressesMax: 2,
    pricePerMeal: 19.7,
    totalPrice: 788.0,
    originalPrice: 880.0,
    upsizePrice: 200,
    upsizeOriginalPrice: 240,
    popular: true,
    bestFor: 'Couples, gym partners, roomies or colleagues sharing weekday lunches',
    bestForZh: '双人情侣、健身搭子、室友或同事共同健康享用工作日午餐',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      'Enjoy 20 delivery days (40 meals total) within 30 days, Mon–Fri (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online computer system ordering & redemption',
      'Delivers 2 meals per day to 1 designated address',
      'Optional Portion Upsize upgrade: RM200 / plan (NP: RM240)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '30 天内享用 20 餐期（共40餐），星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐',
      '一天送两餐一个地址',
      '加大分量选项：RM200 一个配套（原价 RM240）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 2 meals/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送2餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'amber',
  },
  {
    id: 'plan-3-person',
    title: '3-Person Trio Meal Plan',
    titleZh: '三人餐食配套',
    tagline: 'Small Team & Family Plan · 3 Meals/Day · 60 Meals Total',
    taglineZh: '小型团队与温馨家庭 · 每日送3餐 · 共60餐',
    persons: 3,
    days: 20,
    validityDays: 30,
    mealsTotal: 60,
    mealsPerDay: 3,
    deliveryAddressesMax: 2,
    pricePerMeal: 19.63,
    totalPrice: 1178.0,
    originalPrice: 1320.0,
    upsizePrice: 300,
    upsizeOriginalPrice: 360,
    bestFor: '3-person project teams, studio colleagues, or families',
    bestForZh: '三人项目小分队、工作室伙伴或注重清淡营养的家庭成员',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      'Enjoy 20 delivery days (60 meals total) within 30 days, Mon–Fri (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online computer system ordering & redemption',
      'Delivers 3 meals per day to 1 designated address',
      'Optional Portion Upsize upgrade: RM300 / plan (NP: RM360)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '30 天内享用 20 餐期（共60餐），星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐',
      '一天送三餐一个地址',
      '加大分量选项：RM300 一个配套（原价 RM360）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 3 meals/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送3餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'teal',
  },
  {
    id: 'plan-4-person',
    title: '4-Person Family / Office Meal Plan',
    titleZh: '四人餐食配套',
    tagline: 'Office Department & Family Wellness · 4 Meals/Day · 80 Meals Total',
    taglineZh: '部门组团与全家餐盒 · 每日送4餐 · 共80餐',
    persons: 4,
    days: 20,
    validityDays: 30,
    mealsTotal: 80,
    mealsPerDay: 4,
    deliveryAddressesMax: 2,
    pricePerMeal: 19.48,
    totalPrice: 1558.0,
    originalPrice: 1760.0,
    upsizePrice: 400,
    upsizeOriginalPrice: 480,
    bestFor: 'Office department units, tech squads, and medium families',
    bestForZh: '企业部门团购、技术研发小组以及4口之家工作日营养午餐',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      'Enjoy 20 delivery days (80 meals total) within 30 days, Mon–Fri (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online computer system ordering & redemption',
      'Delivers 4 meals per day to 1 designated address',
      'Optional Portion Upsize upgrade: RM400 / plan (NP: RM480)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '30 天内享用 20 餐期（共80餐），星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐',
      '一天送四餐一个地址',
      '加大分量选项：RM400 一个配套（原价 RM480）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 4 meals/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送4餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'sky',
  },
  {
    id: 'plan-6-person',
    title: '6-Person Team / Corporate Meal Plan',
    titleZh: '六人餐食配套',
    tagline: 'Company Staff Wellness · 6 Meals/Day · 120 Meals Total · Maximum Savings',
    taglineZh: '企业员工关怀与大团队轻食 · 每日送6餐 · 共120餐 · 极致优惠',
    persons: 6,
    days: 20,
    validityDays: 30,
    mealsTotal: 120,
    mealsPerDay: 6,
    deliveryAddressesMax: 2,
    pricePerMeal: 19.15,
    totalPrice: 2298.0,
    originalPrice: 2640.0,
    upsizePrice: 600,
    upsizeOriginalPrice: 720,
    bestFor: 'Corporate offices, startups, and large health-conscious teams',
    bestForZh: '创业团队、企业员工团餐、多人办公室及大家庭超值健康餐标配',
    features: [
      '26 gourmet healthy meal choices rotating daily',
      'Enjoy 20 delivery days (120 meals total) within 30 days, Mon–Fri (excl. holidays & weekends)',
      'Includes Klang Valley delivery (1 account supports up to 2 addresses)',
      'Convenient online computer system ordering & redemption',
      'Delivers 6 meals per day to 1 designated address',
      'Optional Portion Upsize upgrade: RM600 / plan (NP: RM720)',
      'Special health consultation service for 3-Highs risk groups (Hypertension, Blood Sugar, Cholesterol)',
    ],
    featuresZh: [
      '26 种丰富精美餐食自由选择',
      '30 天内享用 20 餐期（共120餐），星期一至五（公假周末除外）',
      '包含巴生谷运费，一个户口可填两个地址',
      '电脑系统自助轻松订餐',
      '一天送六餐一个地址',
      '加大分量选项：RM600 一个配套（原价 RM720）',
      '特别质询服务，针对三高（高血压、高血糖、高血脂）风险群',
    ],
    deliveryFrequency: 'Monday to Friday (10:00 AM – 2:00 PM), 6 meals/day',
    deliveryFrequencyZh: '星期一至五（10:00 AM – 2:00 PM），每天送6餐',
    deliverySchedule: 'Lunch Delivery: 10:00 AM – 2:00 PM. Daily meal cutoff before 5:00 PM.',
    deliveryScheduleZh: '午餐配送：10:00 AM – 2:00 PM。每天请在下午 5:00 前完成隔天餐点选择。',
    color: 'emerald',
  },
];

// Custom Bowl Data Options
export const CUSTOM_BASES: CustomOption[] = [
  { id: 'base-brown-rice', name: 'Organic Multi-Grain Brown Rice', nameZh: '有机多谷物糙米饭', calories: 210, protein: 5, carbs: 44, fat: 2, price: 0 },
  { id: 'base-quinoa', name: 'Tri-Color Andean Quinoa', nameZh: '南美三色有机藜麦', calories: 180, protein: 7, carbs: 32, fat: 3, price: 3.0 },
  { id: 'base-cauliflower', name: 'Fresh Grated Cauliflower Rice (Low Carb)', nameZh: '现碎轻卡花椰菜米（极低碳水）', calories: 45, protein: 3, carbs: 7, fat: 1, price: 3.5 },
  { id: 'base-soba', name: 'Japanese Buckwheat Soba', nameZh: '日式荞麦冷面', calories: 190, protein: 6, carbs: 40, fat: 1, price: 2.0 },
  { id: 'base-greens', name: 'Crisp Hydroponic Mixed Salad', nameZh: '水培脆嫩水耕混合生菜', calories: 30, protein: 2, carbs: 4, fat: 0, price: 0 },
];

export const CUSTOM_PROTEINS: CustomOption[] = [
  { id: 'prot-chicken', name: 'Sous-Vide Rosemary Chicken Breast (160g)', nameZh: '65°C迷迭香低温慢煮鸡胸肉 (160g)', calories: 180, protein: 36, carbs: 1, fat: 3, price: 0 },
  { id: 'prot-salmon', name: 'Norwegian Pan-Seared Salmon Steak (130g)', nameZh: '挪威香煎深海三文鱼排 (130g)', calories: 260, protein: 28, carbs: 0, fat: 16, price: 8.0 },
  { id: 'prot-beef', name: 'Australian Sous-Vide Angus Beef (140g)', nameZh: '澳洲安格斯低温慢煮牛柳 (140g)', calories: 230, protein: 32, carbs: 0, fat: 11, price: 9.0 },
  { id: 'prot-prawns', name: 'Garlic Butter Tiger Prawns (5 pcs)', nameZh: '蒜香橄榄油黑虎大虾仁 (5只)', calories: 140, protein: 26, carbs: 1, fat: 3, price: 7.0 },
  { id: 'prot-tofu', name: 'Crispy Sesame Crusted Organic Tofu (200g)', nameZh: '香煎芝麻脆皮有机老豆腐 (200g)', calories: 170, protein: 18, carbs: 5, fat: 9, price: 0 },
];

export const CUSTOM_SIDES: CustomOption[] = [
  { id: 'side-pumpkin', name: 'Roasted Kabocha Pumpkin', nameZh: '烤日式板栗南瓜', calories: 60, protein: 1, carbs: 14, fat: 0, price: 0 },
  { id: 'side-broccoli', name: 'Steamed Garlic Broccoli', nameZh: '清蒸蒜香西兰花', calories: 35, protein: 3, carbs: 5, fat: 0, price: 0 },
  { id: 'side-edamame', name: 'Shelled Japanese Edamame', nameZh: '日式盐水毛豆仁', calories: 75, protein: 6, carbs: 5, fat: 3, price: 0 },
  { id: 'side-corn', name: 'Sweet Corn Kernels', nameZh: '鲜甜玉米粒', calories: 55, protein: 2, carbs: 12, fat: 1, price: 0 },
  { id: 'side-egg', name: 'Marinated Soft-Boiled Ajitsuke Egg', nameZh: '日式溏心温泉蛋 (整颗)', calories: 75, protein: 6, carbs: 1, fat: 5, price: 0 },
  { id: 'side-tomatoes', name: 'Roasted Herb Cherry Tomatoes', nameZh: '香草烤串采樱桃小番茄', calories: 30, protein: 1, carbs: 6, fat: 0, price: 0 },
  { id: 'side-sweet-potato', name: 'Purple Sweet Potato Mash', nameZh: '手捣香甜紫薯泥', calories: 90, protein: 2, carbs: 21, fat: 0, price: 0 },
  { id: 'side-asparagus', name: 'Charred Young Asparagus', nameZh: '碳烤鲜嫩青芦笋', calories: 30, protein: 2, carbs: 4, fat: 0, price: 2.0 },
];

export const CUSTOM_SAUCES: CustomOption[] = [
  { id: 'sauce-sesame', name: 'Roasted Japanese Sesame (Goma)', nameZh: '特调香浓日式焙煎芝麻酱', calories: 65, protein: 1, carbs: 3, fat: 6, price: 0 },
  { id: 'sauce-ponzu', name: 'Yuzu Citrus Soy Ponzu (Low Cal)', nameZh: '清新柚子和风醋汁 (低卡轻盈)', calories: 25, protein: 1, carbs: 5, fat: 0, price: 0 },
  { id: 'sauce-honey-mustard', name: 'Whole Grain Honey Mustard', nameZh: '法式全籽蜂蜜芥末酱', calories: 45, protein: 1, carbs: 7, fat: 2, price: 0 },
  { id: 'sauce-thai-lime', name: 'Thai Lime & Herb Chili Vinaigrette', nameZh: '泰式青柠香草酸辣开胃汁', calories: 30, protein: 0, carbs: 6, fat: 0, price: 0 },
  { id: 'sauce-olive-herb', name: 'Extra Virgin Olive Oil & Sea Salt', nameZh: '特级初榨橄榄油黑椒海盐', calories: 70, protein: 0, carbs: 0, fat: 8, price: 0 },
];

export const CUSTOM_TOPPINGS: CustomOption[] = [
  { id: 'top-almonds', name: 'Toasted Sliced Almonds', nameZh: '香脆烘烤杏仁片', calories: 40, protein: 2, carbs: 1, fat: 3, price: 0 },
  { id: 'top-furikake', name: 'Japanese Nori Furikake', nameZh: '日式海苔芝麻香松', calories: 20, protein: 1, carbs: 2, fat: 1, price: 0 },
  { id: 'top-garlic-chips', name: 'Crispy Garlic Chips', nameZh: '自制酥脆蒜片', calories: 25, protein: 1, carbs: 3, fat: 1, price: 0 },
  { id: 'top-chia', name: 'Organic Chia Seeds', nameZh: '有机高纤维奇亚籽', calories: 25, protein: 1, carbs: 2, fat: 2, price: 0 },
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Serene Tan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    role: 'Corporate HR, Petaling Jaya',
    roleZh: '企业HR经理，八打灵再也',
    comment: 'The 20-Day meal plan is a lifesaver for office lunch! Unlike other healthy bento brands that taste like cardboard, CHILL Healthy’s lemon chicken breast and chicken kut teh are incredibly flavorful and juicy. Down 3.5kg in a month!',
    commentZh: '订了20天月度套餐，简直拯救了我的上班午餐！以前吃减脂餐就像嚼蜡，但潮轻食的慢煮柠檬鸡胸和鸡骨茶真的肉汁满满又鲜甜，一个月不知不觉健康轻了3.5公斤！',
    favoriteMeal: 'Slow-Cooked Lemon Herb Chicken Breast',
    verified: true,
    date: '2 weeks ago',
  },
  {
    id: 'rev-2',
    author: 'Marcus Lim',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    role: 'Fitness Coach, Klang',
    roleZh: '健身教练，巴生',
    comment: 'Real 40g+ protein per meal without hidden oils or excessive sodium. The Norwegian Salmon and Angus Beef Tenderloin are chef quality. Highly recommended to all my gym clients in Klang & Shah Alam.',
    commentZh: '货真价实的40克以上纯蛋白，没有任何乱七八糟的隐藏油脂和味精。挪威三文鱼和安格斯牛柳完全是高级西餐厅的水准，我已经推荐给巴生和莎阿南的学员们了！',
    favoriteMeal: 'Norwegian Grilled Salmon Bento',
    verified: true,
    date: '1 month ago',
  },
  {
    id: 'rev-3',
    author: 'Michelle Wong',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    role: 'Financial Analyst, KL Sentral',
    roleZh: '金融分析师，吉隆坡中央车站',
    comment: 'Delivery to KL arrives promptly at 12:00 PM every single day warm and fresh. The WhatsApp concierge is super responsive when I need to pause delivery for client lunches.',
    commentZh: '送吉隆坡每天中午12点前准时送到，打开还是温温热热的！有会议需要临时改期，WhatsApp客服秒回复帮忙调整，服务体验非常贴心省心！',
    favoriteMeal: 'Garlic Tiger Prawn Cauliflower Rice',
    verified: true,
    date: '3 weeks ago',
  },
];

export const DELIVERY_AREAS = [
  { name: 'Klang (巴生核心区)', fee: 'FREE (满 RM 35 免运)', minOrder: 20, time: '11:00 AM - 12:15 PM' },
  { name: 'Shah Alam (莎阿南)', fee: 'FREE (满 RM 40 免运)', minOrder: 25, time: '11:15 AM - 12:30 PM' },
  { name: 'Subang Jaya & USJ (梳邦再也)', fee: 'FREE (满 RM 45 免运)', minOrder: 30, time: '11:30 AM - 12:45 PM' },
  { name: 'Petaling Jaya / Damansara (八打灵 / 白沙罗)', fee: 'FREE (满 RM 50 免运)', minOrder: 35, time: '11:45 AM - 1:00 PM' },
  { name: 'Puchong (蒲种)', fee: 'FREE (满 RM 45 免运)', minOrder: 30, time: '11:30 AM - 12:45 PM' },
  { name: 'Kuala Lumpur CBD / Bangsar / Sentral (吉隆坡市区)', fee: 'FREE (满 RM 50 免运)', minOrder: 40, time: '11:45 AM - 1:00 PM' },
  { name: 'Cheras / Ampang (蕉赖 / 安邦)', fee: 'RM 5.00 (满 RM 60 免运)', minOrder: 40, time: '12:00 PM - 1:15 PM' },
];
