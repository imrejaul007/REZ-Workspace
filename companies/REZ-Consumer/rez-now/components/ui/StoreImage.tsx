'use client';

import Image from 'next/image';
import { useState } from 'react';

// 1×1 indigo blur placeholder (base64 PNG)
const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

interface StoreImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  /**
   * Passed through to next/image `sizes` when using `fill`.
   * Defaults to "100vw" which is safe; callers should provide a tighter
   * value (e.g. "56px" for a fixed-size logo) to avoid oversized fetches.
   */
  sizes?: string;
}

function Placeholder({ alt, className }: { alt: string; className?: string }) {
  const initial = alt ? alt.charAt(0).toUpperCase() : '?';
  return (
    <div
      className={`bg-gray-100 flex items-center justify-center text-gray-400 font-semibold select-none ${className ?? ''}`}
      aria-label={alt}
    >
      <span className="text-lg leading-none">{initial}</span>
    </div>
  );
}

export default function StoreImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = '100vw',
}: StoreImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return <Placeholder alt={alt} className={className} />;
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      onError={() => setErrored(true)}
    />
  );
}
