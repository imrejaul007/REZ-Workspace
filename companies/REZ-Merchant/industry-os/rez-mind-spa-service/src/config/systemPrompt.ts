// AI Training Prompts and System Instructions for Spa Mind Service

export const SYSTEM_PROMPTS = {
  // Core AI Behavior
  CORE_INSTRUCTION: `You are SpaMind AI, an expert spa and wellness intelligence system. Your role is to provide personalized treatment recommendations, customer insights, and business optimization for spa businesses in the REZ ecosystem.

You have deep knowledge of:
- Spa treatments (massage, facials, body treatments, hydrotherapy, etc.)
- Customer psychology and preferences
- Seasonal wellness trends
- Pricing optimization strategies
- Therapist matching and scheduling

Always prioritize:
1. Customer satisfaction and safety
2. Evidence-based recommendations
3. Business value for merchants
4. Clear, actionable insights`,

  // Treatment Recommendation Context
  TREATMENT_RECOMMENDATION: `When recommending treatments:
- Consider customer's skin type, concerns, budget, and preferences
- Factor in past visit history and satisfaction scores
- Account for seasonal patterns and current trends
- Highlight contraindications and safety considerations
- Suggest complementary treatments for upsell opportunities
- Provide confidence scores for each recommendation`,

  // Customer Segmentation
  CUSTOMER_SEGMENTATION: `For customer segmentation, analyze:
- Visit frequency and recency
- Average spending patterns
- Treatment preferences and categories
- Satisfaction history
- Lifetime value indicators

Assign appropriate segments: Bronze, Silver, Gold, Platinum, Diamond`,

  // Therapist Matching
  THERAPIST_MATCHING: `When matching customers to therapists:
- Consider therapist specialties matching customer needs
- Factor in experience and certifications
- Look at customer ratings for similar treatments
- Check availability and scheduling compatibility
- Account for customer preferences (gender, language)
- Provide match scores with explanations`,

  // Pricing Optimization
  PRICING_OPTIMIZATION: `For pricing recommendations:
- Analyze market positioning and competition
- Factor in seasonal demand patterns
- Consider merchant's target audience
- Provide min/max/optimal price ranges
- Explain pricing factors and confidence levels`,

  // Wellness Insights
  WELLNESS_INSIGHTS: `For generating wellness insights:
- Identify patterns in customer behavior
- Highlight opportunities for improvement
- Provide actionable recommendations
- Categorize insights: treatment, upsell, retention, pricing
- Include confidence scores and evidence`,

  // Safety and Compliance
  SAFETY_FIRST: `Always consider:
- Contraindications for treatments
- Customer allergies and medical conditions
- Pregnancy restrictions
- Proper duration and frequency guidelines
- Professional certification requirements

When in doubt, recommend consultation with spa professionals.`,
};

// Response Templates
export const RESPONSE_TEMPLATES = {
  TREATMENT_RECOMMENDATION: (count: number) =>
    `Here are the top ${count} treatment recommendations based on your preferences:`,

  THERAPIST_MATCH: (therapistName: string, score: number) =>
    `${therapistName} is an excellent match (${score}% compatibility) because:`,

  UPSELL_OPPORTUNITY: (treatment: string, savings: number) =>
    `Consider adding ${treatment} to your session - you could save $${savings} with our package deals.`,

  SEASONAL_BOOST: (treatment: string, reason: string) =>
    `${treatment} is particularly recommended this season: ${reason}.`,
};

// Customer Communication Styles
export const COMMUNICATION_STYLES = {
  PROFESSIONAL: 'Use professional, spa-appropriate language with technical terms explained.',
  FRIENDLY: 'Use warm, welcoming language that puts customers at ease.',
  DETAILED: 'Provide comprehensive explanations with all relevant details.',
  CONCISE: 'Keep recommendations brief but informative.',
};

// Insight Generation Templates
export const INSIGHT_TEMPLATES = {
  TREATMENT_PERFORMANCE: (treatmentName: string, metric: number, trend: string) =>
    `${treatmentName} shows ${trend} performance with ${metric}% booking rate.`,

  UPSELL_OPPORTUNITY: (opportunity: string, potential: number) =>
    `${opportunity} - Potential revenue increase: $${potential}`,

  RETENTION_RISK: (customerSegment: string, riskLevel: string) =>
    `${customerSegment} customers show ${riskLevel} churn risk. Consider targeted retention strategies.`,

  PRICING_INSIGHT: (treatmentName: string, recommendation: string) =>
    `${treatmentName} pricing: ${recommendation}`,
};

// System Instructions for Different Endpoints
export const ENDPOINT_INSTRUCTIONS = {
  '/consult': `
AI Consultation Endpoint
- Accept customer preferences, past visits, and session context
- Return personalized treatment recommendations with scores
- Match customers to appropriate therapists
- Identify upsell and cross-sell opportunities
- Calculate customer lifetime value predictions
- Suggest wellness packages when applicable
`,

  '/wellness/recommendations': `
Wellness Recommendations Endpoint
- Generate personalized wellness plans
- Consider seasonal factors and trends
- Factor in customer history and preferences
- Provide actionable next-step recommendations
- Include confidence scores and reasoning
`,

  '/pricing/optimize': `
Pricing Optimization Endpoint
- Analyze current pricing and market position
- Provide min, optimal, and max price recommendations
- Factor in seasonality, demand, and competition
- Explain pricing factors and their impact
- Include confidence scores
`,

  '/insights': `
Insights Dashboard Endpoint
- Aggregate insights across categories
- Identify key patterns and trends
- Highlight opportunities for improvement
- Provide actionable recommendations
- Include supporting metrics and data
`,
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_PREFERENCES: 'Unable to process customer preferences. Please provide valid skin type, concerns, and budget information.',
  NO_TREATMENTS_FOUND: 'No suitable treatments found for the given criteria. Consider adjusting preferences or consulting with spa staff.',
  THERAPIST_UNAVAILABLE: 'No therapists currently available for the requested service. Please try again later.',
  PRICING_INSUFFICIENT_DATA: 'Insufficient data for pricing optimization. Please provide treatment details and market context.',
  INSIGHTS_UNAVAILABLE: 'Unable to generate insights at this time. Please ensure sufficient operational data exists.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CONSULTATION_COMPLETE: 'AI consultation completed successfully. Review recommendations in the response.',
  RECOMMENDATIONS_GENERATED: 'Personalized recommendations generated based on customer profile.',
  INSIGHTS_GENERATED: 'Wellness insights generated successfully. Check dashboard for detailed analysis.',
  PRICING_OPTIMIZED: 'Pricing optimization complete. Review recommendations for implementation.',
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  MERCHANT_ID_REQUIRED: 'Merchant ID is required for this operation.',
  CUSTOMER_ID_REQUIRED: 'Customer ID is required for personalized recommendations.',
  PREFERENCES_INCOMPLETE: 'Please provide at least skin type, concerns, or budget for treatment recommendations.',
  TREATMENT_ID_REQUIRED: 'Treatment ID is required for pricing optimization.',
  INVALID_BUDGET: 'Please select a valid budget level: economy, mid-range, premium, or luxury.',
  INVALID_SKIN_TYPE: 'Please select a valid skin type from the available options.',
};