const axios = require("axios");

async function scanWebsite(inputUrl) {
  try {
    let url = inputUrl;

    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    let domainRisk = 0;
    let urlRisk = 0;
    let headerRisk = 0;
    let issues = [];

    // =============================
    // 🔐 1. PROTOCOL
    // =============================
    if (!url.startsWith("https")) {
      domainRisk += 40;
      issues.push("Website not using HTTPS");
    }

    // =============================
    // 🌐 2. DOMAIN ANALYSIS (HIGH IMPACT)
    // =============================

    // IP address
    const ipRegex = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (ipRegex.test(hostname)) {
      domainRisk += 60;
      issues.push("Using IP address instead of domain");
    }

    // Suspicious keywords
    const suspiciousKeywords = [
      "login", "secure", "verify", "account", "update",
      "bank", "free", "bonus", "win", "prize",
      "xxx", "adult", "porn", "sex", "casino",
      "bet", "hack", "crack", "fake", "phish"
    ];

    let keywordHits = 0;
    for (let word of suspiciousKeywords) {
      if (hostname.includes(word)) keywordHits++;
    }

    if (keywordHits > 0) {
      domainRisk += Math.min(50, 20 + keywordHits * 10);
      issues.push("Suspicious domain keywords detected");
    }

    // Suspicious TLD
    const suspiciousTLDs = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq"];
    if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) {
      domainRisk += 30;
      issues.push("Suspicious domain extension");
    }

    // Too many subdomains
    if (hostname.split(".").length > 3) {
      domainRisk += 15;
      issues.push("Too many subdomains");
    }

    // =============================
    // 🔗 3. URL STRUCTURE
    // =============================

    if (url.length > 75) {
      urlRisk += 15;
      issues.push("URL too long");
    }

    if (url.includes("@")) {
      urlRisk += 40;
      issues.push("Contains '@' (phishing trick)");
    }

    if (url.includes("//") && url.lastIndexOf("//") > 7) {
      urlRisk += 15;
      issues.push("Obfuscated URL structure");
    }

    // =============================
    // 📡 4. HEADER CHECKS (LOWER IMPACT)
    // =============================

    let headers = {};
    try {
      const res = await axios.get(url, { timeout: 5000 });
      headers = res.headers;
    } catch (err) {
      return {
        websiteRiskScore: 80,
        websiteRiskLevel: "High",
        issues: ["Website unreachable or blocking requests"]
      };
    }

    if (!headers["content-security-policy"]) headerRisk += 10;
    if (!headers["x-frame-options"]) headerRisk += 5;
    if (!headers["x-content-type-options"]) headerRisk += 5;
    if (!headers["strict-transport-security"]) headerRisk += 5;

    if (headerRisk > 0) {
      issues.push("Weak or missing security headers");
    }

    // =============================
    // 🔥 FINAL SCORE (NON-LINEAR)
    // =============================

    let risk =
      domainRisk * 0.6 +
      urlRisk * 0.25 +
      headerRisk * 0.15;

    // 🔥 Non-linear scaling (KEY FIX)
    risk = Math.pow(risk, 1.15);

    // Clamp
    risk = Math.min(100, Math.round(risk));

    let level = "Low";
    if (risk >= 70) level = "High";
    else if (risk >= 40) level = "Medium";

    return {
      websiteRiskScore: risk,
      websiteRiskLevel: level,
      issues
    };

  } catch (err) {
    return {
      websiteRiskScore: 70,
      websiteRiskLevel: "High",
      issues: ["Invalid URL or scan failed"]
    };
  }
}

module.exports = scanWebsite;