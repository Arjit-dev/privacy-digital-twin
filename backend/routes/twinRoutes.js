const express = require("express");
const router = express.Router();
const axios = require("axios");

const Twin = require("../models/twin");
const calculateRisk = require("../riskEngine");
const checkPasswordStrength = require("../passwordStrength");

// Create twin with rule-based + ML prediction
router.post("/create", async (req, res) => {
  try {
    const data = { ...req.body };

    // Extract userId
    const userId = data.userId;

    // Auto-detect password strength
    if (data.password) {
      data.passwordStrength = checkPasswordStrength(data.password);
      delete data.password; // never store raw password
    }

    // Rule-based risk calculation
    const risk = calculateRisk(data);

    // ML prediction
    let mlRiskLevel = "Unavailable";
    try {
      const mlResponse = await axios.post(
        "http://127.0.0.1:8000/predict",
        data
      );
      mlRiskLevel = mlResponse.data.mlRiskLevel;
    } catch (mlErr) {
      console.log("ML server not reachable");
    }

    // Create twin linked to user
    const twin = new Twin({
      userId,
      ...data,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel
    });

    await twin.save();

    res.json({
      twin,
      suggestions: risk.suggestions,
      mlRiskLevel: mlRiskLevel
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get twins for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const twins = await Twin.find({ userId: req.params.userId });
    res.json(twins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single twin
router.get("/:id", async (req, res) => {
  try {
    const twin = await Twin.findById(req.params.id);
    res.json(twin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
