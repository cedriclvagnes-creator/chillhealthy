import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Instagram,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (siteSettings.showTopInstagramVideo === false) {
    return null;
  }

  const isEn = language === 'en';
  const defaultReelUrl = 'https://www.instagram.com/reel/DdyTG7it2_J/?stkn=MWh3b283YzJ3M2JzeQ==';
  const reelUrl = (siteSettings.topInstagramReelUrl && !siteSettings.topInstagramReelUrl.includes('DJ_W5ChJSjc'))
    ? siteSettings.topInstagramReelUrl
    : defaultReelUrl;

  // Determine media video stream
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

  const posterUrl = '/instagram_reel_DdyTG7it2_J_cover.jpg';
  const igHandle = '@chillhealthybox';
  const igAccountUrl = 'https://www.instagram.com/chillhealthybox/';

  // Autoplay video on mount (muted autoplay complies with browser policy)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser requires user interaction before autoplay
          setIsPlaying(false);
        });
    }
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

  return (
    <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white border-b border-stone-800 relative overflow-hidden transition-all duration-300">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 left-1/4 -mt-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-20 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href={igAccountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/30 hover:bg-pink-600/40 text-pink-300 hover:text-white text-xs font-bold border border-pink-500/40 transition-colors cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>{igHandle}</span>
            </a>

            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-stone-200 tracking-tight">
                {isEn
                  ? 'Focus on Healthy Meals (专注做健康餐)'
                  : '专注做健康餐'}
              </h2>
            </div>
          </div>

          {/* Controls: Watch on IG & Collapse */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={reelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white text-xs font-semibold transition-colors border border-white/15 cursor-pointer"
              title="Open Reel on Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Instagram</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer border border-stone-700"
              title={isCollapsed ? 'Expand video' : 'Collapse video'}
              aria-label={isCollapsed ? 'Expand video' : 'Collapse video'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Reel Showcase Body */}
        {!isCollapsed && (
          <div className="bg-stone-800/70 backdrop-blur-md rounded-3xl border border-stone-700/70 p-3.5 sm:p-5 shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Column: Autoplaying Instagram Video Reel */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border border-stone-700 group">
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
                  />

                  {/* Top Bar Overlay on Video */}
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between z-20 pointer-events-auto">
                    <a
                      href={reelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group/profile"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5">
                        <img
                          src="/chill-healthy-logo.svg"
                          alt="Chill Healthy Box"
                          className="w-full h-full rounded-full bg-white object-contain p-0.5"
                        />
                      </div>
                      <span className="text-xs font-bold text-white group-hover/profile:underline">
                        chillhealthybox
                      </span>
                    </a>

                    <a
                      href={reelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {isEn ? 'Watch on IG' : '原帖'}
                    </a>
                  </div>

                  {/* Play/Pause Overlay indicator when paused */}
                  {!isPlaying && (
                    <div
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform pl-0.5">
                        <Play className="w-7 h-7 fill-stone-900" />
                      </div>
                    </div>
                  )}

                  {/* Sound Toggle Button (Bottom-Left) */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="absolute bottom-3 left-3 z-30 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 border border-white/20 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
                    title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-pink-400" />
                        <span>{isEn ? 'Tap for Sound 🔊' : '开启声音 🔊'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isEn ? 'Sound On 🎵' : '静音 🔇'}</span>
                      </>
                    )}
                  </button>

                  {/* Video Play/Pause Small Toggle (Bottom-Right) */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute bottom-3 right-3 z-30 p-2 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
                    title={isPlaying ? 'Pause' : 'Play'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Brand Introduction & Order CTAs */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'CHILL Healthy Box Official' : '潮轻食官方健康餐'}</span>
                </div>

                <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {isEn
                    ? siteSettings.topInstagramVideoTitleEn || 'Focus on Healthy Meals (专注做健康餐)'
                    : siteSettings.topInstagramVideoTitleZh || '专注做健康餐'}
                </h3>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                  {isEn
                    ? 'CHILL Healthy Box (@chillhealthybox) prepares nutritious, restaurant-grade healthy bentos cooked fresh daily with zero MSG, sous-vide precision, and balanced macro-nutrients. Providing daily lunch and dinner fresh delivery across Klang, Shah Alam, Subang, Petaling Jaya, and KL.'
                    : '潮轻食（@chillhealthybox）一直专注于用心做好健康餐！坚持少油少盐、无味精添加、真实新鲜食材。每日精选优质蛋白质与五谷纤维，专车新鲜配送午餐与晚餐。认真照顾身体，健康饮食就交给潮轻食！'}
                </p>

                {/* Direct Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={reelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-900/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{isEn ? 'Watch Reel on Instagram ↗' : '在 Instagram 上查看原帖 ↗'}</span>
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
