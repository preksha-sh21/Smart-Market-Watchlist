const mockPrices = {
  "RELIANCE.NS": {
    price: 1328.1,
    dayChangePct: 1.42,
    volume: 4200000,
    source: "NSE",
  },

  "TATASTEEL.NS": {
    price: 158.75,
    dayChangePct: -2.31,
    volume: 6800000,
    source: "NSE",
  },

  "INFY.NS": {
    price: 1485.2,
    dayChangePct: 0.85,
    volume: 3100000,
    source: "NSE",
  },

  "HDFCBANK.NS": {
    price: 1942.6,
    dayChangePct: -0.64,
    volume: 2500000,
    source: "NSE",
  },

  "TCS.NS": {
    price: 3210.4,
    dayChangePct: 1.18,
    volume: 1800000,
    source: "NSE",
  },
};

const getMockQuotes = (symbols) => {
  const now = new Date();

  return symbols
    .filter((symbol) => mockPrices[symbol])
    .map((symbol) => {
      const data = mockPrices[symbol];

      return {
        symbol,
        price: data.price,
        dayChangePct: data.dayChangePct,
        volume: data.volume,
        source: data.source,
        ts: now,
        stale: false,
      };
    });
};

module.exports = {
  getMockQuotes,
};