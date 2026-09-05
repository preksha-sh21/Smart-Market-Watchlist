const express = require("express");

const Watchlist = require("../models/Watchlist");
const authMiddleware = require("../middleware/auth");
const { getSinceSeenData } = require("../services/lastSeenService");

const router = express.Router();
// Get all watchlists for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const watchlists = await Watchlist.find({
      userId: req.user.userId,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      watchlists,
    });
  } catch (error) {
    console.error("Get watchlists failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch watchlists",
    });
  }
});

// Create a new watchlist
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Watchlist name is required",
      });
    }

    const watchlist = await Watchlist.create({
      userId: req.user.userId,
      name,
      symbols: [],
    });

    res.status(201).json({
      success: true,
      watchlist,
    });
  } catch (error) {
    console.error("Create watchlist failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create watchlist",
    });
  }
});

// Add a symbol to a watchlist
router.post("/:id/symbols", authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Symbol is required",
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: "Watchlist not found",
      });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!watchlist.symbols.includes(normalizedSymbol)) {
      watchlist.symbols.push(normalizedSymbol);
      await watchlist.save();
    }

    res.json({
      success: true,
      watchlist,
    });
  } catch (error) {
    console.error("Add symbol failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add symbol",
    });
  }
});

// Remove a symbol from a watchlist
router.delete("/:id/symbols/:symbol", authMiddleware, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: "Watchlist not found",
      });
    }

    const symbol = req.params.symbol.toUpperCase();

    watchlist.symbols = watchlist.symbols.filter(
      (item) => item !== symbol
    );

    await watchlist.save();

    res.json({
      success: true,
      watchlist,
    });
  } catch (error) {
    console.error("Remove symbol failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to remove symbol",
    });
  }
});

// Get watchlist quotes with since-last-checked data
router.get("/:id/changes", authMiddleware, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: "Watchlist not found",
      });
    }

    if (!watchlist.symbols.length) {
      return res.json({
        success: true,
        quotes: [],
        sinceSeen: {},
        lastOpenedAt: null,
        isFirstVisit: true,
      });
    }

    const Quote = require("../models/Quote");

    const quotes = await Quote.find({
      symbol: { $in: watchlist.symbols },
    }).lean();

    const sinceSeenData = await getSinceSeenData({
      userId: req.user.userId,
      watchlistId: watchlist._id,
      quotes,
    });

    res.json({
      success: true,
      quotes,
      ...sinceSeenData,
    });
  } catch (error) {
    console.error("Get watchlist changes failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to calculate watchlist changes",
    });
  }
});

module.exports = router;