import React, { useState } from 'react';
import { 
  Instagram, 
  Heart, 
  MessageCircle, 
  ExternalLink, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  Play, 
  Share2, 
  X, 
  ArrowRight,
  Flame,
  ChefHat
} from 'lucide-react';
import { Language, SiteSettings, MealItem } from '../types';
import { INSTAGRAM_POSTS, InstagramPost } from '../data/instagramPosts';

interface InstagramFeedSectionProps {
  language: Language;
  siteSettings: SiteSettings;
  onSelectMealByName?: (mealName: string) => void;
}

export const InstagramFeedSection: React.FC<InstagramFeedSectionProps> = ({
  language,
  siteSettings,
  onSelectMealByName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bento' | 'kitchen' | 'customer' | 'tips'>('all');
  const [activeModalPost, setActiveModalPost] = useState<InstagramPost | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const instagramUrl = siteSettings.instagramUrl || 'https://www.instagram.com/chillhealthybox/';
  const instagramHandle = siteSettings.instagramHandle || '@chillhealthybox';

  const filteredPosts = selectedCategory === 'all'
    ? INSTAGRAM_POSTS
    : INSTAGRAM_POSTS.filter(p => p.category === selectedCategory);

  const toggleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleShare = (post: InstagramPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Check out @chillhealthybox on Instagram: ${instagramUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <section id="instagram" className="py-16 sm:py-20 bg-stone-100/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block: Instagram Profile Style */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Profile Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              {/* Instagram Story Gradient Ring */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-md group shrink-0"
                title="View @chillhealthybox on Instagram"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-full bg-stone-900 flex flex-col items-center justify-center text-white">
                    <span className="font-heading font-black text-sm tracking-tight text-emerald-400">CHILL</span>
                    <Instagram className="w-5 h-5 text-pink-500 mt-0.5" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </a>

              {/* Bio & Details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-stone-900">
                    chillhealthybox
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <CheckCircle className="w-3.5 h-3.5 fill-blue-600 text-white" />
                    Verified Brand
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-stone-700">
                  CHILL Healthy Bento (潮轻食) · Sous-Vide Meal Prep
                </p>

                <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
                  {language === 'en'
                    ? '🌿 Daily fresh healthy bentos in Klang Valley · 0% MSG · High protein sous-vide craft · Office & home delivery. Tag us @chillhealthybox to get featured!'
                    : '🌿 巴生河流域法式低温慢煮健康餐盒 · 0味精 · 高蛋白营养配比 · 每日新鲜现做配送。在 IG 晒图 @chillhealthybox 即享专属优惠！'}
                </p>

                {/* Social Stats */}
                <div className="flex items-center justify-center sm:justify-start gap-6 pt-1 text-xs text-stone-600">
                  <span>
                    <strong className="font-bold text-stone-900">480+</strong> {language === 'en' ? 'posts' : '篇动态'}
                  </span>
                  <span>
                    <strong className="font-bold text-stone-900">12.8k</strong> {language === 'en' ? 'followers' : '位关注者'}
                  </span>
                  <span>
                    <strong className="font-bold text-stone-900">Klang Valley</strong> {language === 'en' ? 'hub' : '配送中心'}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow Actions on Instagram */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>{language === 'en' ? 'Follow on Instagram' : '关注 @chillhealthybox'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={() => handleShare(INSTAGRAM_POSTS[0])}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedShare ? (language === 'en' ? 'Link Copied!' : '已复制链接!') : (language === 'en' ? 'Share Profile' : '分享主页')}</span>
              </button>
            </div>
          </div>

          {/* Categories Tab Navigation */}
          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { key: 'all', en: 'All Posts', zh: '全部动态' },
                { key: 'bento', en: 'Bento Gallery', zh: '餐盒特写' },
                { key: 'kitchen', en: 'Kitchen & Sous-Vide', zh: '慢煮与厨房' },
                { key: 'customer', en: 'Customer Tags', zh: '顾客晒图' },
                { key: 'tips', en: 'Nutrition Tips', zh: '营养技巧' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  {language === 'en' ? cat.en : cat.zh}
                </button>
              ))}
            </div>

            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              {language === 'en' ? 'Click any post to inspect & explore' : '点击任意动态查看高清详情'}
            </span>
          </div>
        </div>

        {/* Instagram Post Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            const currentLikes = post.likes + (isLiked ? 1 : 0);

            return (
              <div
                key={post.id}
                onClick={() => setActiveModalPost(post)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image Container with Hover Overlay */}
                <div className="relative aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={post.imageUrl}
                    alt={language === 'en' ? post.captionEn : post.captionZh}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {post.type === 'carousel' && (
                      <span className="bg-black/60 backdrop-blur-xs text-white p-1.5 rounded-lg flex items-center justify-center shadow-xs">
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {post.type === 'reel' && (
                      <span className="bg-black/60 backdrop-blur-xs text-white p-1.5 rounded-lg flex items-center justify-center shadow-xs">
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </span>
                    )}
                  </div>

                  {/* Hover stats overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white font-bold text-sm">
                    <div className="flex items-center gap-1.5">
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'fill-white text-white'}`} />
                      <span>{currentLikes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-5 h-5 fill-white text-white" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content Snippet */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Author Bar */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-600" />
                        chillhealthybox
                      </span>
                      <span>{language === 'en' ? post.dateEn : post.dateZh}</span>
                    </div>

                    {/* Caption Preview */}
                    <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed">
                      {language === 'en' ? post.captionEn : post.captionZh}
                    </p>
                  </div>

                  {/* Tags & Quick Action */}
                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-[#3b6026] font-medium truncate max-w-[150px]">
                      {post.tags[0]}
                    </span>

                    <button
                      onClick={(e) => toggleLike(post.id, e)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer ${
                        isLiked ? 'text-red-600 font-bold' : 'text-stone-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                      <span>{currentLikes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action: View more on Instagram */}
        <div className="mt-12 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider">
              <Instagram className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Join Our Foodie Community' : '加入潮轻食 IG 粉丝圈'}</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold">
              {language === 'en' ? 'Want to See More Daily Kitchen Stories?' : '想了解更多每日鲜作与便当花絮？'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              {language === 'en'
                ? 'We post daily sous-vide prep reels, customer meal reviews, and weekly secret menu releases on @chillhealthybox.'
                : '我们在 Instagram @chillhealthybox 每日更新法式慢煮制作、顾客真实评测与每周限量限定菜单，欢迎关注！'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>{language === 'en' ? 'View More on @chillhealthybox' : '查看更多动态 @chillhealthybox'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Interactive Instagram Post Lightbox Modal */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left/Top: Media view */}
            <div className="md:w-1/2 bg-stone-900 relative flex items-center justify-center overflow-hidden aspect-square md:aspect-auto">
              <img
                src={activeModalPost.imageUrl}
                alt="Instagram post from chillhealthybox"
                className="w-full h-full object-cover max-h-[450px] md:max-h-full"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>@chillhealthybox</span>
                </span>
              </div>
            </div>

            {/* Right/Bottom: Post details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[450px] md:max-h-[600px]">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-pink-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-stone-900">chillhealthybox</span>
                        <CheckCircle className="w-3 h-3 fill-blue-600 text-white" />
                      </div>
                      <span className="text-[10px] text-stone-400">Klang Valley · Official</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModalPost(null)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Caption Full */}
                <div className="space-y-3 text-xs sm:text-sm text-stone-800 leading-relaxed">
                  <p>
                    <span className="font-bold mr-1.5">chillhealthybox</span>
                    {language === 'en' ? activeModalPost.captionEn : activeModalPost.captionZh}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeModalPost.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-[#3b6026] hover:underline font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="block text-[11px] text-stone-400 pt-1">
                    {language === 'en' ? `Posted ${activeModalPost.dateEn}` : `发布于 ${activeModalPost.dateZh}`}
                  </span>
                </div>

                {/* Related meal banner if any */}
                {activeModalPost.relatedMealName && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[11px] text-emerald-800 block font-semibold">
                          {language === 'en' ? 'Featured Bento:' : '动态同款餐盒:'}
                        </span>
                        <span className="text-xs font-bold text-emerald-950">
                          {activeModalPost.relatedMealName}
                        </span>
                      </div>
                    </div>
                    {onSelectMealByName && (
                      <button
                        onClick={() => {
                          onSelectMealByName(activeModalPost.relatedMealName!);
                          setActiveModalPost(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'View Menu' : '查看单点'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar & Link to Instagram */}
              <div className="pt-4 mt-6 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(activeModalPost.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          likedPosts[activeModalPost.id] 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-stone-700 hover:text-red-500'
                        }`} 
                      />
                      <span>{activeModalPost.likes + (likedPosts[activeModalPost.id] ? 1 : 0)}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                      <MessageCircle className="w-5 h-5" />
                      <span>{activeModalPost.comments}</span>
                    </div>

                    <button
                      onClick={() => handleShare(activeModalPost)}
                      className="p-1 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                      title="Share post"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs text-stone-500 font-medium">
                    {likedPosts[activeModalPost.id] ? (language === 'en' ? 'You liked this' : '已点赞') : ''}
                  </span>
                </div>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{language === 'en' ? 'Open in Instagram (@chillhealthybox)' : '在 Instagram (@chillhealthybox) 中打开'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
