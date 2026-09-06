const express = require("express");
const Stats = require("../models/Stats");
const { calculateAttentionScore } = require("../services/scoring");
const Watchlist = require("../models/Watchlist");
const authMiddleware = require("../middleware/auth");
const { getSinceSeenData } = require("../services/lastSeenService");
const { generateBrief } = require("../services/briefGenerator");

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

// Get ranked watchlist changes
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

    // Empty watchlist
    if (!watchlist.symbols.length) {
      return res.json({
        success: true,
        quotes: [],
        sinceSeen: {},
        lastOpenedAt: null,
        isFirstVisit: true,
        brief: "Nothing unusual needs your attention right now.",
      });
    }

    const Quote = require("../models/Quote");

    // Get latest quotes
    const quotes = await Quote.find({
      symbol: { $in: watchlist.symbols },
    }).lean();

    // Calculate changes since the user last opened the watchlist
    const sinceSeenData = await getSinceSeenData({
      userId: req.user.userId,
      watchlistId: watchlist._id,
      quotes,
    });

    // Get historical statistics
    const stats = await Stats.find({
      symbol: { $in: watchlist.symbols },
    }).lean();

    const statsBySymbol = {};

    for (const stat of stats) {
      statsBySymbol[stat.symbol] = stat;
    }

    // Score every stock
    const scoredQuotes = quotes.map((quote) => {
      const stat = statsBySymbol[quote.symbol];

      const sinceSeen = sinceSeenData.sinceSeen[quote.symbol];

      const sinceSeenPriceDelta = sinceSeen?.priceDelta ?? null;
      const sinceSeenPct = sinceSeen?.sinceSeenPct ?? null;

      // If no historical stats exist, keep the quote visible
      // but give it a neutral attention score.
      if (!stat) {
        return {
          ...quote,
          avgVolume: null,
          sinceSeenPriceDelta,
          sinceSeenPct,
          score: 0,
          moveZ: 0,
          volRatio: 0,
          crossed52: 0,
          unusual: false,
          direction: "flat",
        };
      }

      const scoringSinceSeenPct = sinceSeenPct ?? 0;

      const crossed52 =
        quote.price >= stat.week52High ||
        quote.price <= stat.week52Low
          ? 1
          : 0;

      const scoringResult = calculateAttentionScore({
        todayPct: quote.dayChangePct,
        meanDailyPct: stat.meanDailyPct,
        stdDailyPct: stat.stdDailyPct,
        todayVolume: quote.volume,
        avgVolume: stat.avgVolume,
        crossed52,
        sinceSeenPct: scoringSinceSeenPct,
      });

      return {
        ...quote,

        // Used by the frontend for "Vol vs Avg"
        avgVolume: stat.avgVolume,

        // Used by the frontend for "Since Last Checked"
        sinceSeenPriceDelta,
        sinceSeenPct,

        // Attention scoring information
        ...scoringResult,
      };
    });

    // Highest attention score first
    scoredQuotes.sort((a, b) => b.score - a.score);

    // Only unusual stocks are sent to the LLM.
    // The scoring system decides what deserves attention.
    const flaggedSignals = scoredQuotes
     .filter((quote) => quote.unusual)
     .slice(0, 3)
     .map((quote) => ({
        symbol: quote.symbol.replace(/\.(NS|BO)$/, ""),
        dayChangePct: quote.dayChangePct,
        moveZ: quote.moveZ,
        volRatio: quote.volRatio,
        crossed52: quote.crossed52,
        sinceSeenPct: quote.sinceSeenPct ?? 0,
        score: quote.score,
        direction: quote.direction,
      }));

    // Generate a short explanation.
    // If Groq fails, generateBrief() automatically uses the fallback.
    const brief = await generateBrief(flaggedSignals);

    res.json({
      success: true,
      quotes: scoredQuotes,
      sinceSeen: sinceSeenData.sinceSeen,
      lastOpenedAt: sinceSeenData.lastOpenedAt,
      isFirstVisit: sinceSeenData.isFirstVisit,
      debounced: sinceSeenData.debounced || false,
      brief,
    });
  } catch (error) {
    console.error(
      "Get watchlist changes failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to calculate watchlist changes",
    });
  }
});

module.exports = router;