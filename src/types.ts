export type Language = 'en' | 'zh';

export type Category = 'all' | 'signature' | 'high-protein' | 'low-carb' | 'under-500' | 'plant-based' | 'drinks';

export interface MealItem {
  id: string;
  originalId?: string;
  name: string;
  nameZh: string;
  subtitle: string;
  subtitleZh: string;
  category: Category[];
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  image: string;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  isNew?: boolean;
  description: string;
  descriptionZh: string;
  ingredients: string[];
  ingredientsZh: string[];
  allergens?: string[];
  allergensZh?: string[];
  spiceLevel?: number; // 0 to 3
  prepMethod?: string;
  prepMethodZh?: string;
  isOutOfStock?: boolean;
}

export interface MealPlan {
  id: string;
  title: string;
  titleZh: string;
  tagline: string;
  taglineZh: string;
  persons: number; // 1, 2, 3, 4, 6
  days: number; // 20 active meal delivery days
  validityDays: number; // 30 days
  mealsTotal: number; // 20, 40, 60, 80, 120
  mealsPerDay: number; // 1, 2, 3, 4, 6 meals per day
  deliveryAddressesMax: number; // up to 2 addresses
  pricePerMeal: number;
  totalPrice: number;
  originalPrice?: number;
  upsizePrice?: number; // portion upsize cost
  upsizeOriginalPrice?: number;
  popular?: boolean;
  bestFor: string;
  bestForZh: string;
  features: string[];
  featuresZh: string[];
  deliveryFrequency: string;
  deliveryFrequencyZh: string;
  deliverySchedule?: string;
  deliveryScheduleZh?: string;
  color: string;
}

export interface CustomOption {
  id: string;
  name: string;
  nameZh: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  image?: string;
}

export interface CustomBowlConfig {
  base: CustomOption;
  protein: CustomOption;
  sides: CustomOption[]; // up to 3 included, extras have fee
  sauce: CustomOption;
  topping: CustomOption;
}

export interface CartItem {
  cartItemId: string;
  type: 'meal' | 'plan' | 'custom';
  title: string;
  titleZh: string;
  price: number;
  quantity: number;
  image: string;
  calories?: number;
  protein?: number;
  substitutions?: {
    lowCarbBase?: boolean;
    extraProtein?: boolean;
    dressingOnSide?: boolean;
  };
  customBowlDetails?: CustomBowlConfig;
  planDetails?: {
    days: number;
    mealsTotal: number;
    deliveryTime: 'lunch' | 'dinner' | 'both';
    persons?: number;
    isUpsized?: boolean;
    upsizeCost?: number;
  };
  notes?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  deliveryMethod: 'delivery' | 'pickup';
  address: string;
  area: string;
  postalCode: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  notes: string;
  paymentMethod: 'duitnow' | 'cod' | 'whatsapp';
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  role: string;
  roleZh: string;
  comment: string;
  commentZh: string;
  favoriteMeal: string;
  verified: boolean;
  date: string;
}

export interface SiteSettings {
  whatsappNumber: string;
  whatsappDisplay: string;
  logoUrl?: string;
  announcementEn: string;
  announcementZh: string;
  kitchenAddress: string;
  kitchenHours: string;
  instagramHandle?: string;
  instagramUrl?: string;
}

export interface MemberAccount {
  id: string;
  memberNumber?: string; // Same as handphone number e.g. 0126189919
  name: string;
  email: string;
  phone: string;
  password?: string; // Default '123456', customizable by member
  address: string;
  area: string;
  postalCode: string;
  address2?: string;
  area2?: string;
  postalCode2?: string;
  activeAddressSlot?: 1 | 2;
  dietaryPreferences?: string;
  activePackage: {
    planId: string;
    planName: string;
    planNameZh: string;
    totalMeals: number;
    remainingMeals: number;
    purchasedDate: string;
    expiryDate: string;
  } | null;
  creditsHistory: Array<{
    id: string;
    date: string;
    type: 'purchase' | 'redeem' | 'bonus' | 'refund';
    amount: number;
    note: string;
  }>;
}

export interface MealRedemption {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  deliveryDate: string;
  deliverySlot: string;
  deliveryAddress: string;
  area: string;
  postalCode: string;
  mealId: string;
  mealName: string;
  mealNameZh: string;
  mealImage: string;
  quantity?: number;
  status: 'Pending' | 'Prepping in Kitchen' | 'Out for Delivery' | 'Delivered';
  dietaryNotes?: string;
  createdAt: string;
  redeemedAt?: string;
}
