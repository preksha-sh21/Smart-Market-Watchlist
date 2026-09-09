const cron = require("node-cron");
const { getQuotes } = require("../services/marketDataService");

const WATCHLIST_SYMBOLS = [
  "RELIANCE.NS",
  "TATASTEEL.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "TCS.NS",
];

const pollMarketData = async () => {
  try {
    console.log("Polling market data...");

    const quotes = await getQuotes(WATCHLIST_SYMBOLS);

    console.log(`Market data updated: ${quotes.length} quotes`);
  } catch (error) {
    console.error("Market data poll failed:", error.message);
  }
};

const startCronPoller = () => {
  // Run once immediately when the server starts.
  pollMarketData();

  // Then run every 5 minutes.
  cron.schedule("*/5 * * * *", () => {
    pollMarketData();
  });

  console.log("Market data cron poller started");
};

module.exports = {
  startCronPoller,
};