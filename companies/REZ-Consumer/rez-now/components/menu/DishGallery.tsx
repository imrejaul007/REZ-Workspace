'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import StoreImage from '@/components/ui/StoreImage';

interface DishGalleryProps {
  imageHd?: string | null;
  image?: string | null;
  name: string;
  videoUrl?: string | null;
  className?: string;
}

export default function DishGallery({ imageHd, image, name, videoUrl, className }: DishGalleryProps) {
  const [zoomOpen, setZoomOpen] = useState(false);

  const displayImage = imageHd || image;
  const hasVideo = !!videoUrl;

  if (!displayImage) return null;

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Main image */}
        <button
          onClick={() => setZoomOpen(true)}
          className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 relative group"
          aria-label={`View ${name} in full screen`}
        >
          <StoreImage
            src={displayImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Zoom hint overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
          </div>
          {/* HD badge */}
          {imageHd && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              HD
            </span>
          )}
        </button>

        {/* Video thumbnail indicator */}
        {hasVideo && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Video</span>
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} full screen`}
        >
          {/* Close button */}
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Zoomed image */}
          <div className="relative w-full max-w-4xl aspect-video">
            <StoreImage
              src={displayImage}
              alt={name}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Video link */}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Video
            </a>
          )}

          <p className="absolute bottom-4 right-4 text-white/60 text-xs">{name}</p>
        </div>
      )}
    </>
  );
}
