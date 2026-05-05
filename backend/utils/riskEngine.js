function calculateRisk(data) {

  let riskScore = 0;
  let suggestions = [];

  // 🔹 Profile exposure
  if (data.publicProfile) {
    riskScore += 15;
    suggestions.push("Consider making your profile private.");
  }

  if (data.locationSharing) {
    riskScore += 10;
    suggestions.push("Disable unnecessary location sharing.");
  }

  // 🔹 Third party apps
  if (data.thirdPartyApps > 0) {

  // Base risk
  riskScore += Math.min(25, data.thirdPartyApps * 3);

  // Extra penalty for high numbers
  if (data.thirdPartyApps > 10) {
    riskScore += 10;
    suggestions.push("Too many third-party apps connected.");
  }

  if (data.thirdPartyApps > 20) {
    riskScore += 10;
    suggestions.push("Extremely high number of third-party apps — high risk.");
  }
}

  // 🔹 Password strength
  if (data.passwordStrength === "weak") {
    riskScore += 25;
    suggestions.push("Use a stronger password with numbers and symbols.");
  } else if (data.passwordStrength === "medium") {
    riskScore += 10;
  }

  // 🔹 Two-factor authentication
  if (!data.twoFactorAuth) {
    riskScore += 15;
    suggestions.push("Enable two-factor authentication for better security.");
  }

  // 🔹 Public WiFi usage
  if (data.publicWifiUsage) {
    riskScore += 10;
    suggestions.push("Avoid using public WiFi without a VPN.");
  }

  // 🔹 Device encryption
  if (!data.deviceEncrypted) {
    riskScore += 15;
    suggestions.push("Enable device encryption.");
  }

  // 🔹 Auto updates
  if (!data.autoUpdates) {
    riskScore += 10;
    suggestions.push("Enable automatic security updates.");
  }

  // Normalize score (0–100)
  riskScore = Math.min(100, riskScore);
  return {
    riskScore,
    suggestions
  };
}

module.exports = calculateRisk;