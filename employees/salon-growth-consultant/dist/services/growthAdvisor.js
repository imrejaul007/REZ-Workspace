"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.growthAdvisorService = exports.GrowthAdvisorService = void 0;
/**
 * Growth Advisor Service
 * Provides comprehensive salon growth recommendations
 */
class GrowthAdvisorService {
    /**
     * Generate comprehensive growth recommendations
     */
    async advise(request) {
        const { salonProfile, financialMetrics, clientMetrics, staffMetrics } = request;
        // Calculate current state
        const currentState = this.calculateCurrentState(salonProfile, financialMetrics, clientMetrics, staffMetrics);
        // Calculate target state
        const targetState = this.calculateTargetState(currentState);
        // Generate growth pillars
        const growthPillars = this.generateGrowthPillars(salonProfile, currentState, targetState);
        // Generate quick wins
        const quickWins = this.generateQuickWins(financialMetrics, clientMetrics);
        // Generate investments
        const investments = this.generateInvestments(salonProfile);
        // Generate timeline
        const timeline = this.generateTimeline();
        return {
            currentState,
            targetState,
            growthPillars,
            quickWins,
            investments,
            timeline,
        };
    }
    /**
     * Calculate current state
     */
    calculateCurrentState(salonProfile, financialMetrics, clientMetrics, staffMetrics) {
        const revenue = financialMetrics.monthlyRevenue;
        const clients = clientMetrics.totalClients;
        const avgServiceValue = financialMetrics.avgServiceValue;
        // Calculate growth rate (simplified)
        const growthRate = revenue > 0 ? ((revenue - (revenue * 0.9)) / revenue) * 100 : 0;
        // Staff utilization
        const staffUtilization = staffMetrics?.utilization || 65;
        return {
            revenue,
            clients,
            avgServiceValue,
            growthRate: Math.round(growthRate * 10) / 10,
            staffUtilization,
        };
    }
    /**
     * Calculate target state
     */
    calculateTargetState(currentState) {
        return {
            revenue: Math.round(currentState.revenue * 1.25),
            clients: Math.round(currentState.clients * 1.15),
            avgServiceValue: Math.round(currentState.avgServiceValue * 1.1),
            growthRate: 25,
            staffUtilization: 85,
        };
    }
    /**
     * Generate growth pillars
     */
    generateGrowthPillars(salonProfile, currentState, targetState) {
        const pillars = [];
        // Staff Utilization Pillar
        pillars.push({
            pillar: 'Staff Utilization',
            weight: 0.25,
            currentScore: currentState.staffUtilization,
            targetScore: targetState.staffUtilization,
            initiatives: [
                {
                    initiative: 'Optimize appointment scheduling to match demand patterns',
                    impact: 10,
                    timeline: '2 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Implement rebooking reminders for repeat clients',
                    impact: 8,
                    timeline: '1 week',
                    effort: 'low',
                },
                {
                    initiative: 'Cross-train staff for multiple services',
                    impact: 7,
                    timeline: '4 weeks',
                    effort: 'high',
                },
            ],
        });
        // Repeat Bookings Pillar
        pillars.push({
            pillar: 'Repeat Bookings',
            weight: 0.25,
            currentScore: 50,
            targetScore: 70,
            initiatives: [
                {
                    initiative: 'Launch loyalty program with points and rewards',
                    impact: 15,
                    timeline: '3 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Implement automated rebooking reminders',
                    impact: 10,
                    timeline: '2 weeks',
                    effort: 'low',
                },
                {
                    initiative: 'Create service packages for regular clients',
                    impact: 12,
                    timeline: '3 weeks',
                    effort: 'medium',
                },
            ],
        });
        // Average Transaction Value Pillar
        pillars.push({
            pillar: 'Average Transaction Value',
            weight: 0.2,
            currentScore: 55,
            targetScore: 75,
            initiatives: [
                {
                    initiative: 'Train staff on upselling complementary services',
                    impact: 12,
                    timeline: '2 weeks',
                    effort: 'low',
                },
                {
                    initiative: 'Create bundled service packages',
                    impact: 15,
                    timeline: '3 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Implement premium service tiers',
                    impact: 10,
                    timeline: '4 weeks',
                    effort: 'high',
                },
            ],
        });
        // Client Acquisition Pillar
        pillars.push({
            pillar: 'Client Acquisition',
            weight: 0.15,
            currentScore: 45,
            targetScore: 65,
            initiatives: [
                {
                    initiative: 'Launch referral program with incentives',
                    impact: 18,
                    timeline: '2 weeks',
                    effort: 'low',
                },
                {
                    initiative: 'Optimize Google and social media presence',
                    impact: 10,
                    timeline: '4 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Partner with local businesses for cross-promotion',
                    impact: 8,
                    timeline: '3 weeks',
                    effort: 'medium',
                },
            ],
        });
        // Membership Revenue Pillar
        pillars.push({
            pillar: 'Membership & Subscriptions',
            weight: 0.15,
            currentScore: 30,
            targetScore: 60,
            initiatives: [
                {
                    initiative: 'Design tiered membership program',
                    impact: 20,
                    timeline: '4 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Create exclusive member-only services',
                    impact: 12,
                    timeline: '3 weeks',
                    effort: 'medium',
                },
                {
                    initiative: 'Implement monthly subscription model',
                    impact: 15,
                    timeline: '6 weeks',
                    effort: 'high',
                },
            ],
        });
        return pillars;
    }
    /**
     * Generate quick wins
     */
    generateQuickWins(financialMetrics, clientMetrics) {
        const quickWins = [];
        // Upselling quick win
        if (clientMetrics.totalClients > 50) {
            quickWins.push({
                action: 'Train all staff on 30-second upsell technique',
                impact: 8,
                effort: 'low',
                timeline: '1 week',
            });
        }
        // Booking reminder quick win
        quickWins.push({
            action: 'Set up automated SMS reminders 24 hours before appointments',
            impact: 5,
            effort: 'low',
            timeline: '1 day',
        });
        // Review quick win
        if (clientMetrics.VIPClients > 0) {
            quickWins.push({
                action: 'Ask top 20 clients to leave Google reviews',
                impact: 6,
                effort: 'low',
                timeline: '1 week',
            });
        }
        // Rebooking quick win
        quickWins.push({
            action: 'Implement rebooking at checkout with 10% discount',
            impact: 10,
            effort: 'medium',
            timeline: '2 weeks',
        });
        // Social proof quick win
        quickWins.push({
            action: 'Share client transformation photos on Instagram with before/after',
            impact: 5,
            effort: 'low',
            timeline: 'ongoing',
        });
        return quickWins;
    }
    /**
     * Generate investments
     */
    generateInvestments(salonProfile) {
        const investments = [];
        // Salon type affects investment needs
        if (salonProfile.type === 'unisex' || salonProfile.type === 'unisex_premium') {
            // Online booking system
            investments.push({
                category: 'Online Booking System',
                amount: 15000,
                roi: 3.5,
                paybackMonths: 6,
            });
            // CRM system
            investments.push({
                category: 'CRM & Client Management',
                amount: 20000,
                roi: 4.2,
                paybackMonths: 5,
            });
        }
        // Loyalty program
        investments.push({
            category: 'Loyalty Program Platform',
            amount: 25000,
            roi: 4.0,
            paybackMonths: 6,
        });
        // Marketing
        investments.push({
            category: 'Digital Marketing (3 months)',
            amount: 30000,
            roi: 2.8,
            paybackMonths: 4,
        });
        // Staff training
        investments.push({
            category: 'Staff Upselling Training',
            amount: 10000,
            roi: 5.5,
            paybackMonths: 3,
        });
        return investments;
    }
    /**
     * Generate implementation timeline
     */
    generateTimeline() {
        return [
            {
                month: 'Month 1',
                focus: 'Foundation',
                keyActions: [
                    'Launch loyalty program',
                    'Set up online booking',
                    'Train staff on upselling',
                    'Implement SMS reminders',
                ],
                expectedOutcome: '15% improvement in repeat bookings',
            },
            {
                month: 'Month 2-3',
                focus: 'Growth',
                keyActions: [
                    'Launch referral program',
                    'Create service packages',
                    'Start digital marketing',
                    'Optimize pricing',
                ],
                expectedOutcome: '20% increase in average transaction value',
            },
            {
                month: 'Month 4-6',
                focus: 'Scale',
                keyActions: [
                    'Expand membership tiers',
                    'Launch seasonal promotions',
                    'Partner with local businesses',
                    'Add premium services',
                ],
                expectedOutcome: '25% revenue growth',
            },
        ];
    }
}
exports.GrowthAdvisorService = GrowthAdvisorService;
exports.growthAdvisorService = new GrowthAdvisorService();
//# sourceMappingURL=growthAdvisor.js.map