// ============================================================================
// SUTAR Contract OS - Analytics Service
// ============================================================================

import { Contract, contract.type, contract.status, ContractAnalytics, TemplateVariable } from '../types/index';

// Analytics store for aggregated data
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get cache or compute
const getOrCompute = <T>(key: string, compute: () => T): T => {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = compute();
  analyticsCache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Analytics Service Functions
export const analyticsService = {
  // Get overall contract analytics
  getContractAnalytics: (contracts: Contract[]): ContractAnalytics => {
    return getOrCompute('contract-analytics', () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const activeContracts = contracts.filter(c => c.status === 'active');
      const expiredContracts = contracts.filter(c => c.status === 'expired');
      const pendingContracts = contracts.filter(c => c.status === 'pending' || c.status === 'draft');

      // Calculate total value
      const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
      const activeValue = activeContracts.reduce((sum, c) => sum + (c.value || 0), 0);

      // Contracts by type
      const contractsByType: Record<contract.type, number> = {} as Record<contract.type, number>;
      Object.values(contract.type).forEach(type => {
        contractsByType[type] = contracts.filter(c => c.type === type).length;
      });

      // Contracts by status
      const contractsByStatus: Record<contract.status, number> = {} as Record<contract.status, number>;
      Object.values(contract.status).forEach(status => {
        contractsByStatus[status] = contracts.filter(c => c.status === status).length;
      });

      // Top parties
      const partyStats = new Map<string, { count: number; totalValue: number }>();
      contracts.forEach(c => {
        c.parties.forEach(p => {
          const existing = partyStats.get(p.name) || { count: 0, totalValue: 0 };
          partyStats.set(p.name, {
            count: existing.count + 1,
            totalValue: existing.totalValue + (c.value || 0),
          });
        });
      });
      const topParties = Array.from(partyStats.entries())
        .map(([partyName, stats]) => ({ partyName, ...stats }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Upcoming renewals
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingRenewals = activeContracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate > now && endDate <= thirtyDaysFromNow;
      }).length;

      // Expiring this month
      const expiringThisMonth = activeContracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate >= thisMonth && endDate < nextMonth;
      }).length;

      // Average duration
      const durations = contracts
        .filter(c => c.startDate && c.endDate)
        .map(c => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
        });
      const averageDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      // Completion rate (contracts that reached active or completed status)
      const completedContracts = contracts.filter(c =>
        c.status === 'active' || c.status === 'expired' || c.status === 'terminated'
      ).length;
      const completionRate = contracts.length > 0
        ? (completedContracts / contracts.length) * 100
        : 0;

      return {
        totalContracts: contracts.length,
        activeContracts: activeContracts.length,
        expiredContracts: expiredContracts.length,
        pendingContracts: pendingContracts.length,
        totalValue,
        averageContractValue: contracts.length > 0 ? totalValue / contracts.length : 0,
        contractsByType,
        contractsByStatus,
        topParties,
        upcomingRenewals,
        expiringThisMonth,
        averageDuration: Math.round(averageDuration),
        completionRate: Math.round(completionRate * 100) / 100,
        mostUsedTemplates: [],
        clauseUsageStats: [],
        monthlyTrend: [],
        slaComplianceRate: 0,
      };
    });
  },

  // Get contract value by type
  getValueByType: (contracts: Contract[]): Array<{ type: contract.type; value: number; count: number }> => {
    const byType = new Map<contract.type, { value: number; count: number }>();

    contracts.forEach(c => {
      if (c.value) {
        const existing = byType.get(c.type) || { value: 0, count: 0 };
        byType.set(c.type, {
          value: existing.value + c.value,
          count: existing.count + 1,
        });
      }
    });

    return Array.from(byType.entries())
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.value - a.value);
  },

  // Get monthly trend
  getMonthlyTrend: (contracts: Contract[], months: number = 12): Array<{
    month: string;
    created: number;
    completed: number;
    value: number;
  }> => {
    const now = new Date();
    const trend: Array<{ month: string; created: number; completed: number; value: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const created = contracts.filter(c => {
        const created = new Date(c.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      const completed = contracts.filter(c => {
        if (c.status === 'active' || c.status === 'expired') {
          const updated = new Date(c.updatedAt);
          return updated >= monthStart && updated <= monthEnd;
        }
        return false;
      }).length;

      const value = contracts
        .filter(c => {
          const created = new Date(c.createdAt);
          return created >= monthStart && created <= monthEnd;
        })
        .reduce((sum, c) => sum + (c.value || 0), 0);

      trend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        created,
        completed,
        value,
      });
    }

    return trend;
  },

  // Get contract status distribution
  getStatusDistribution: (contracts: Contract[]): Array<{
    status: contract.status;
    count: number;
    percentage: number;
    totalValue: number;
  }> => {
    const total = contracts.length;
    const distribution = new Map<contract.status, { count: number; value: number }>();

    contracts.forEach(c => {
      const existing = distribution.get(c.status) || { count: 0, value: 0 };
      distribution.set(c.status, {
        count: existing.count + 1,
        value: existing.value + (c.value || 0),
      });
    });

    return Array.from(distribution.entries())
      .map(([status, stats]) => ({
        status,
        count: stats.count,
        percentage: total > 0 ? Math.round((stats.count / total) * 10000) / 100 : 0,
        totalValue: stats.value,
      }))
      .sort((a, b) => b.count - a.count);
  },

  // Get upcoming expirations
  getUpcomingExpirations: (contracts: Contract[], days: number = 30): Contract[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return contracts
      .filter(c => {
        if (c.status !== 'active') return false;
        const endDate = new Date(c.endDate);
        return endDate > now && endDate <= futureDate;
      })
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  },

  // Get party statistics
  getPartyStatistics: (contracts: Contract[]): Array<{
    partyName: string;
    contractCount: number;
    totalValue: number;
    activeContracts: number;
    avgContractValue: number;
  }> => {
    const partyStats = new Map<string, {
      contractCount: number;
      totalValue: number;
      activeContracts: number;
    }>();

    contracts.forEach(c => {
      c.parties.forEach(p => {
        const existing = partyStats.get(p.name) || {
          contractCount: 0,
          totalValue: 0,
          activeContracts: 0,
        };
        partyStats.set(p.name, {
          contractCount: existing.contractCount + 1,
          totalValue: existing.totalValue + (c.value || 0),
          activeContracts: existing.activeContracts + (c.status === 'active' ? 1 : 0),
        });
      });
    });

    return Array.from(partyStats.entries())
      .map(([partyName, stats]) => ({
        partyName,
        ...stats,
        avgContractValue: stats.contractCount > 0 ? stats.totalValue / stats.contractCount : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  },

  // Get clause usage statistics
  getClauseUsageStats: (contracts: Contract[]): Array<{
    clauseTitle: string;
    usageCount: number;
    contractCount: number;
  }> => {
    const clauseStats = new Map<string, { usageCount: number; contractCount: Set<string> }>();

    contracts.forEach(c => {
      const contractClauses = new Set<string>();
      c.clauses.forEach(clause => {
        const existing = clauseStats.get(clause.title) || { usageCount: 0, contractCount: new Set() };
        existing.usageCount++;
        existing.contractCount.add(c.id);
        clauseStats.set(clause.title, existing);
        contractClauses.add(clause.title);
      });
    });

    return Array.from(clauseStats.entries())
      .map(([clauseTitle, stats]) => ({
        clauseTitle,
        usageCount: stats.usageCount,
        contractCount: stats.contractCount.size,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  },

  // Get contract lifecycle metrics
  getLifecycleMetrics: (contracts: Contract[]): {
    avgTimeToActive: number;
    avgTimeToSign: number;
    avgContractDuration: number;
    renewalRate: number;
    terminationRate: number;
  } => {
    const now = new Date();

    // Time to active (draft -> active)
    const timesToActive = contracts
      .filter(c => c.status === 'active')
      .map(c => {
        const created = new Date(c.createdAt);
        const signedDate = c.parties.find(p => p.signedAt)?.signedAt;
        if (signedDate) {
          return (new Date(signedDate).getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
        }
        return (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
      });

    // Time to sign
    const timesToSign = contracts
      .filter(c => c.parties.some(p => p.signedAt))
      .map(c => {
        const created = new Date(c.createdAt);
        const signedDate = c.parties.find(p => p.signedAt)?.signedAt;
        if (signedDate) {
          return (new Date(signedDate).getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
        }
        return 0;
      });

    // Contract duration
    const durations = contracts
      .filter(c => c.startDate && c.endDate)
      .map(c => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
      });

    // Renewal rate
    const renewedContracts = contracts.filter(c => (c.renewalCount || 0) > 0).length;
    const completedContracts = contracts.filter(c =>
      c.status === 'active' || c.status === 'expired' || c.status === 'terminated'
    ).length;

    // Termination rate
    const terminatedContracts = contracts.filter(c => c.status === 'terminated').length;

    return {
      avgTimeToActive: timesToActive.length > 0
        ? Math.round(timesToActive.reduce((a, b) => a + b, 0) / timesToActive.length)
        : 0,
      avgTimeToSign: timesToSign.length > 0
        ? Math.round(timesToSign.reduce((a, b) => a + b, 0) / timesToSign.length)
        : 0,
      avgContractDuration: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      renewalRate: completedContracts > 0
        ? Math.round((renewedContracts / completedContracts) * 10000) / 100
        : 0,
      terminationRate: completedContracts > 0
        ? Math.round((terminatedContracts / completedContracts) * 10000) / 100
        : 0,
    };
  },

  // Get dashboard summary
  getDashboardSummary: (contracts: Contract[]): {
    summary: {
      total: number;
      active: number;
      value: number;
      expiringThisWeek: number;
      pendingSignature: number;
    };
    recentActivity: {
      created: Contract[];
      signed: Contract[];
      expiring: Contract[];
    };
    quickStats: {
      avgValue: number;
      topType: contract.type | null;
      avgDuration: number;
    };
  } => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activeContracts = contracts.filter(c => c.status === 'active');
    const expiringThisWeek = activeContracts.filter(c => {
      const endDate = new Date(c.endDate);
      return endDate > now && endDate <= weekFromNow;
    });
    const pendingSignature = contracts.filter(c =>
      c.status === 'pending' || c.parties.some(p => !p.signed)
    );

    // Recent activity
    const recentCreated = contracts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const recentSigned = contracts
      .filter(c => c.parties.some(p => p.signedAt))
      .sort((a, b) => {
        const aSigned = a.parties.find(p => p.signedAt)?.signedAt || '';
        const bSigned = b.parties.find(p => p.signedAt)?.signedAt || '';
        return new Date(bSigned).getTime() - new Date(aSigned).getTime();
      })
      .slice(0, 5);

    // Top contract type
    const typeCounts = new Map<contract.type, number>();
    contracts.forEach(c => {
      typeCounts.set(c.type, (typeCounts.get(c.type) || 0) + 1);
    });
    const topType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      summary: {
        total: contracts.length,
        active: activeContracts.length,
        value: activeContracts.reduce((sum, c) => sum + (c.value || 0), 0),
        expiringThisWeek: expiringThisWeek.length,
        pendingSignature: pendingSignature.length,
      },
      recentActivity: {
        created: recentCreated,
        signed: recentSigned,
        expiring: expiringThisWeek.slice(0, 5),
      },
      quickStats: {
        avgValue: contracts.length > 0
          ? contracts.reduce((sum, c) => sum + (c.value || 0), 0) / contracts.length
          : 0,
        topType,
        avgDuration: contracts.filter(c => c.startDate && c.endDate).length > 0
          ? contracts
              .filter(c => c.startDate && c.endDate)
              .reduce((sum, c) => {
                const start = new Date(c.startDate);
                const end = new Date(c.endDate);
                return sum + (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
              }, 0) / contracts.filter(c => c.startDate && c.endDate).length
          : 0,
      },
    };
  },

  // Clear analytics cache
  clearCache: (): void => {
    analyticsCache.clear();
    console.log('[ANALYTICS] Cache cleared');
  },

  // Export analytics data
  exportAnalytics: (contracts: Contract[]): {
    exportedAt: string;
    contractCount: number;
    analytics: ContractAnalytics;
    valueByType: Array<{ type: contract.type; value: number; count: number }>;
    statusDistribution: Array<{ status: contract.status; count: number; percentage: number }>;
    monthlyTrend: Array<{ month: string; created: number; completed: number; value: number }>;
  } => {
    return {
      exportedAt: new Date().toISOString(),
      contractCount: contracts.length,
      analytics: analyticsService.getContractAnalytics(contracts),
      valueByType: analyticsService.getValueByType(contracts),
      statusDistribution: analyticsService.getStatusDistribution(contracts),
      monthlyTrend: analyticsService.getMonthlyTrend(contracts),
    };
  },
};

export default analyticsService;
