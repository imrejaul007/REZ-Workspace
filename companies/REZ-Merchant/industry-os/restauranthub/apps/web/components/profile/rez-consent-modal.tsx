'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type ConsentTier = 0 | 1 | 2;

interface RezConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: ConsentTier;
  onSave: (tier: ConsentTier) => Promise<void>;
}

const TIERS = [
  {
    tier: 0 as ConsentTier,
    label: 'Identity Only',
    tag: 'Always On',
    description:
      'Your name, store type, and city are visible on RestoPapa. This cannot be disabled as it is required for your profile to be listed.',
    alwaysOn: true,
  },
  {
    tier: 1 as ConsentTier,
    label: 'Operational Metrics',
    tag: 'Optional',
    description:
      'Hiring activity stats and staff training completion rates are shown on your public profile to build trust with job seekers.',
    alwaysOn: false,
  },
  {
    tier: 2 as ConsentTier,
    label: 'Benchmarking Pool',
    tag: 'Optional',
    description:
      'Anonymous operational data from your store is included in peer benchmark reports. Your specific numbers are never revealed.',
    alwaysOn: false,
  },
];

export function RezConsentModal({
  open,
  onOpenChange,
  currentTier,
  onSave,
}: RezConsentModalProps) {
  const [selectedTier, setSelectedTier] = useState<ConsentTier>(currentTier);
  const [saving, setSaving] = useState(false);

  const handleToggle = (tier: ConsentTier, enabled: boolean) => {
    if (tier === 0) return; // Tier 0 is always on
    if (!enabled) {
      setSelectedTier(tier === 1 ? 0 : selectedTier === 2 ? 1 : 0);
    } else {
      setSelectedTier(tier);
    }
  };

  const isTierEnabled = (tier: ConsentTier) => selectedTier >= tier;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTier);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>REZ Data Settings</DialogTitle>
          <DialogDescription>
            Control how your REZ merchant data is shared on RestoPapa. Tier 0 is
            required; higher tiers are optional and can be changed at unknown time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {TIERS.map(({ tier, label, tag, description, alwaysOn }) => (
            <div
              key={tier}
              className="flex items-start gap-4 rounded-lg border p-3"
            >
              <Switch
                checked={isTierEnabled(tier)}
                onCheckedChange={(checked) => handleToggle(tier, checked)}
                disabled={alwaysOn}
                aria-label={`Enable ${label}`}
                className="mt-0.5 shrink-0"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{label}</span>
                  <Badge
                    variant="outline"
                    className={
                      alwaysOn
                        ? 'border-slate-300 text-slate-500 text-xs'
                        : 'border-emerald-300 text-emerald-700 text-xs'
                    }
                  >
                    {tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
