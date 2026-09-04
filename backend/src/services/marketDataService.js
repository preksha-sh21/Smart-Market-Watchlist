const YahooFinance = require("yahoo-finance2").default;

const { getMockQuotes } = require("./mockFeed");
const Quote = require("../models/Quote");

const yahooFinance = new YahooFinance();

const getYahooQuotes = async (symbols) => {
  const results = await yahooFinance.quote(symbols);

  return results.map((quote) => ({
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    dayChangePct: quote.regularMarketChangePercent || 0,
    volume: quote.regularMarketVolume || 0,
    source: quote.symbol.endsWith(".NS") ? "NSE" : "BSE",
    ts: new Date(),
    stale: false,
  }));
};

const saveQuotes = async (quotes) => {
  for (const quote of quotes) {
    await Quote.findOneAndUpdate(
      { symbol: quote.symbol },
      quote,
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );
  }

  return quotes;
};

const getQuotes = async (symbols) => {
  const useMock = process.env.USE_MOCK === "true";
  const killFeed = process.env.KILL_FEED === "true";

  // Deliberately disable the market feed.
  // Keep the last known prices and mark them stale.
  if (killFeed) {
    const lastQuotes = await Quote.find({
      symbol: { $in: symbols },
    }).lean();

    return lastQuotes.map((quote) => ({
      ...quote,
      stale: true,
    }));
  }

  try {
    let quotes;

    if (useMock) {
      quotes = getMockQuotes(symbols);
    } else {
      quotes = await getYahooQuotes(symbols);
    }

    return await saveQuotes(quotes);
  } catch (error) {
    console.error("Market feed failed:", error.message);

    // Feed failed: return the last good quotes instead of crashing.
    const lastQuotes = await Quote.find({
      symbol: { $in: symbols },
    }).lean();

    return lastQuotes.map((quote) => ({
      ...quote,
      stale: true,
    }));
  }
};

module.exports = {
  getQuotes,
};