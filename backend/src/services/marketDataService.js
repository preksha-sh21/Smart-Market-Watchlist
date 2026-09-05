const YahooFinance = require("yahoo-finance2").default;

const { getMockQuotes } = require("./mockFeed");
const Quote = require("../models/Quote");

const yahooFinance = new YahooFinance();

const isValidQuote = (quote) => {
  return (
    quote &&
    typeof quote.symbol === "string" &&
    Number.isFinite(quote.price) &&
    quote.price > 0 &&
    Number.isFinite(quote.dayChangePct) &&
    Number.isFinite(quote.volume) &&
    quote.volume >= 0 &&
    ["NSE", "BSE"].includes(quote.source) &&
    quote.ts instanceof Date &&
    !Number.isNaN(quote.ts.getTime())
  );
};

const getLastGoodQuotes = async (symbols) => {
  const lastQuotes = await Quote.find({
    symbol: { $in: symbols },
  }).lean();

  return lastQuotes.map((quote) => ({
    ...quote,
    stale: true,
  }));
};

const getYahooQuotes = async (symbols) => {
  const results = await yahooFinance.quote(symbols);

  return results
    .map((quote) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      dayChangePct: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      source: quote.symbol.endsWith(".NS") ? "NSE" : "BSE",
      ts: new Date(),
      stale: false,
    }))
    .filter(isValidQuote);
};

const preferNSEQuotes = (quotes) => {
  const quotesByBaseSymbol = {};

  for (const quote of quotes) {
    const baseSymbol = quote.symbol.replace(/\.(NS|BO)$/, "");

    const existing = quotesByBaseSymbol[baseSymbol];

    if (!existing || quote.source === "NSE") {
      quotesByBaseSymbol[baseSymbol] = quote;
    }
  }

  return Object.values(quotesByBaseSymbol);
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
        runValidators: true,
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
    return getLastGoodQuotes(symbols);
  }

  try {
    let quotes;

    if (useMock) {
      quotes = getMockQuotes(symbols);
    } else {
      quotes = await getYahooQuotes(symbols);
    }

    quotes = preferNSEQuotes(quotes);

    // Never replace a good stored quote with missing/invalid data.
    if (!quotes.length) {
      return getLastGoodQuotes(symbols);
    }

    const validSymbols = new Set(quotes.map((quote) => quote.symbol));

    const missingSymbols = symbols.filter(
      (symbol) => !validSymbols.has(symbol)
    );

    const savedQuotes = await saveQuotes(quotes);

    // If only some symbols failed, preserve their last good values.
    if (missingSymbols.length) {
      const staleQuotes = await getLastGoodQuotes(missingSymbols);

      return [...savedQuotes, ...staleQuotes];
    }

    return savedQuotes;
  } catch (error) {
    console.error("Market feed failed:", error.message);

    // Feed failed: return the last good quotes instead of crashing.
    return getLastGoodQuotes(symbols);
  }
};

module.exports = {
  getQuotes,
};