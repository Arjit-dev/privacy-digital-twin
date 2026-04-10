require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const twinRoutes = require("./routes/twinRoutes");
const profileRoutes = require("./routes/profileRoutes");
const Twin = require("./models/twin");

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