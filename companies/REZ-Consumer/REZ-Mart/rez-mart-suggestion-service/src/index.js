/**
 * REZ Mart Suggestion Service
 * Smart Cart Suggestions - FreshMart 11AM Story
 *
 * "Customer adds cereal → suggests milk, honey, fresh fruit"
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const suggestionRoutes = require('./routes/suggestion.routes');
const ProductRelationship = require('./models/relationship.model');
const CartAnalysis = require('./models/cartAnalysis.model');

const app = express();
const PORT = process.env.PORT || 4118;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-mart-suggestion-service',
    version: '1.0.0',
    freshMartStory: '11AM - Smart Cart Suggestions'
  });
});

// Routes
app.use('/api/suggestions', suggestionRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rez-mart-suggestion';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('🚀 Smart Cart Suggestion Service ready');
    console.log('📍 Port:', PORT);
    console.log('🛒 FreshMart 11AM Story: Smart Cart Suggestions');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Seed initial product relationships
async function seedRelationships() {
  const count = await ProductRelationship.countDocuments();
  if (count > 0) return;

  console.log('🌱 Seeding initial product relationships...');

  const relationships = [
    // Breakfast combos
    { productSku: 'cereal-001', relatedSku: 'milk-001', confidence: 0.85, type: 'frequently_bought_together', category: 'grocery' },
    { productSku: 'cereal-001', relatedSku: 'honey-001', confidence: 0.65, type: 'complementary', category: 'grocery' },
    { productSku: 'cereal-001', relatedSku: 'banana-001', confidence: 0.55, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'bread-001', relatedSku: 'butter-001', confidence: 0.90, type: 'frequently_bought_together', category: 'grocery' },
    { productSku: 'bread-001', relatedSku: 'jam-001', confidence: 0.75, type: 'complementary', category: 'grocery' },
    { productSku: 'bread-001', relatedSku: 'eggs-001', confidence: 0.60, type: 'frequently_bought_together', category: 'grocery' },

    // Dairy combos
    { productSku: 'milk-001', relatedSku: 'eggs-001', confidence: 0.70, type: 'frequently_bought_together', category: 'dairy' },
    { productSku: 'milk-001', relatedSku: 'bread-001', confidence: 0.65, type: 'frequently_bought_together', category: 'dairy' },
    { productSku: 'curd-001', relatedSku: 'milk-001', confidence: 0.55, type: 'complementary', category: 'dairy' },
    { productSku: 'cheese-001', relatedSku: 'bread-001', confidence: 0.80, type: 'frequently_bought_together', category: 'dairy' },

    // Produce combos
    { productSku: 'tomato-001', relatedSku: 'onion-001', confidence: 0.95, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'tomato-001', relatedSku: 'potato-001', confidence: 0.85, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'tomato-001', relatedSku: 'chili-001', confidence: 0.75, type: 'complementary', category: 'produce' },
    { productSku: 'lettuce-001', relatedSku: 'tomato-001', confidence: 0.80, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'lettuce-001', relatedSku: 'cucumber-001', confidence: 0.75, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'banana-001', relatedSku: 'apple-001', confidence: 0.60, type: 'frequently_bought_together', category: 'produce' },
    { productSku: 'apple-001', relatedSku: 'orange-001', confidence: 0.55, type: 'frequently_bought_together', category: 'produce' },

    // Beverages
    { productSku: 'coffee-001', relatedSku: 'milk-001', confidence: 0.90, type: 'frequently_bought_together', category: 'beverages' },
    { productSku: 'coffee-001', relatedSku: 'sugar-001', confidence: 0.85, type: 'frequently_bought_together', category: 'beverages' },
    { productSku: 'tea-001', relatedSku: 'milk-001', confidence: 0.95, type: 'frequently_bought_together', category: 'beverages' },
    { productSku: 'tea-001', relatedSku: 'sugar-001', confidence: 0.90, type: 'frequently_bought_together', category: 'beverages' },

    // Snacks
    { productSku: 'chips-001', relatedSku: 'soda-001', confidence: 0.85, type: 'frequently_bought_together', category: 'snacks' },
    { productSku: 'biscuits-001', relatedSku: 'tea-001', confidence: 0.80, type: 'frequently_bought_together', category: 'snacks' },
    { productSku: 'namkeen-001', relatedSku: 'tea-001', confidence: 0.75, type: 'frequently_bought_together', category: 'snacks' },

    // Household
    { productSku: 'detergent-001', relatedSku: 'softener-001', confidence: 0.70, type: 'complementary', category: 'household' },
    { productSku: 'tissue-001', relatedSku: 'handwash-001', confidence: 0.65, type: 'complementary', category: 'household' },

    // Personal care
    { productSku: 'shampoo-001', relatedSku: 'conditioner-001', confidence: 0.90, type: 'frequently_bought_together', category: 'personal_care' },
    { productSku: 'toothpaste-001', relatedSku: 'toothbrush-001', confidence: 0.85, type: 'frequently_bought_together', category: 'personal_care' },
  ];

  for (const rel of relationships) {
    await ProductRelationship.create(rel);
  }

  console.log(`✅ Seeded ${relationships.length} product relationships`);
}

// Start server
app.listen(PORT, async () => {
  await seedRelationships();

  console.log('═══════════════════════════════════════════════════');
  console.log('🛒 REZ Mart Suggestion Service');
  console.log('📖 FreshMart 11AM Story: Smart Cart');
  console.log('═══════════════════════════════════════════════════');
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/suggestions/product/:sku');
  console.log('  POST /api/suggestions/cart');
  console.log('  POST /api/suggestions/cart/personalized');
  console.log('  POST /api/suggestions/purchase');
  console.log('  POST /api/suggestions/accept');
  console.log('  GET  /api/suggestions/analytics/:storeId');
  console.log('  GET  /api/suggestions/popular');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
