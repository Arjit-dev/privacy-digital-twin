const express = require("express");
const router = express.Router();
const UserProfile = require("../models/UserProfile");

// 🔹 Save profile
router.post("/save", async (req, res) => {
  try {
    const { userId } = req.body;

    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      profile = await UserProfile.findOneAndUpdate(
        { userId },
        req.body,
        { new: true }
      );
    } else {
      profile = new UserProfile(req.body);
      await profile.save();
    }

    res.json(profile);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Get profile
router.get("/:userId", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({
      userId: req.params.userId
    });

    res.json(profile);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;