import { logger } from '../../shared/logger';
'use client'

import { FraudPanel } from '@/components/dashboard/FraudPanel'

export default function FraudPage() {
  return (
    <FraudPanel
      flags={[]}
      onResolve={(flagId, resolution) => {
        logger.info('Resolve flag:', flagId, resolution)
      }}
      onViewDetails={(flagId) => {
        logger.info('View details:', flagId)
      }}
    />
  )
}
