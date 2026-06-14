import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  blurhash?: string;
  lazy?: boolean;
  quality?: number;
  webp?: boolean;
  avif?: boolean;
}

// Optimized Image component with WebP/AVIF support
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  blurhash,
  lazy = true,
  quality = 75,
  webp = true,
  avif = true,
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate optimized image URL
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.startsWith('/_next/') || originalSrc.startsWith('/')) {
      return originalSrc;
    }

    // For external images, use Next.js image optimization
    const params = new URLSearchParams({
      url: originalSrc,
      w: props.width?.toString() || '800',
      q: quality.toString(),
    });

    return `/_next/image?${params.toString()}`;
  };

  // Handle image load error
  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    }
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Placeholder component
  const Placeholder = () => (
    <div
      className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      style={{
        width: props.width,
        height: props.height,
        aspectRatio: `${props.width} / ${props.height}`,
      }}
    >
      <svg
        className="w-8 h-8 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  if (hasError && !fallbackSrc) {
    return <Placeholder />;
  }

  return (
    <div className="relative">
      {!isLoaded && <Placeholder />}
      <Image
        {...props}
        src={getOptimizedSrc(imageSrc)}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        quality={quality}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        blurDataURL={blurhash}
        placeholder={blurhash ? 'blur' : 'empty'}
      />
    </div>
  );
};

// Responsive image component
interface ResponsiveImageProps extends OptimizedImageProps {
  sizes: string;
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 },
  sizes,
  ...props
}) => {
  return (
    <OptimizedImage
      {...props}
      sizes={sizes}
      style={{
        width: '100%',
        height: 'auto',
      }}
    />
  );
};

// Image gallery with lazy loading
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
    thumbnail?: string;
  }>;
  columns?: number;
  lazy?: boolean;
  quality?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  lazy = true,
  quality = 75,
}) => {
  const [visibleImages, setVisibleImages] = useState(lazy ? 6 : images.length);

  const loadMoreImages = () => {
    setVisibleImages((prev) => Math.min(prev + 6, images.length));
  };

  return (
    <div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {images.slice(0, visibleImages).map((image, index) => (
          <div key={index} className="aspect-square">
            <OptimizedImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              width={400}
              height={400}
              quality={quality}
              lazy={lazy}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            />
            {image.caption && (
              <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
            )}
          </div>
        ))}
      </div>

      {visibleImages < images.length && (
        <div className="text-center mt-6">
          <button
            onClick={loadMoreImages}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Load More Images
          </button>
        </div>
      )}
    </div>
  );
};

// Progressive image loading hook
export const useProgressiveImage = (src: string, placeholderSrc?: string) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || '');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { src: imgSrc, isLoaded };
};

// Image preloader utility
export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

// Critical image component (loads immediately)
export const CriticalImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      {...props}
      lazy={false}
      priority
      quality={85}
    />
  );
};

// Image with intersection observer for lazy loading
export const LazyImage: React.FC<OptimizedImageProps & { rootMargin?: string }> = ({
  rootMargin = '50px',
  ...props
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, shouldLoad, rootMargin]);

  return (
    <div ref={setRef}>
      {shouldLoad ? (
        <OptimizedImage {...props} lazy={false} />
      ) : (
        <div
          className="bg-gray-200 animate-pulse"
          style={{
            width: props.width,
            height: props.height,
            aspectRatio: `${props.width} / ${props.height}`,
          }}
        />
      )}
    </div>
  );
};

// Image performance utilities
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const generateBlurDataURL = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
};

// Image optimization configuration
export const imageOptimizationConfig = {
  domains: [
    'localhost',
    'restauranthub-assets.s3.amazonaws.com',
    'images.unsplash.com',
  ],
  formats: ['image/webp', 'image/avif'],
  quality: {
    low: 50,
    medium: 75,
    high: 90,
  },
  sizes: {
    thumbnail: 150,
    small: 320,
    medium: 640,
    large: 1024,
    xlarge: 1920,
  },
};