'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { redeemStamps, LoyaltyStatus, RedeemResult } from '@/lib/api/loyalty';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';

const TIER_ICON: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

interface LoyaltyWidgetProps {
  stamps: number;
  maxStamps: number;
  tierName?: string;
  nextTierName?: string;
  nextTierStamps?: number;
  rewardDescription?: string;
  // New props for redeem flow
  storeSlug?: string;
  loyaltyStatus?: LoyaltyStatus | null;
  onRewardRedeemed?: (rewardCode: string) => void;
}

// ── Bottom-sheet primitives ──────────────────────────────────────────────────

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

function BottomSheet({ open, onClose, children, title }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-8 space-y-4 shadow-xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1" />
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────

export default function LoyaltyWidget({
  stamps,
  maxStamps,
  tierName,
  nextTierName,
  nextTierStamps,
  rewardDescription,
  storeSlug,
  loyaltyStatus,
  onRewardRedeemed,
}: LoyaltyWidgetProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { openLoginModal, showToast } = useUIStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [copied, setCopied] = useState(false);

  const stampsEarned = Math.min(stamps, maxStamps);
  const progressPercent = maxStamps > 0 ? Math.min((stampsEarned / maxStamps) * 100, 100) : 0;
  const stampsRemaining = Math.max(maxStamps - stampsEarned, 0);
  const rewardReady = stampsEarned >= maxStamps;
  const showDots = maxStamps <= 10;
  const tierKey = tierName?.toLowerCase() ?? '';
  const tierIcon = TIER_ICON[tierKey] ?? null;

  // Use loyaltyStatus.canRedeem if provided, otherwise fall back to local check
  const canRedeem = loyaltyStatus?.canRedeem ?? rewardReady;
  const activeReward = loyaltyStatus?.activeReward ?? null;

  function handleRedeemClick() {
    if (!storeSlug) return;
    if (!isLoggedIn) {
      openLoginModal(() => setConfirmOpen(true));
      return;
    }
    // If there's already an active reward, just show it
    if (activeReward) {
      setRedeemResult({
        success: true,
        rewardCode: activeReward.code,
        description: activeReward.description,
        expiresAt: activeReward.expiresAt,
        alreadyActive: true,
      });
      setRewardOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

  const handleConfirmRedeem = useCallback(async () => {
    if (!storeSlug) return;
    setConfirmOpen(false);
    setRedeeming(true);
    try {
      const result = await redeemStamps(storeSlug);
      setRedeemResult(result);
      setRewardOpen(true);
      if (onRewardRedeemed) {
        onRewardRedeemed(result.rewardCode);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not redeem reward. Please try again.';
      showToast(msg, 'error');
    } finally {
      setRedeeming(false);
    }
  }, [storeSlug, onRewardRedeemed, showToast]);

  async function handleCopyCode() {
    if (!redeemResult?.rewardCode) return;
    try {
      await navigator.clipboard.writeText(redeemResult.rewardCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      showToast(redeemResult.rewardCode, 'success');
    }
  }

  function formatExpiry(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  return (
    <>
      <div className="bg-white border border-indigo-100 rounded-xl px-4 py-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Your loyalty card</h3>

        {/* Stamp dots or text counter */}
        {showDots ? (
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: maxStamps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-colors',
                  i < stampsEarned
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-300'
                )}
              >
                {i < stampsEarned ? '★' : ''}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xl font-bold text-indigo-700">
            {stampsEarned}{' '}
            <span className="text-base font-normal text-gray-500">/ {maxStamps} stamps</span>
          </p>
        )}

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Reward callout or redeem button */}
        {canRedeem || activeReward ? (
          <div className="space-y-2">
            {activeReward ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm font-semibold text-amber-800">
                Active reward: <span className="font-mono tracking-widest">{activeReward.code}</span>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm font-semibold text-green-800">
                Reward ready!{rewardDescription ? ` ${rewardDescription} is yours.` : ''}
              </div>
            )}
            {storeSlug && (
              <button
                onClick={handleRedeemClick}
                disabled={redeeming}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-bold transition-colors',
                  activeReward
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                  redeeming && 'opacity-60 cursor-not-allowed'
                )}
              >
                {redeeming
                  ? 'Redeeming…'
                  : activeReward
                  ? 'View Reward Code'
                  : 'Redeem Reward'}
              </button>
            )}
          </div>
        ) : (
          rewardDescription && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-indigo-700">
                {stampsRemaining} more stamp{stampsRemaining !== 1 ? 's' : ''}
              </span>{' '}
              for <span className="font-medium">{rewardDescription}</span>
            </p>
          )
        )}

        {/* Tier badge + next tier progress */}
        {tierName && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              {tierIcon && <span className="text-base">{tierIcon}</span>}
              <span className="text-xs font-semibold text-gray-700">{tierName} member</span>
            </div>
            {nextTierName && nextTierStamps !== undefined && stampsEarned < nextTierStamps && (
              <p className="text-xs text-gray-500">
                {nextTierStamps - stampsEarned} stamps to{' '}
                <span className="font-semibold">{nextTierName}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation sheet */}
      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Redeem ${maxStamps} stamps?`}
      >
        <p className="text-sm text-gray-600">
          You&apos;ll receive a <span className="font-semibold">{rewardDescription ?? 'reward'}</span>{' '}
          code valid for 24 hours. Your stamp count will reset.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setConfirmOpen(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRedeem}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </BottomSheet>

      {/* Reward code sheet */}
      <BottomSheet
        open={rewardOpen}
        onClose={() => setRewardOpen(false)}
        title="Your reward code"
      >
        {redeemResult && (
          <div className="space-y-4">
            {redeemResult.alreadyActive && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Reward already active — use this code at checkout.
              </p>
            )}
            <p className="text-sm text-gray-600">
              {redeemResult.description}
            </p>
            {/* Large code pill */}
            <button
              onClick={handleCopyCode}
              aria-label="Copy reward code"
              className="w-full bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl px-4 py-4 text-center group hover:bg-indigo-100 transition-colors"
            >
              <span className="block font-mono text-2xl font-black tracking-widest text-indigo-700 group-hover:text-indigo-900 transition-colors">
                {redeemResult.rewardCode}
              </span>
              <span className="block text-xs text-indigo-500 mt-1">
                {copied ? 'Copied!' : 'Tap to copy'}
              </span>
            </button>
            <p className="text-xs text-gray-500 text-center">
              Expires {formatExpiry(redeemResult.expiresAt)}
            </p>
            <button
              onClick={() => setRewardOpen(false)}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
