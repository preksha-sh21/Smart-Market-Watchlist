const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const marketRoutes = require("./routes/market.routes");
const { startCronPoller } = require("./jobs/cronPoller");
const authRoutes = require("./routes/auth.routes");
const watchlistRoutes = require("./routes/watchlist.routes");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/", marketRoutes);
app.use("/auth", authRoutes);
app.use("/watchlists", watchlistRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Market Watchlist API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smart-market-watchlist-backend",
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    startCronPoller();
  });
};

startServer();