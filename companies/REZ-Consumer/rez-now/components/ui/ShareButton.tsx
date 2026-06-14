'use client';

import { useState } from 'react';
import { shareContent } from '@/lib/utils/share';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/store/uiStore';

interface ShareButtonProps {
  /** Pre-filled message body (without URL — URL is passed separately). */
  text: string;
  /** Canonical URL to share. Also copied to clipboard on fallback. */
  url: string;
  /** Title forwarded to the Web Share API. */
  title?: string;
  /** Label shown in 'full' variant. Defaults to "Share". */
  label?: string;
  /**
   * 'icon' — small icon-only button for inline use (e.g. inside a header).
   * 'full' — full-width button with icon + label.
   */
  variant?: 'icon' | 'full';
  className?: string;
}

export default function ShareButton({
  text,
  url,
  title = 'REZ Now',
  label = 'Share',
  variant = 'full',
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  async function handleShare() {
    // shareContent resolves after the share sheet is shown or clipboard is written.
    // It rejects only in extreme edge cases — we treat both outcomes the same way.
    try {
      await shareContent({ title, text, url });

      // If the native share sheet was used there is nothing extra to do.
      // If we fell back to clipboard, surface a brief "Link copied!" toast.
      // We detect the clipboard path by checking whether clipboard write succeeded
      // by attempting a read — but that is overly invasive.  Instead we use the
      // simpler heuristic: if navigator.share is absent we always copied.
      const usedClipboard =
        typeof navigator === 'undefined' ||
        typeof navigator.share !== 'function';

      if (usedClipboard) {
        setCopied(true);
        showToast('Link copied!', 'success');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Silent — user cancelled or sharing not supported at all
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        aria-label={copied ? 'Link copied!' : label}
        title={copied ? 'Link copied!' : label}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-indigo-600 transition-colors',
          className,
        )}
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-green-600" />
        ) : (
          <ShareIcon className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        className,
      )}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4 text-green-600" />
          <span className="text-green-700">Link copied!</span>
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ── Inline SVG icons (no external dependency) ────────────────────────────────

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
