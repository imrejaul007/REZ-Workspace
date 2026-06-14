'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

/**
 * Optimized image component with lazy loading, blur placeholder, and error handling
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 75,
  loading = 'lazy',
  onLoad,
  onError,
  fallback = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImgSrc(fallback);
    onError?.();
  };

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        sizes={sizes}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Progressive image component that loads multiple resolutions
 */
interface ProgressiveImageProps extends OptimizedImageProps {
  srcSet?: {
    small: string;
    medium: string;
    large: string;
  };
}

export function ProgressiveImage({
  srcSet,
  src,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(srcSet?.small || src);
  const [loadedSizes, setLoadedSizes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!srcSet) return;

    const loadImage = (imageSrc: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageSrc;
      });
    };

    const loadProgressive = async () => {
      try {
        // Load medium resolution
        if (srcSet.medium && !loadedSizes.has('medium')) {
          await loadImage(srcSet.medium);
          setCurrentSrc(srcSet.medium);
          setLoadedSizes(prev => new Set(prev).add('medium'));
        }

        // Load high resolution
        if (srcSet.large && !loadedSizes.has('large')) {
          await loadImage(srcSet.large);
          setCurrentSrc(srcSet.large);
          setLoadedSizes(prev => new Set(prev).add('large'));
        }
      } catch (error) {
        console.error('Failed to load progressive image:', error);
      }
    };

    loadProgressive();
  }, [srcSet, loadedSizes]);

  return <OptimizedImage {...props} src={currentSrc} />;
}

/**
 * Lazy image grid component for efficient gallery rendering
 */
interface LazyImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  onImageClick?: (image) => void;
}

export function LazyImageGrid({
  images,
  columns = 3,
  gap = 16,
  onImageClick,
}: LazyImageGridProps) {
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute('data-image-id');
            if (imageId) {
              setVisibleImages(prev => new Set(prev).add(imageId));
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const imageRef = (element: HTMLDivElement | null, imageId: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-image-id', imageId);
      observerRef.current.observe(element);
    }
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image) => (
        <div
          key={image.id}
          ref={(el) => imageRef(el, image.id)}
          className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onImageClick?.(image)}
        >
          {visibleImages.has(image.id) ? (
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width || 300}
              height={image.height || 300}
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Avatar component with optimized loading and fallback
 */
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  initials?: string;
  className?: string;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  fallback,
  initials,
  className = '',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  const handleError = () => {
    setHasError(true);
  };

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium`}
      >
        {initials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      onError={handleError}
      fallback={fallback}
    />
  );
}

// Utility function to generate blur data URL
function generateBlurDataURL(): string {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#grad)" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Hook for preloading critical images
export function useImagePreloader(imageUrls: string[]) {
  useEffect(() => {
    const preloadImages = imageUrls.map((url) => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    return () => {
      preloadImages.forEach((img) => {
        img.src = '';
      });
    };
  }, [imageUrls]);
}