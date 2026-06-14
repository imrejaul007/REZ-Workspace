'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import Modal from '@/components/ui/Modal';

type GalleryMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  category?: 'gallery' | 'before' | 'after';
};

type GalleryTab = 'all' | 'gallery' | 'before' | 'after';

interface GalleryProps {
  /** Gallery media items */
  items: GalleryMedia[];
  /** Optional video intro URL (YouTube, Vimeo, or direct video) */
  videoIntroUrl?: string;
  /** Optional video intro thumbnail */
  videoIntroThumbnail?: string;
  /** Optional title for video intro section */
  videoIntroTitle?: string;
  className?: string;
}

function isVideoUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop();
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}

function VideoIntro({ url, thumbnail, title }: { url: string; thumbnail?: string; title?: string }) {
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <>
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-6 group cursor-pointer" onClick={() => setShowVideo(true)}>
        {thumbnail && !thumbnailError ? (
          <Image
            src={thumbnail}
            alt={title || 'Video intro'}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
        )}
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Title overlay */}
        {title && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white font-semibold text-sm">{title}</p>
          </div>
        )}
      </div>

      <Modal open={showVideo} onClose={() => setShowVideo(false)} title={title}>
        <div className="aspect-video -mx-6 -mb-6 mt-[-1.5rem]">
          <iframe
            src={getEmbedUrl(url)}
            title={title || 'Video intro'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </Modal>
    </>
  );
}

function GalleryGrid({ items, activeTab }: { items: GalleryMedia[]; activeTab: GalleryTab }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter((item) => item.category === activeTab);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + filteredItems.length) % filteredItems.length;
    });
  }, [filteredItems.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % filteredItems.length;
    });
  }, [filteredItems.length]);

  if (filteredItems.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group',
              item.type === 'video' && 'ring-2 ring-indigo-200'
            )}
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={item.type === 'image' ? item.url : (item.thumbnail || item.url)}
              alt={item.caption || `Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Modal
        open={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-4xl"
      >
        {selectedIndex !== null && (
          <div className="relative -mx-6 -mb-6 mt-[-1.5rem] bg-black aspect-video">
            {filteredItems[selectedIndex].type === 'video' ? (
              <iframe
                src={getEmbedUrl(filteredItems[selectedIndex].url)}
                title={filteredItems[selectedIndex].caption || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <Image
                src={filteredItems[selectedIndex].url}
                alt={filteredItems[selectedIndex].caption || 'Gallery image'}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
              />
            )}
            {/* Navigation */}
            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            {filteredItems[selectedIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm">{filteredItems[selectedIndex].caption}</p>
                <p className="text-gray-400 text-xs mt-1">{selectedIndex + 1} / {filteredItems.length}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Gallery({ items, videoIntroUrl, videoIntroThumbnail, videoIntroTitle, className }: GalleryProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('all');

  const hasBeforeAfter = items.some((item) => item.category === 'before' || item.category === 'after');
  const tabs: { id: GalleryTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'gallery', label: 'Gallery' },
  ];

  if (hasBeforeAfter) {
    tabs.push({ id: 'before', label: 'Before' });
    tabs.push({ id: 'after', label: 'After' });
  }

  if (items.length === 0 && !videoIntroUrl) {
    return null;
  }

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="gallery-heading">
      <div className="max-w-3xl mx-auto">
        <h2 id="gallery-heading" className="text-xl font-bold text-gray-900 mb-4">
          Gallery
        </h2>

        {/* Video Intro */}
        {videoIntroUrl && (
          <VideoIntro url={videoIntroUrl} thumbnail={videoIntroThumbnail} title={videoIntroTitle} />
        )}

        {/* Tabs */}
        {hasBeforeAfter && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <GalleryGrid items={items} activeTab={activeTab} />
      </div>
    </section>
  );
}
