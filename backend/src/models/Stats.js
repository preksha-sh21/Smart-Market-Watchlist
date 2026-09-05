const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    meanDailyPct: {
      type: Number,
      required: true,
    },

    stdDailyPct: {
      type: Number,
      required: true,
    },

    avgVolume: {
      type: Number,
      required: true,
    },

    week52High: {
      type: Number,
      required: true,
    },

    week52Low: {
      type: Number,
      required: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stats", statsSchema);