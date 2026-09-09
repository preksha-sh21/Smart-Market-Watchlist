const { getMockQuotes } = require("./mockFeed");

const Quote = require("../models/Quote");

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

/*
 * Fetch one quote from Yahoo's Chart API.
 *
 * This avoids yahoo-finance2's quote() crumb flow,
 * which is currently returning 429 errors on Render.
 */
const getYahooChartQuote = async (symbol) => {
  const url = new URL(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}`
  );

  url.searchParams.set("range", "1d");
  url.searchParams.set("interval", "5m");
  url.searchParams.set("events", "history");

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Yahoo chart request failed for ${symbol}: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const result = data?.chart?.result?.[0];

  if (!result) {
    throw new Error(`No Yahoo chart data returned for ${symbol}`);
  }

  const meta = result.meta || {};
  const quoteData = result.indicators?.quote?.[0] || {};

  const closes = quoteData.close || [];
  const volumes = quoteData.volume || [];

  // Find the latest valid closing price from the chart.
  let lastIndex = -1;

  for (let i = closes.length - 1; i >= 0; i--) {
    if (Number.isFinite(closes[i])) {
      lastIndex = i;
      break;
    }
  }

  // Prefer Yahoo's current market price.
  const price = Number.isFinite(meta.regularMarketPrice)
    ? meta.regularMarketPrice
    : lastIndex >= 0
    ? closes[lastIndex]
    : null;

  // Yahoo provides the previous trading day's close.
  const previousClose = Number.isFinite(meta.previousClose)
    ? meta.previousClose
    : 0;

  const dayChangePct =
    previousClose > 0 && Number.isFinite(price)
      ? ((price - previousClose) / previousClose) * 100
      : 0;

  // Prefer Yahoo's regular market volume.
  const volume = Number.isFinite(meta.regularMarketVolume)
    ? meta.regularMarketVolume
    : lastIndex >= 0 && Number.isFinite(volumes[lastIndex])
    ? volumes[lastIndex]
    : 0;

  /*
   * Use Yahoo's market timestamp when available.
   * Fall back to the current server time if Yahoo does not provide one.
   */
  const marketTimestamp = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000)
    : new Date();

  return {
    symbol,
    price,
    dayChangePct,
    volume,
    source: symbol.endsWith(".NS") ? "NSE" : "BSE",
    ts: marketTimestamp,
    stale: false,
  };
};

/*
 * Fetch quotes for all requested symbols.
 *
 * Requests are made sequentially rather than all at once
 * to reduce the chance of triggering Yahoo rate limits.
 */
const getYahooQuotes = async (symbols) => {
  const results = [];

  for (const symbol of symbols) {
    try {
      const quote = await getYahooChartQuote(symbol);
      results.push(quote);
    } catch (error) {
      console.error(
        `Yahoo chart feed failed for ${symbol}:`,
        error.message
      );
    }
  }

  return results.filter(isValidQuote);
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

    const validSymbols = new Set(
      quotes.map((quote) => quote.symbol)
    );

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