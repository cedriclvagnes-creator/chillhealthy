import { SiteSettings, MemberAccount, MealRedemption, HomepageContent } from '../types';

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroTagEn: 'Official CHILL Healthy (潮轻食) Kitchen',
  heroTagZh: 'CHILL Healthy 潮轻食 · 官方健康轻食厨房',
  heroHeadlineEn: "Eating Clean Shouldn't Be Boring.",
  heroHeadlineZh: '潮味轻食，让健康生活 毫不费力又美味',
  heroDescriptionEn: 'Chef-crafted high-protein meal boxes, sous-vide tender meats, and whole-grain nutrition. Cooked fresh daily in Klang Valley with zero MSG, low sodium, and clean healthy oils. Fuel your body without sacrificing taste.',
  heroDescriptionZh: '拒绝寡淡水煮菜！CHILL Healthy 潮轻食坚持每日清晨现做，以65°C低温真空慢煮鲜嫩鸡胸肉、现煎深海三文鱼排与有机原粒糙米，严格控制热量与三大营养素，准时热腾腾配送至您的办公桌与家中。',
  heroImage: '',
  storyTagEn: 'Crafted with care',
  storyTagZh: '用心手作 · 严选天然',
  storyHeadlineEn: 'Why CHILL Healthy Bento Tastes So Much Better',
  storyHeadlineZh: '为什么潮轻食能做到 低卡却极致入味？',
  storySubtitleEn: '— Crafted with care, everyday in our central kitchen',
  storySubtitleZh: '— 每一份，皆是用心手作的健康温度',
  storyDescriptionEn: 'Most people give up on diets not because of lack of willpower, but because traditional diet food is dry, tasteless, and exhausting to maintain. At CHILL Healthy, we combine modern sous-vide culinary science with authentic Asian home-cooking flavors so you can eat clean consistently without feeling deprived.',
  storyDescriptionZh: '绝大多数人减脂失败，不是毅力不足，而是传统减脂餐太难下咽！CHILL Healthy 潮轻食突破传统束缚，将法式低温慢煮工艺与南洋风味巧妙结合，坚持0味精、低盐低油，让每天的健康午餐成为期待已久的生活享受。',
  kitchenPhotoUrl: 'https://admin.chillhealthy.com/uploads/36yvg4y1z0aoc0wwsg.jpg',
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  whatsappNumber: '60126189919',
  whatsappDisplay: '+60126189919',
  logoUrl: '/chill-healthy-logo.svg',
  announcementEn: '🌿 Premium Healthy Lunch & Dinner Bento in Klang Valley & KL · Official WhatsApp: +60126189919',
  announcementZh: '🌿 巴生河流域及吉隆坡高品质午餐与晚餐外卖餐盒 · 官方 WhatsApp: +60126189919',
  kitchenAddress: 'CHILL Healthy Kitchen, Klang & Selangor Delivery Hub, Malaysia',
  kitchenHours: 'Monday to Friday: 8:30 AM – 7:30 PM',
  instagramHandle: '@chillhealthybox',
  instagramUrl: 'https://www.instagram.com/chillhealthybox/',
  facebookUrl: 'https://www.facebook.com/chillhealthy88',
  kitchenPhotoUrl: 'https://admin.chillhealthy.com/uploads/36yvg4y1z0aoc0wwsg.jpg',
  heroComboPhotoUrl: '',
  heroComboMode: 'grid',
  autoSyncMalaysiaBankHolidays: true,
  // Payment QR customization settings
  paymentQrUrl: '/duitnow-qr-chillhealthy.svg',
  paymentMerchantName: 'CHILL HEALTHY TRADING',
  paymentBankName: 'Hong Leong Bank (HLB Connect) / DuitNow QR',
  paymentAccountNo: '3219-8920-11',
  paymentDuitNowId: '0126189919',
  paymentInstructionsEn: 'Scan via any Malaysian bank app, TNG eWallet, ShopeePay, or GrabPay.',
  paymentInstructionsZh: '支持马来西亚各大银行 App、Touch n Go eWallet、ShopeePay 扫码即付。',
  // Highest-viewed Instagram Video hosted at top of homepage
  topInstagramVideoUrl: '/instagram_reel_DdyTG7it2_J.mp4',
  topInstagramReelUrl: 'https://www.instagram.com/reel/DdyTG7it2_J/?stkn=MWh3b283YzJ3M2JzeQ==',
  topInstagramVideoTitleEn: 'Focus on Healthy Meals (专注做健康餐)',
  topInstagramVideoTitleZh: '专注做健康餐',
  topInstagramVideoViews: 'Official Reel',
  showTopInstagramVideo: true,
};

export const INITIAL_MEMBERS: MemberAccount[] = [];

export const INITIAL_REDEMPTIONS: MealRedemption[] = [];

