const mongoose = require('mongoose');

const farmTwinSchema = new mongoose.Schema({
  farmId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: {
    name: String,
    phone: String,
    email: String
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  totalArea: {
    value: Number,
    unit: { type: String, enum: ['hectares', 'acres'], default: 'hectares' }
  },
  landParcels: [{
    name: String,
    area: Number,
    soilType: String,
    irrigationType: String
  }],
  crops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CropTwin' }],
  equipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentTwin' }],
  certifications: [String],
  status: { type: String, enum: ['active', 'inactive', 'fallow'], default: 'active' },
  seasonalPlanning: {
    currentSeason: String,
    plantingSchedule: [{
      crop: String,
      startDate: Date,
      expectedHarvest: Date
    }]
  },
  inventoryStatus: {
    seeds: Number,
    fertilizers: Number,
    pesticides: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const cropTwinSchema = new mongoose.Schema({
  cropId: { type: String, required: true, unique: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmTwin', required: true },
  variety: { type: String, required: true },
  growthStage: {
    type: String,
    enum: ['planted', 'germinating', 'vegetative', 'flowering', 'fruiting', 'harvest_ready', 'harvested'],
    default: 'planted'
  },
  plantedDate: Date,
  expectedHarvest: Date,
  healthScore: { type: Number, min: 0, max: 100 },
  ndviIndex: Number,
  yieldProjection: {
    value: Number,
    unit: String
  },
  marketReadiness: { type: String, enum: ['not_ready', 'approaching', 'ready', 'sold'] },
  currentPrice: {
    value: Number,
    currency: { type: String, default: 'USD' }
  },
  area: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const equipmentTwinSchema = new mongoose.Schema({
  equipmentId: { type: String, required: true, unique: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmTwin', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['tractor', 'harvester', 'irrigation', 'sprayer', 'seeder', 'other'] },
  specifications: {
    brand: String,
    model: String,
    year: Number,
    capacity: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  usageHours: { type: Number, default: 0 },
  fuelLevel: { type: Number, min: 0, max: 100 },
  maintenanceStatus: {
    type: String,
    enum: ['operational', 'needs_maintenance', 'under_repair', 'out_of_service'],
    default: 'operational'
  },
  nextServiceDate: Date,
  telemetry: {
    engineTemp: Number,
    oilPressure: Number,
    fuelConsumption: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FarmTwin = mongoose.model('FarmTwin', farmTwinSchema);
const CropTwin = mongoose.model('CropTwin', cropTwinSchema);
const EquipmentTwin = mongoose.model('EquipmentTwin', equipmentTwinSchema);

module.exports = { FarmTwin, CropTwin, EquipmentTwin };
