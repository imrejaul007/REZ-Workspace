const mongoose = require('mongoose');
const playerTwinSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: String,
  gamingHistory: {
    gamesPlayed: Number,
    hoursPlayed: Number,
    favoriteGenres: [String]
  },
  preferences: {
    platform: String,
    preferredGames: [String]
  },
  skillLevel: { type: String, enum: ['casual', 'intermediate', 'competitive', 'pro'] },
  deviceInfo: { type: String },
  socialConnections: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const PlayerTwin = mongoose.model('PlayerTwin', playerTwinSchema);
module.exports = { PlayerTwin };
