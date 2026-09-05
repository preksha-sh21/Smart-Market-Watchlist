const mongoose = require("mongoose");
require("dotenv").config();

const Stats = require("./models/Stats");

const stats = [
  {
    symbol: "RELIANCE.NS",
    meanDailyPct: 0.5,
    stdDailyPct: 1.5,
    avgVolume: 10000000,
    week52High: 1500,
    week52Low: 1100,
  },
  {
    symbol: "TATASTEEL.NS",
    meanDailyPct: 0.3,
    stdDailyPct: 1.2,
    avgVolume: 15000000,
    week52High: 200,
    week52Low: 100,
  },
  {
    symbol: "INFY.NS",
    meanDailyPct: 0.2,
    stdDailyPct: 1.0,
    avgVolume: 8000000,
    week52High: 1600,
    week52Low: 1000,
  },
];

const seedStats = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Stats.deleteMany({
      symbol: { $in: stats.map((item) => item.symbol) },
    });

    await Stats.insertMany(stats);

    console.log("Stats seeded successfully");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Stats seed failed:", error.message);
    process.exit(1);
  }
};

seedStats();