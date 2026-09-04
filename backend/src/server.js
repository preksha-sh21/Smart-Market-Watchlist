const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Smart Market Watchlist API is running",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smart-market-watchlist-backend",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});