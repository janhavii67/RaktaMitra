require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const districtRoutes = require("./src/routes/districtRoutes");
const { syncBloodBanks } = require("./src/services/bloodBankSync");

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.send("RaktaMitra Backend Running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/districts", districtRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Run initial sync after server starts
    try {
        await syncBloodBanks();
    } catch (err) {
        console.error("Initial sync error:", err.message);
    }

    // Schedule sync every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        console.log("[Cron] ⏰ Running scheduled blood bank sync...");
        try {
            await syncBloodBanks();
        } catch (err) {
            console.error("[Cron] Sync error:", err.message);
        }
    });

    console.log("[Cron] ✅ Scheduled: blood bank sync every 15 minutes");
});