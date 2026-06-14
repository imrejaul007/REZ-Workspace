'use client';

import { useEffect, useState, useRef } from 'react';

interface Promo {
  text: string;
  code?: string;
  bgColor?: string;
}

interface PromoBannerProps {
  promos: Promo[];
}

const DEFAULT_BG = 'bg-indigo-600';

// Map arbitrary hex/named colors to safe Tailwind-compatible inline styles.
// We use inline style for bgColor since dynamic Tailwind class names are
// not safe to construct at runtime (they won't be in the generated CSS).
function resolveBackground(bgColor?: string): React.CSSProperties {
  if (!bgColor) return {};
  // If it already looks like a CSS color value, use it directly
  if (bgColor.startsWith('#') || bgColor.startsWith('rgb') || bgColor.startsWith('hsl')) {
    return { backgroundColor: bgColor };
  }
  return {};
}

function resolveClassName(bgColor?: string): string {
  if (!bgColor) return DEFAULT_BG;
  // If it's not a CSS value, assume it's a Tailwind class
  if (!bgColor.startsWith('#') && !bgColor.startsWith('rgb') && !bgColor.startsWith('hsl')) {
    return bgColor;
  }
  return '';
}

export default function PromoBanner({ promos }: PromoBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = promos?.length ?? 0;

  useEffect(() => {
    if (count <= 1) return;

    function cycle() {
      // Fade out
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % count);
        // Fade in
        setVisible(true);
      }, 300); // 300 ms fade cross-over
    }

    const interval = setInterval(cycle, 3300); // 3 seconds display + 0.3s fade
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [count]);

  if (!promos || promos.length === 0) return null;

  const promo = promos[activeIndex];
  const bgClass = resolveClassName(promo.bgColor);
  const bgStyle = resolveBackground(promo.bgColor);

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ${bgClass}`}
      style={bgStyle}
      role="marquee"
      aria-live="polite"
      aria-label="Promotional banner"
    >
      <div
        className={`flex items-center justify-center gap-3 px-4 py-2.5 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Promo text */}
        <p className="text-white text-xs font-medium text-center leading-snug">
          {promo.text}
        </p>

        {/* Code pill */}
        {promo.code && (
          <span className="shrink-0 inline-flex items-center bg-white/20 border border-white/40 text-white text-xs font-bold rounded-full px-2.5 py-0.5 tracking-wider">
            Use: {promo.code}
          </span>
        )}

        {/* Pagination dots */}
        {count > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => {
                    setActiveIndex(i);
                    setVisible(true);
                  }, 200);
                }}
                aria-label={`Go to promo ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
