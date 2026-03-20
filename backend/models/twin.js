const mongoose = require("mongoose");

const twinSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,

  websiteURL: String,

  websiteScan: {
    websiteRiskScore: Number,
    websiteRiskLevel: String,
    issues: [String]
  },

  publicProfile: Boolean,
  locationSharing: Boolean,

  thirdPartyApps: Number,

  passwordStrength: String,
  twoFactorAuth: Boolean,

  // 🔥 FIX: Boolean (was mismatch before)
  publicWifiUsage: Boolean,
  deviceEncrypted: Boolean,
  autoUpdates: Boolean,

  riskScore: Number,
  riskLevel: String
}, { timestamps: true });

module.exports = mongoose.model("Twin", twinSchema);