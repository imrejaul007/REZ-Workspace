/**
 * REZ Graph Service - Configuration
 */

export const config = {
  port: parseInt(process.env.PORT || '4068'),
  host: process.env.HOST || '0.0.0.0',

  // Graph settings
  graph: {
    // In production, would use Neo4j or similar
    // Using in-memory for now
    maxNodes: 1000000,
    maxDepth: 10,
  },

  // Entity types
  entityTypes: [
    'user',
    'merchant',
    'product',
    'order',
    'payment',
    'ride',
    'driver',
    'location',
    'community',
    'campaign',
    'ad',
  ],

  // Relationship types
  relationshipTypes: [
    'owns',
    'purchased',
    'reviewed',
    'rides',
    'belongs_to',
    'located_at',
    'member_of',
    'targeted_by',
    'impressed',
    'clicked',
  ],
};
