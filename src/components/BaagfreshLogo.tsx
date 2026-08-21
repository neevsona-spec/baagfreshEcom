import React from 'react';

interface BaagfreshLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'vertical' | 'icon-only';
  textColor?: string;
  showTagline?: boolean;
}

export const BaagfreshLogo: React.FC<BaagfreshLogoProps> = ({
  className = '',
  size = 'md',
  layout = 'horizontal',
  textColor,
  showTagline = true,
}) => {
  // Dimension scale mappings
  const iconSizeMap = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 76,
  };

  const currentIconSize = iconSizeMap[size];

  return (
    <div
      className={`inline-flex items-center select-none ${
        layout === 'vertical' ? 'flex-col text-center gap-1.5' : 'gap-2 sm:gap-3'
      } ${className}`}
    >
      {/* High-Fidelity Vector Replica of Baagfresh Circular Crest Emblem */}
      <svg
        width={currentIconSize}
        height={currentIconSize}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105 ${
          size === 'md' ? 'w-9 h-9 sm:w-11 sm:h-11' : ''
        }`}
        aria-label="Baagfresh Logo"
      >
        <defs>
          {/* Gold Wreath Outer Petals Gradients */}
          <linearGradient id="bfGoldGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4BC" />
            <stop offset="25%" stopColor="#F9D460" />
            <stop offset="55%" stopColor="#D89A1D" />
            <stop offset="85%" stopColor="#9E6904" />
            <stop offset="100%" stopColor="#E4B138" />
          </linearGradient>

          <linearGradient id="bfGoldGradInner" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#D99B1E" />
            <stop offset="80%" stopColor="#8C5804" />
            <stop offset="100%" stopColor="#F5D061" />
          </linearGradient>

          <linearGradient id="bfGoldRibbed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFECA8" />
            <stop offset="20%" stopColor="#CA8D15" />
            <stop offset="40%" stopColor="#FFF1B8" />
            <stop offset="60%" stopColor="#AA7107" />
            <stop offset="80%" stopColor="#FED867" />
            <stop offset="100%" stopColor="#8F5A02" />
          </linearGradient>

          {/* Green Ring Gradient */}
          <radialGradient id="bfGreenRingGrad" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#2BB824" />
            <stop offset="85%" stopColor="#1E8E18" />
            <stop offset="100%" stopColor="#0F5B0C" />
          </radialGradient>

          <linearGradient id="bfGreenLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="30%" stopColor="#34D399" />
            <stop offset="70%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Royal Blue Medallion Gradient */}
          <radialGradient id="bfRoyalBlue" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#2D46B9" />
            <stop offset="45%" stopColor="#1D2F8F" />
            <stop offset="85%" stopColor="#131F68" />
            <stop offset="100%" stopColor="#0C1448" />
          </radialGradient>

          {/* Leaf Gradients with Vibrant Fresh Organic Tones */}
          <linearGradient id="bfLeafTopGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#99F647" />
            <stop offset="35%" stopColor="#55C91D" />
            <stop offset="75%" stopColor="#258E0F" />
            <stop offset="100%" stopColor="#115506" />
          </linearGradient>

          <linearGradient id="bfLeafMidGrad" x1="10%" y1="20%" x2="90%" y2="80%">
            <stop offset="0%" stopColor="#A8F855" />
            <stop offset="40%" stopColor="#63D224" />
            <stop offset="80%" stopColor="#2D9A14" />
            <stop offset="100%" stopColor="#146008" />
          </linearGradient>

          <linearGradient id="bfLeafBotGrad" x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#84E832" />
            <stop offset="45%" stopColor="#4BBF16" />
            <stop offset="85%" stopColor="#217D0C" />
            <stop offset="100%" stopColor="#0E4605" />
          </linearGradient>

          {/* Water Droplet Gradients */}
          <radialGradient id="bfDewDrop" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#C7F9CC" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#4ADE80" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#064E3B" stopOpacity="0.6" />
          </radialGradient>

          <filter id="bfEmblemShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <filter id="bfLeafShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="-1" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Global Emblem Group */}
        <g filter="url(#bfEmblemShadow)">
          {/* --- 1. Outer Golden Wheat Laurels / Grain Wreath (32 Radial Petals) --- */}
          <g id="outer-golden-laurel">
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = (i * 360) / 32;
              return (
                <g key={i} transform={`rotate(${angle} 125 120)`}>
                  {/* Outer flared leaf tip */}
                  <path
                    d="M125 18 C133 26, 142 46, 125 58 C108 46, 117 26, 125 18 Z"
                    fill="url(#bfGoldGradOuter)"
                  />
                  {/* Inner leaf spine accent */}
                  <path
                    d="M125 21 C129 28, 134 40, 125 48 C116 40, 121 28, 125 21 Z"
                    fill="url(#bfGoldGradInner)"
                    opacity="0.85"
                  />
                  {/* Gold spine center ridge */}
                  <line
                    x1="125"
                    y1="20"
                    x2="125"
                    y2="54"
                    stroke="#FFEBA3"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </g>
              );
            })}
          </g>

          {/* --- 2. Golden Ribbed / Fluted Outer Border Ring --- */}
          <circle cx="125" cy="120" r="82" fill="url(#bfGoldGradOuter)" stroke="#8A5B05" strokeWidth="1.5" />
          <circle cx="125" cy="120" r="78" fill="url(#bfGoldRibbed)" stroke="#5B3A01" strokeWidth="0.8" />
          <circle cx="125" cy="120" r="75" fill="none" stroke="#FFF7D6" strokeWidth="1.5" strokeDasharray="3.5 2" />

          {/* --- 3. Concentric Vibrant Green Ring --- */}
          <circle cx="125" cy="120" r="71" fill="url(#bfGreenRingGrad)" stroke="#115506" strokeWidth="1.2" />
          <circle cx="125" cy="120" r="66" fill="none" stroke="#86EFAC" strokeWidth="1.2" opacity="0.75" />
          <circle cx="125" cy="120" r="62" fill="#1B7C1B" />

          {/* --- 4. Golden Inner Bevel Ring --- */}
          <circle cx="125" cy="120" r="56" fill="url(#bfGoldGradOuter)" stroke="#8A5B05" strokeWidth="1" />
          <circle cx="125" cy="120" r="52" fill="#996507" />
          <circle cx="125" cy="120" r="50" fill="url(#bfGoldGradInner)" />

          {/* --- 5. Royal Blue Center Medallion --- */}
          <circle cx="125" cy="120" r="46" fill="url(#bfRoyalBlue)" stroke="#FDE68A" strokeWidth="1.5" />

          {/* --- 6. White Royal Crown / Lotus Emblem in Center --- */}
          <g id="royal-crown-crest" transform="translate(125, 98) scale(0.82) translate(-50, -45)">
            {/* Unified Royal Lotus Crown Silhouette */}
            <path
              d="M50 12 C54 24 62 38 50 50 C38 38 46 24 50 12 Z
                 M50 50 C42 40 24 30 18 39 C14 45 28 53 50 56 Z
                 M50 50 C58 40 76 30 82 39 C86 45 72 53 50 56 Z
                 M50 56 C36 50 12 38 9 26 C8 20 18 28 38 46 Z
                 M50 56 C64 50 88 38 91 26 C92 20 82 28 62 46 Z"
              fill="#FFFFFF"
            />
            {/* Crown Base Arc */}
            <path
              d="M20 54 Q50 63 80 54 Q50 59 20 54 Z"
              fill="#FFFFFF"
            />
            {/* Three Circular Jewels / Nodes at Crown Base */}
            <circle cx="33" cy="52" r="3.2" fill="#FFFFFF" />
            <circle cx="50" cy="53.5" r="3.6" fill="#FFFFFF" />
            <circle cx="67" cy="52" r="3.2" fill="#FFFFFF" />
            <circle cx="33" cy="52" r="1.6" fill="#1D2F8F" />
            <circle cx="50" cy="53.5" r="1.8" fill="#1D2F8F" />
            <circle cx="67" cy="52" r="1.6" fill="#1D2F8F" />
          </g>

          {/* --- 7. Bold "BF" Monogram in Royal Blue Medallion --- */}
          <text
            x="125"
            y="149"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="28"
            fontWeight="900"
            fontFamily="Arial Black, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            letterSpacing="-0.5px"
            filter="drop-shadow(0 1.5px 1px rgba(0,0,0,0.5))"
          >
            BF
          </text>
        </g>

        {/* --- 8. Fresh Green Orchard Leaves Overlaid on Left with Water Droplets --- */}
        <g id="fresh-leaves-group" filter="url(#bfLeafShadow)">
          {/* Top-Left Leaf (Pointing Up-Left ~10 o'clock) */}
          <g>
            <path
              d="M80 82 C55 48, 68 24, 88 28 C96 48, 106 64, 80 82 Z"
              fill="url(#bfLeafTopGrad)"
              stroke="#0E4605"
              strokeWidth="1.4"
            />
            {/* Central Leaf Vein */}
            <path
              d="M80 82 Q83 52 88 28"
              stroke="#DCFCE7"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Leaf Vein Branches */}
            <path
              d="M82 66 Q75 58 72 52 M84 54 Q77 46 76 40 M82 62 Q88 56 94 52"
              stroke="#DCFCE7"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Dew Drops on Top Leaf */}
            <ellipse cx="78" cy="46" rx="3.5" ry="4.5" transform="rotate(-20 78 46)" fill="url(#bfDewDrop)" />
            <ellipse cx="77" cy="44" rx="1.2" ry="1.6" fill="#FFFFFF" opacity="0.95" />
            <ellipse cx="88" cy="58" rx="2" ry="2.6" fill="url(#bfDewDrop)" />
          </g>

          {/* Mid-Left Leaf (Pointing Left ~9 o'clock) */}
          <g>
            <path
              d="M74 110 C38 88, 42 54, 66 56 C80 76, 96 92, 74 110 Z"
              fill="url(#bfLeafMidGrad)"
              stroke="#0E4605"
              strokeWidth="1.5"
            />
            {/* Central Leaf Vein */}
            <path
              d="M74 110 Q61 82 66 56"
              stroke="#DCFCE7"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Vein Branches */}
            <path
              d="M68 94 Q55 86 50 78 M70 82 Q58 74 54 68 M68 90 Q76 82 84 76"
              stroke="#DCFCE7"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Dew Drops on Mid Leaf */}
            <ellipse cx="58" cy="74" rx="4.5" ry="6" transform="rotate(-30 58 74)" fill="url(#bfDewDrop)" />
            <ellipse cx="56" cy="71" rx="1.5" ry="2.2" fill="#FFFFFF" opacity="0.95" />
            <ellipse cx="76" cy="88" rx="2.5" ry="3.2" transform="rotate(15 76 88)" fill="url(#bfDewDrop)" />
            <ellipse cx="75" cy="86" rx="0.8" ry="1.2" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Lower-Left Leaf (Pointing Down-Left ~8 o'clock) */}
          <g>
            <path
              d="M84 138 C56 126, 52 98, 72 94 C88 110, 98 124, 84 138 Z"
              fill="url(#bfLeafBotGrad)"
              stroke="#0E4605"
              strokeWidth="1.3"
            />
            {/* Central Leaf Vein */}
            <path
              d="M84 138 Q74 114 72 94"
              stroke="#DCFCE7"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Dew Drop on Lower Leaf */}
            <ellipse cx="68" cy="112" rx="3.2" ry="4" transform="rotate(-15 68 112)" fill="url(#bfDewDrop)" />
            <ellipse cx="67" cy="110" rx="1.1" ry="1.4" fill="#FFFFFF" opacity="0.95" />
            <ellipse cx="80" cy="124" rx="1.8" ry="2.2" fill="url(#bfDewDrop)" />
          </g>
        </g>
      </svg>

      {/* --- Brand Typography (Matching "Baagfresh" text from logo) --- */}
      {layout !== 'icon-only' && (
        <div className={`flex flex-col ${layout === 'vertical' ? 'items-center' : 'items-start'}`}>
          <span
            className={`font-sans tracking-tight font-bold text-[#012d1d] dark:text-[#FAF3E0] leading-none ${
              size === 'sm'
                ? 'text-base sm:text-lg'
                : size === 'md'
                ? 'text-xl sm:text-2xl md:text-3xl'
                : size === 'lg'
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : 'text-3xl sm:text-4xl md:text-5xl'
            } ${textColor || ''}`}
            style={{ fontFamily: 'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)' }}
          >
            Baagfresh
          </span>

          {showTagline && (
            <span
              className={`tracking-wider sm:tracking-[0.2em] uppercase font-bold text-[#635336] dark:text-[#a8c9b9] mt-0.5 sm:mt-1 ${
                size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[8px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
              }`}
            >
              Dry Fruits & Spices • Varanasi
            </span>
          )}
        </div>
      )}
    </div>
  );
};

