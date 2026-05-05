require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const twinRoutes = require("./routes/twinRoutes");
const profileRoutes = require("./routes/profileRoutes");
const Twin = require("./models/twin");
const calculateRisk = require("./utils/riskEngine");
const scanWebsite = require("./utils/websiteScanner");

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());

// 🔗 Routes
app.use("/api/auth", authRoutes);
app.use("/api/twins", twinRoutes);
app.use("/api/profile", profileRoutes);
app.delete("/api/twins/user/:userId", async (req, res) => {
  try {
    await Twin.deleteMany({ userId: req.params.userId });
    res.json({ message: "History cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});
// 🧩 USER RISK
app.post("/api/user-risk", (req, res) => {
  try {
    const result = calculateRisk(req.body);
    res.json(result);
  } catch (err) {
    console.error("User risk error:", err);
    res.status(500).json({ error: "User risk failed" });
  }
});

// 🌐 WEBSITE RISK
app.post("/api/website-risk", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await scanWebsite(url);
    res.json(result);

  } catch (err) {
    console.error("Website scan error:", err);
    res.status(500).json({ error: "Website scan failed" });
  }
});

// =========================
// 🔗 Mongo
mongoose.connect(process.env.MONGO_URI, {
  dbName: "privacy_twin"
})
.then(() => console.log("✅ Mongo connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});