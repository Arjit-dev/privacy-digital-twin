const express = require("express");
const router = express.Router();
const axios = require("axios");

const Twin = require("../models/twin");
const calculateRisk = require("../utils/riskEngine");
const checkPasswordStrength = require("../passwordStrength");
const scanWebsite = require("../utils/websiteScanner");


/* =====================================================
   🔥 1. FROM EXTENSION (Flask → Node → Mongo)
===================================================== */
router.post("/from-extension", async (req, res) => {
  try {
    console.log("📥 Data from Flask:", req.body);
    console.log("👤 Saving twin for user:", req.body.userId);  // 🔥 DEBUG

    const twin = new Twin(req.body);

    const saved = await twin.save();

    console.log("🔥 ACTUALLY SAVED:", saved);

    res.json({ message: "Saved from extension" });

  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🔥 2. CREATE TWIN (Manual / Dashboard Flow)
===================================================== */
router.post("/create", async (req, res) => {
  try {
    const data = { ...req.body };
    const userId = data.userId;

    // 🔐 Password strength check
    if (data.password) {
      data.passwordStrength = checkPasswordStrength(data.password);
      delete data.password;
    }

    // 🌐 Website scan
    let websiteScan = null;
    if (data.websiteURL) {
      try {
        websiteScan = await scanWebsite(data.websiteURL);
      } catch (err) {
        console.log("⚠️ Website scan failed");
      }
    }

    // 🧠 Rule-based risk
    const risk = calculateRisk(data);

    // 🤖 ML Prediction (Flask)
    let mlRiskLevel = "Unavailable";

    try {
      const mlResponse = await axios.post(
        "http://127.0.0.1:8000/predict",
        data
      );

      mlRiskLevel = mlResponse.data.mlRiskLevel;

    } catch (err) {
      console.log("⚠️ ML server not reachable");
    }

    // 💾 Save twin
    const twin = new Twin({
      userId,
      ...data,
      websiteScan,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel
    });

    const saved = await twin.save();

    console.log("🔥 CREATED TWIN:", saved);

    res.json({
      twin: saved,
      suggestions: risk.suggestions,
      mlRiskLevel
    });

  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🔥 3. GET TWINS BY USER
===================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const twins = await Twin.find({ userId: req.params.userId });

    console.log("📦 Twins fetched:", twins.length);

    res.json(twins);

  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🔥 4. GET SINGLE TWIN
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const twin = await Twin.findById(req.params.id);

    if (!twin) {
      return res.status(404).json({ error: "Twin not found" });
    }

    res.json(twin);

  } catch (err) {
    console.error("❌ FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;