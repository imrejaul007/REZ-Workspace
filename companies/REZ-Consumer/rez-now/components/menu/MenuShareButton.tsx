'use client';

import { useAuthStore } from '@/lib/store/authStore';
import ShareButton from '@/components/ui/ShareButton';

interface MenuShareButtonProps {
  storeName: string;
  storeSlug: string;
}

export default function MenuShareButton({ storeName, storeSlug }: MenuShareButtonProps) {
  const { user } = useAuthStore();
  const storeUrl = `https://now.rez.money/${storeSlug}${user?.referralCode ? `?ref=${user.referralCode}` : ''}`;
  const text = `Order from ${storeName} on REZ Now`;
  const url = storeUrl;

  return (
    <ShareButton
      text={text}
      url={url}
      title={storeName}
      label="Share store"
      variant="icon"
    />
  );
}
