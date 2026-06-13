const mongoose = require("mongoose");
const customerTwinSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String, phone: String,
  address: { street: String, city: String, state: String, zip: String },
  properties: [{ address: String, type: String }],
  serviceHistory: [{ service: String, date: Date, provider: String }],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const CustomerTwin = mongoose.model("CustomerTwin", customerTwinSchema);
module.exports = { CustomerTwin };
