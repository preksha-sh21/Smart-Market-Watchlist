const express = require("express");
const { getQuotes } = require("../services/marketDataService");

const router = express.Router();

router.get("/quotes", async (req, res) => {
  try {
    const symbols = req.query.symbols
      ? req.query.symbols.split(",").map((symbol) => symbol.trim().toUpperCase())
      : [
          "RELIANCE.NS",
          "TATASTEEL.NS",
          "INFY.NS",
          "HDFCBANK.NS",
          "TCS.NS",
        ];

    const quotes = await getQuotes(symbols);

    res.json({
      success: true,
      count: quotes.length,
      quotes,
    });
  } catch (error) {
    console.error("Quotes route failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch market quotes",
    });
  }
});

module.exports = router;