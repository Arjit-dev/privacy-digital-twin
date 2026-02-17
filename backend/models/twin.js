const mongoose = require("mongoose");

const twinSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,

  // Profile exposure
  publicProfile: Boolean,
  locationSharing: Boolean,

  // App & data sharing
  thirdPartyApps: Number,

  // Account security
  passwordStrength: String,
  twoFactorAuth: Boolean,

  // Device & network safety
  publicWifiUsage: Boolean,
  deviceEncrypted: Boolean,
  autoUpdates: Boolean,

  // Risk results
  riskScore: Number,
  riskLevel: String
});

module.exports = mongoose.model("Twin", twinSchema);
