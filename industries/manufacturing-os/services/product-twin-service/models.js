const mongoose = require('mongoose');

const productTwinSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: String,
  category: String,
  specifications: {
    weight: Number,
    dimensions: { length: Number, width: Number, height: Number },
    materials: [String]
  },
  bom: [{
    component: String,
    quantity: Number,
    unit: String
  }],
  routing: [{
    step: Number,
    operation: String,
    workCenter: String,
    cycleTime: Number
  }],
  cost: {
    material: Number,
    labor: Number,
    overhead: Number,
    total: Number
  },
  qualityStandards: [String],
  status: { type: String, enum: ['active', 'discontinued', 'prototype'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productionTwinSchema = new mongoose.Schema({
  productionId: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductTwin', required: true },
  orderNumber: String,
  quantity: Number,
  status: { type: String, enum: ['planned', 'in_progress', 'completed', 'on_hold'], default: 'planned' },
  startDate: Date,
  endDate: Date,
  workOrders: [{
    workCenter: String,
    status: String,
    completedQuantity: Number
  }],
  oee: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ProductTwin = mongoose.model('ProductTwin', productTwinSchema);
const ProductionTwin = mongoose.model('ProductionTwin', productionTwinSchema);

module.exports = { ProductTwin, ProductionTwin };
