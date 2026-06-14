'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import ConfigWizard from '@/components/Installation/ConfigWizard';

export default function InstallPage() {
  const router = useRouter();
  const { isInstalling, selectedAgent, cancelInstallation } = useMarketplaceStore();

  useEffect(() => {
    if (!isInstalling || !selectedAgent) {
      router.push('/');
    }
  }, [isInstalling, selectedAgent, router]);

  if (!isInstalling || !selectedAgent) {
    return null;
  }

  return <ConfigWizard />;
}