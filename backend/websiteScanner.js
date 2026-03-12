const axios = require("axios");

async function scanWebsite(url) {
  try {
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const res = await axios.get(url, { timeout: 5000 });

    const headers = res.headers;

    let risk = 0;
    let issues = [];

    if (!url.startsWith("https")) {
      risk += 30;
      issues.push("Website not using HTTPS");
    }

    if (!headers["content-security-policy"]) {
      risk += 15;
      issues.push("Missing Content Security Policy");
    }

    if (!headers["x-frame-options"]) {
      risk += 10;
      issues.push("Missing X-Frame-Options header");
    }

    if (!headers["x-content-type-options"]) {
      risk += 10;
      issues.push("Missing X-Content-Type-Options header");
    }

    if (!headers["strict-transport-security"]) {
      risk += 10;
      issues.push("Missing HSTS header");
    }

    if (!headers["referrer-policy"]) {
      risk += 5;
      issues.push("Missing Referrer Policy");
    }

    let level = "Low";

    if (risk > 50) level = "High";
    else if (risk > 25) level = "Medium";

    return {
      websiteRiskScore: risk,
      websiteRiskLevel: level,
      issues
    };

  } catch (err) {
    return {
      websiteRiskScore: 60,
      websiteRiskLevel: "High",
      issues: ["Website unreachable or potentially unsafe"]
    };
  }
}

module.exports = scanWebsite;