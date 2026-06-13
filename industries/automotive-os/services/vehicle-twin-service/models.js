const mongoose = require("mongoose");
const vehicleTwinSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  vin: { type: String, required: true },
  make: String, model: String, year: Number,
  specs: { color: String, mileage: Number, condition: String },
  status: { type: String, enum: ["available", "sold", "service"], default: "available" },
  price: Number, location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const VehicleTwin = mongoose.model("VehicleTwin", vehicleTwinSchema);
module.exports = { VehicleTwin };
