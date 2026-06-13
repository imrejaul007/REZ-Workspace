const mongoose = require('mongoose');
const athleteTwinSchema = new mongoose.Schema({
  athleteId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sport: { type: String, required: true },
  team: String,
  position: String,
  stats: {
    gamesPlayed: Number,
    points: Number,
    assists: Number,
    rebounds: Number
  },
  contractDetails: {
    salary: Number,
    endDate: Date,
    guaranteed: Number
  },
  injuryStatus: String,
  performanceMetrics: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const AthleteTwin = mongoose.model('AthleteTwin', athleteTwinSchema);
module.exports = { AthleteTwin };
