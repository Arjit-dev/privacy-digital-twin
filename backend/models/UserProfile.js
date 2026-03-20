const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: String,

  publicProfile: Boolean,
  locationSharing: Boolean,
  thirdPartyApps: Number,

  passwordStrength: String,
  twoFactorAuth: Boolean,

  publicWifiUsage: Boolean,
  deviceEncrypted: Boolean,
  autoUpdates: Boolean

}, { timestamps: true });

module.exports = mongoose.model("UserProfile", userProfileSchema);