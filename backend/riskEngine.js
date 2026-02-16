function calculateRisk(twin) {
  let score = 0;
  let suggestions = [];

  // Weak password
  if (twin.passwordStrength === "weak") {
    score += 25;
    suggestions.push("Use a stronger password");
  }

  // No 2FA
  if (!twin.twoFactorAuth) {
    score += 15;
    suggestions.push("Enable two-factor authentication");
  }

  // Public profile
  if (twin.publicProfile) {
    score += 20;
    suggestions.push("Disable public profile visibility");
  }

  // Location sharing
  if (twin.locationSharing) {
    score += 15;
    suggestions.push("Turn off location sharing");
  }

  // Too many third-party apps
  if (twin.thirdPartyApps > 3) {
    score += 20;
    suggestions.push("Reduce third-party app access");
  }

  // Public Wi-Fi usage
  if (twin.publicWifiUsage) {
    score += 10;
    suggestions.push("Avoid using public Wi-Fi for sensitive tasks");
  }

  // Device not encrypted
  if (!twin.deviceEncrypted) {
    score += 15;
    suggestions.push("Enable device encryption");
  }

  // No auto updates
  if (!twin.autoUpdates) {
    score += 10;
    suggestions.push("Turn on automatic software updates");
  }

  // Determine risk level
  let level = "Low";
  if (score > 30 && score <= 70) level = "Medium";
  if (score > 70) level = "High";

  return {
    riskScore: score,
    riskLevel: level,
    suggestions
  };
}

module.exports = calculateRisk;
