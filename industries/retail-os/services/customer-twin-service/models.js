const mongoose = require('mongoose');

const customerTwinSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  demographics: {
    age: Number,
    gender: String,
    location: String
  },
  preferences: {
    categories: [String],
    brands: [String],
    priceRange: { min: Number, max: Number }
  },
  purchaseHistory: [{
    orderId: String,
    date: Date,
    items: [{ productId: String, quantity: Number, price: Number }],
    total: Number
  }],
  loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  loyaltyPoints: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  churnRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productTwinSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: String,
  category: String,
  brand: String,
  price: Number,
  cost: Number,
  stockLevel: { type: Number, default: 0 },
  reorderPoint: Number,
  attributes: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const inventoryTwinSchema = new mongoose.Schema({
  inventoryId: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductTwin', required: true },
  location: { type: String, required: true },
  quantity: Number,
  reserved: Number,
  available: Number,
  lastCounted: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CustomerTwin = mongoose.model('CustomerTwin', customerTwinSchema);
const ProductTwin = mongoose.model('ProductTwin', productTwinSchema);
const InventoryTwin = mongoose.model('InventoryTwin', inventoryTwinSchema);

module.exports = { CustomerTwin, ProductTwin, InventoryTwin };
