const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    watchlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Watchlist",
      required: true,
    },

    lastOpenedAt: {
      type: Date,
      required: true,
    },

    prices: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

visitSchema.index(
  { userId: 1, watchlistId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Visit", visitSchema);