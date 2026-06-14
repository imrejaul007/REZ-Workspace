/**
 * REZ AI Waiter - Configuration
 */

export const config = {
  port: parseInt(process.env.PORT || '3024'),
  host: process.env.HOST || '0.0.0.0',
  capabilities: {
    orderTaking: true,
    menuRecommendations: true,
    dietaryAdvice: true,
    upselling: true,
  },
  categories: ['starters', 'main_course', 'desserts', 'beverages', 'combos'],
  dietaryTags: ['vegetarian', 'vegan', 'gluten_free', 'halal', 'jain'],
};