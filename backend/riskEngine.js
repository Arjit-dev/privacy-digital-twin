function calculateRisk(data) {

  let riskScore = 0;
  let suggestions = [];

  // Profile exposure
  if (data.publicProfile) {
    riskScore += 15;
    suggestions.push("Consider making your profile private.");
  }

  if (data.locationSharing) {
    riskScore += 10;
    suggestions.push("Disable unnecessary location sharing.");
  }

  // Third party apps
  if (data.thirdPartyApps > 5) {
    riskScore += 15;
    suggestions.push("Reduce the number of connected third-party apps.");
  } else if (data.thirdPartyApps > 2) {
    riskScore += 8;
  }

  // Password strength
  if (data.passwordStrength === "weak") {
    riskScore += 25;
    suggestions.push("Use a stronger password with numbers and symbols.");
  }

  if (data.passwordStrength === "medium") {
    riskScore += 10;
  }

  // Two-factor authentication
  if (!data.twoFactorAuth) {
    riskScore += 15;
    suggestions.push("Enable two-factor authentication for better security.");
  }

  // Public WiFi
  if (data.publicWifiUsage) {
    riskScore += 10;
    suggestions.push("Avoid using public WiFi without a VPN.");
  }

  // Device encryption
  if (!data.deviceEncrypted) {
    riskScore += 15;
    suggestions.push("Enable device encryption.");
  }

  // Auto updates
  if (!data.autoUpdates) {
    riskScore += 10;
    suggestions.push("Enable automatic security updates.");
  }

  // WEBSITE RISK INTEGRATION
  if (data.websiteScan) {

    const siteRisk = data.websiteScan.websiteRiskScore;

    if (siteRisk > 20) {
      riskScore += 20;
      suggestions.push("The scanned website has major security issues.");
    }
    else if (siteRisk > 10) {
      riskScore += 10;
      suggestions.push("The scanned website has moderate security issues.");
    }
    else if (siteRisk > 0) {
      riskScore += 5;
    }
  }

  // Determine risk level
  let riskLevel = "Low";

  if (riskScore > 70) {
    riskLevel = "High";
  } else if (riskScore > 40) {
    riskLevel = "Medium";
  }

  return {
    riskScore,
    riskLevel,
    suggestions
  };
}

module.exports = calculateRisk;