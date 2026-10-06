import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Instagram,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Language, SiteSettings } from '../types';

interface TopInstagramVideoShowcaseProps {
  language: Language;
  siteSettings: SiteSettings;
  onExploreMenu: () => void;
  onViewPlans: () => void;
}

export const TopInstagramVideoShowcase: React.FC<TopInstagramVideoShowcaseProps> = ({
  language,
  siteSettings,
  onExploreMenu,
  onViewPlans,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(15820);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (siteSettings.showTopInstagramVideo === false) {
    return null;
  }

  const isEn = language === 'en';
  const defaultReelUrl = 'https://www.instagram.com/reel/DdyTG7it2_J/?stkn=MWh3b283YzJ3M2JzeQ==';
  const rawReelUrl = siteSettings.topInstagramReelUrl || defaultReelUrl;
  const reelUrl = rawReelUrl.includes('DJ_W5ChJSjc') ? defaultReelUrl : rawReelUrl;
  
  // Extract shortcode if available for poster and embed options
  const shortcode = (() => {
    const m = reelUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : 'DdyTG7it2_J';
  })();

  const posterUrl = '/instagram_reel_DdyTG7it2_J_cover.jpg';

  // Ensure video stream points to a valid direct MP4 media file, never an Instagram web URL
  const isDirectMediaUrl = (url?: string) => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    if (clean.includes('instagram.com') || clean.includes('instagr.am')) return false;
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.includes('.mp4?') ||
      clean.startsWith('/instagram_reel_')
    );
  };

  const videoUrl =
    siteSettings.topInstagramVideoUrl &&
    isDirectMediaUrl(siteSettings.topInstagramVideoUrl) &&
    !siteSettings.topInstagramVideoUrl.includes('DJ_W5ChJSjc')
      ? siteSettings.topInstagramVideoUrl
      : '/instagram_reel_DdyTG7it2_J.mp4';

  const igHandle = '@chillhealthybox';
  const igAccountUrl = 'https://www.instagram.com/chillhealthybox/';

  // Automatically start video playback as soon as component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;

    // Strict browser autoplay requirements: muted + playsinline at DOM level
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    const safePlay = () => {
      if (isCancelled || !video) return;
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            if (!isCancelled) {
              setIsPlaying(true);
              setVideoError(false);
            }
          }).catch(() => {
            // Autoplay postponed by browser until interaction
            if (!isCancelled) {
              setIsPlaying(false);
            }
          });
        }
      }
    };

    // Attempt playback immediately
    safePlay();

    // Also attempt once media metadata is loaded
    video.addEventListener('loadedmetadata', safePlay, { once: true });
    video.addEventListener('canplay', safePlay, { once: true });

    // Single one-time user touch/pointer fallback without scroll listener
    const handleFirstTouch = () => {
      safePlay();
    };
    document.addEventListener('pointerdown', handleFirstTouch, { once: true });

    return () => {
      isCancelled = true;
      video.removeEventListener('loadedmetadata', safePlay);
      video.removeEventListener('canplay', safePlay);
      document.removeEventListener('pointerdown', handleFirstTouch);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    } else {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    }
  };

  return (
    <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white border-b border-stone-800 relative overflow-hidden transition-all duration-300">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/3 -mt-16 w-80 h-80 rounded-full bg-pink-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black tracking-wide shadow-md shadow-pink-900/30">
              <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
              <span>{isEn ? 'VIRAL ON INSTAGRAM' : 'IG 爆款推荐'}</span>
            </span>

            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>
                  {isEn
                    ? '🔥 Featured Instagram Reel (@chillhealthybox)'
                    : '🔥 Instagram 官方推荐视频 (@chillhealthybox)'}
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  🥗 潮轻食官方
                </span>
              </h2>
            </div>
          </div>

          {/* Controls: Collapse & Watch on IG */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={reelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white text-xs font-semibold transition-colors border border-white/15 cursor-pointer"
              title="Open Reel on Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>@chillhealthybox</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer border border-stone-700"
              title={isCollapsed ? 'Expand video' : 'Collapse video'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Reel Showcase Body */}
        {!isCollapsed && (
          <div className="bg-stone-800/80 backdrop-blur-md rounded-3xl border border-stone-700/80 p-3 sm:p-5 shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Column: Instagram Video Reel Player */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-900/60 text-pink-300 text-xs font-bold border border-pink-700/60 mb-2.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>{isEn ? '🔴 Live Auto-Playing Reel' : '🔴 正在自动播放官方 Reels'}</span>
                </div>

                <div className="relative w-full max-w-xs sm:max-w-sm aspect-[9/14] rounded-2xl overflow-hidden bg-black shadow-2xl border-2 border-stone-700 group">
                  {/* The Video Element with AutoPlay */}
                  {!videoError ? (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      poster={posterUrl}
                      className="w-full h-full object-cover cursor-pointer"
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      onClick={togglePlay}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => setVideoError(true)}
                    />
                  ) : (
                    <a
                      href={reelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full relative cursor-pointer overflow-hidden bg-stone-900 group block"
                      title="Watch Reel on Instagram"
                    >
                      <img
                        src={posterUrl}
                        alt="Chill Healthy Box Instagram Reel"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform pl-0.5">
                          <Play className="w-7 h-7 fill-white" />
                        </div>
                        <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full border border-white/20">
                          {isEn ? 'Watch Reel on Instagram ↗' : '在 Instagram 上播放 ↗'}
                        </span>
                      </div>
                    </a>
                  )}

                      {/* Top Overlay: Instagram Profile */}
                      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between z-20">
                        <a
                          href={reelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 group/profile"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5">
                            <img
                              src="/chill-healthy-logo.svg"
                              alt="Chill Healthy Box"
                              className="w-full h-full rounded-full bg-white object-contain p-0.5"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white leading-none group-hover/profile:underline">
                                chillhealthybox
                              </span>
                              <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                            </div>
                            <span className="text-[10px] text-stone-300">
                              {isEn ? 'Official Verified Store' : '潮轻食官方账号 · 正品保证'}
                            </span>
                          </div>
                        </a>

                        <a
                          href={reelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          {isEn ? 'Watch Reel' : '前往原帖'}
                        </a>
                      </div>

                      {/* Floating Unmute / Sound Status Button */}
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="absolute bottom-16 left-3 z-30 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
                        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                      >
                        {isMuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                            <span>{isEn ? 'Tap to Unmute 🔊' : '点击开启声音 🔊'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isEn ? 'Sound On 🎵' : '原声播放中 🎵'}</span>
                          </>
                        )}
                      </button>

                      {/* Center Play/Pause Overlay indicator */}
                      {!isPlaying && (
                        <div
                          onClick={togglePlay}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
                        >
                          <div className="w-16 h-16 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform pl-1">
                            <Play className="w-8 h-8 fill-stone-900" />
                          </div>
                        </div>
                      )}

                      {/* Right Side Social Actions (IG Reel Style) */}
                      <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3.5 z-20">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={handleLike}
                          className="flex flex-col items-center gap-0.5 text-white cursor-pointer group/btn"
                        >
                          <div
                            className={`w-9 h-9 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center transition-transform group-hover/btn:scale-110 ${
                              isLiked ? 'text-pink-500' : 'text-white'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink-500' : ''}`} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white drop-shadow">
                            {(likeCount / 1000).toFixed(1)}k
                          </span>
                        </button>

                        {/* Comments */}
                        <a
                          href={reelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-0.5 text-white cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center hover:bg-black/70">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white drop-shadow">43</span>
                        </a>

                        {/* Share */}
                        <a
                          href={reelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-0.5 text-white"
                          title="Share Reel"
                        >
                          <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center hover:bg-black/70">
                            <Share2 className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white drop-shadow">Share</span>
                        </a>

                        {/* Sound Mute/Unmute */}
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:bg-black/80 transition-colors"
                          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 text-pink-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      </div>

                      {/* Bottom Video Caption Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-none">
                        <p className="text-xs text-white line-clamp-2 leading-snug drop-shadow font-medium">
                          {isEn
                            ? '🥗【CHILL Healthy Box】We focus only on making clean, wholesome meals for lunch and dinner with fresh delivery!'
                            : '🥗【潮轻食官方】我们一直专注做好健康餐，只做午餐和晚餐，想认真照顾身体就交给我们 ❤️'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-pink-300 font-semibold">
                          <span>#chillhealthybox</span>
                          <span>#健康餐</span>
                          <span>#正品直达</span>
                        </div>
                      </div>
                </div>
              </div>

              {/* Right Column: Story & Direct Action */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isEn ? 'Official Instagram Reel' : '官方 Instagram 爆款短视频'}</span>
                </div>

                <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {isEn
                    ? '🥗【CHILL Healthy Box】Official Healthy Meal Prep & Fresh Bento Delivery'
                    : '🥗【潮轻食官方】专注做好每一份健康餐 · 午餐与晚餐新鲜直达'}
                </h3>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                  {isEn
                    ? 'CHILL Healthy Box (@chillhealthybox) has always kept it simple: we purely focus on cooking wholesome, balanced healthy meals with zero MSG and sous-vide craftsmanship. Offering healthy lunch and dinner delivery across the city. Want to eat clean and take proper care of your body? Leave daily meal prep to us!'
                    : '潮轻食（@chillhealthybox）一直专注于用心做好健康餐！只做高品质午餐与晚餐，坚持少油少盐、无味精添加、真实新鲜食材。大部分地区均提供专车送餐服务，欢迎直接联系我们了解送餐范围与今日新鲜餐单，轻松守护你与家人的日常健康饮食！'}
                </p>

                {/* Key Video Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2">
                  <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-700/80">
                    <span className="text-[10px] text-stone-400 block">{isEn ? 'Official Account' : '官方账号'}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono">@chillhealthybox</span>
                  </div>
                  <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-700/80">
                    <span className="text-[10px] text-stone-400 block">{isEn ? 'Verification' : '官方认证'}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-pink-400 font-mono">Verified Brand</span>
                  </div>
                  <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-700/80">
                    <span className="text-[10px] text-stone-400 block">{isEn ? 'Specialty' : '主营特色'}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">Clean Bento Prep</span>
                  </div>
                  <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-700/80">
                    <span className="text-[10px] text-stone-400 block">{isEn ? 'Status' : '播放状态'}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-sky-400 font-mono">▶ Playing Auto</span>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={reelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-900/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{isEn ? 'Watch on Instagram (@chillhealthybox) ↗' : '前往 Instagram 查看官方原帖 ↗'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={onExploreMenu}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                  >
                    <span>{isEn ? 'Order Today’s Fresh Bentos' : '立即点选今日现做餐盒'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onViewPlans}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs sm:text-sm border border-stone-600 transition-colors cursor-pointer"
                  >
                    <span>{isEn ? 'View Meal Plans' : '查看月度套餐'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
