import React from 'react';

interface ChillLogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'badge';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ChillLogo: React.FC<ChillLogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'light',
  size = 'md',
}) => {
  const isDark = theme === 'dark';
  // Exact brand olive-forest green from the uploaded logo image
  const brandGreen = '#3b6026';

  // Dimensions
  const sizeMap = {
    sm: { height: 32, markBox: 32, badgeSize: 40 },
    md: { height: 44, markBox: 44, badgeSize: 52 },
    lg: { height: 56, markBox: 56, badgeSize: 68 },
    xl: { height: 76, markBox: 76, badgeSize: 96 },
  };

  const dim = sizeMap[size] || sizeMap.md;

  if (variant === 'badge') {
    // Official square badge with white canvas matching the uploaded brand logo image
    return (
      <div
        className={`inline-flex items-center justify-center bg-white rounded-2xl p-1.5 shadow-sm border border-stone-200/90 overflow-hidden ${className}`}
        style={{ height: dim.badgeSize, width: dim.badgeSize }}
      >
        <svg viewBox="0 0 1000 1000" className="w-full h-full" fill="none">
          <g transform="translate(15, 0)">
            {/* Typography: CHILL HEALTHY */}
            <g
              fill={brandGreen}
              fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              <text x="205" y="482" fontSize="112">CHILL</text>
              <text x="205" y="605" fontSize="112">HEALTHY</text>
            </g>

            {/* Logo Mark: Smiling Bowl with Sprout */}
            <g
              stroke={brandGreen}
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1="675" y1="412" x2="675" y2="445" />
              <path d="M 675,412 C 632,385 595,370 605,348 C 625,340 660,375 675,412 Z" />
              <path d="M 675,412 C 700,378 722,342 744,332 C 758,348 720,392 675,412 Z" />
              <ellipse cx="675" cy="452" rx="114" ry="26" />
              <path d="M 561,452 C 565,538 610,572 675,572 C 740,572 785,538 789,452" />
              <path d="M 632,504 C 646,528 704,528 718,504" strokeWidth="13" />
            </g>
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'mark') {
    // The official smiling bowl with sprouting leaves icon mark
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: dim.markBox, height: dim.markBox }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
          <g
            transform="translate(150, 140)"
            stroke={brandGreen}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Center Stem */}
            <line x1="0" y1="-30" x2="0" y2="0" />
            {/* Left Leaf */}
            <path d="M 0,-30 C -38,-55 -70,-68 -62,-88 C -44,-95 -12,-63 0,-30 Z" fill={isDark ? '#1c1917' : '#ffffff'} />
            {/* Right Leaf */}
            <path d="M 0,-30 C 22,-60 42,-92 62,-100 C 74,-86 40,-46 0,-30 Z" fill={isDark ? '#1c1917' : '#ffffff'} />
            {/* Bowl Rim */}
            <ellipse cx="0" cy="5" rx="98" ry="22" fill={isDark ? '#1c1917' : '#ffffff'} />
            {/* Bowl Basin */}
            <path d="M -98,5 C -94,78 -55,108 0,108 C 55,108 94,78 98,5" />
            {/* Friendly Smile */}
            <path d="M -36,50 C -24,70 24,70 36,50" strokeWidth="10" />
          </g>
        </svg>
      </div>
    );
  }

  // Full Brand Logo Lockup
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official White Badge */}
      <div
        className="shrink-0 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-stone-200/90"
        style={{ width: dim.height, height: dim.height }}
      >
        <svg viewBox="0 0 1000 1000" className="w-full h-full" fill="none">
          <g transform="translate(15, 0)">
            <g
              fill={brandGreen}
              fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              <text x="205" y="482" fontSize="112">CHILL</text>
              <text x="205" y="605" fontSize="112">HEALTHY</text>
            </g>
            <g
              stroke={brandGreen}
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1="675" y1="412" x2="675" y2="445" />
              <path d="M 675,412 C 632,385 595,370 605,348 C 625,340 660,375 675,412 Z" />
              <path d="M 675,412 C 700,378 722,342 744,332 C 758,348 720,392 675,412 Z" />
              <ellipse cx="675" cy="452" rx="114" ry="26" />
              <path d="M 561,452 C 565,538 610,572 675,572 C 740,572 785,538 789,452" />
              <path d="M 632,504 C 646,528 704,528 718,504" strokeWidth="13" />
            </g>
          </g>
        </svg>
      </div>

      {/* Brand Text Stacked */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight text-lg sm:text-xl ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            CHILL <span style={{ color: brandGreen }}>HEALTHY</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tracking-wider">
            潮轻食
          </span>
        </div>
        <span
          className={`text-[10px] font-medium tracking-wide mt-0.5 ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          Daily Fresh Prep · Klang Valley
        </span>
      </div>
    </div>
  );
};
