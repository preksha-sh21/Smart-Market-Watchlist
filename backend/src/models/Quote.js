const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    dayChangePct: {
      type: Number,
      required: true,
    },

    volume: {
      type: Number,
      required: true,
    },

    source: {
      type: String,
      enum: ["NSE", "BSE"],
      required: true,
    },

    ts: {
      type: Date,
      required: true,
    },

    stale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);