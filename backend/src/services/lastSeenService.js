const Visit = require("../models/Visit");

const DEBOUNCE_MINUTES = 5;

const getSinceSeenData = async ({
  userId,
  watchlistId,
  quotes,
}) => {
  const now = new Date();

  const visit = await Visit.findOne({
    userId,
    watchlistId,
  });

  // First time this user opens this watchlist
  if (!visit) {
    const prices = {};

    for (const quote of quotes) {
      prices[quote.symbol] = quote.price;
    }

    await Visit.create({
      userId,
      watchlistId,
      lastOpenedAt: now,
      prices,
    });

    return {
      sinceSeen: {},
      lastOpenedAt: null,
      isFirstVisit: true,
    };
  }

  const minutesSinceLastOpen =
    (now.getTime() - visit.lastOpenedAt.getTime()) / (1000 * 60);

  const sinceSeen = {};

  // Calculate changes from the previous snapshot
  for (const quote of quotes) {
    const previousPrice = visit.prices[quote.symbol];

    if (
      previousPrice !== undefined &&
      previousPrice !== null &&
      previousPrice !== 0
    ) {
      const priceDelta = Number(
        (quote.price - previousPrice).toFixed(2)
      );

      const sinceSeenPct = Number(
        (((quote.price - previousPrice) / previousPrice) * 100).toFixed(2)
      );

      sinceSeen[quote.symbol] = {
        priceDelta,
        sinceSeenPct,
      };
    }
  }

  // Don't update the snapshot if opened again within 5 minutes
  if (minutesSinceLastOpen < DEBOUNCE_MINUTES) {
    return {
      sinceSeen,
      lastOpenedAt: visit.lastOpenedAt,
      isFirstVisit: false,
      debounced: true,
    };
  }

  // Update the snapshot after the debounce period
  const newPrices = {};

  for (const quote of quotes) {
    newPrices[quote.symbol] = quote.price;
  }

  await Visit.findOneAndUpdate(
    {
      userId,
      watchlistId,
      lastOpenedAt: visit.lastOpenedAt,
    },
    {
      $set: {
        lastOpenedAt: now,
        prices: newPrices,
      },
    },
    {
      returnDocument: "after",
    }
  );

  return {
    sinceSeen,
    lastOpenedAt: visit.lastOpenedAt,
    isFirstVisit: false,
    debounced: false,
  };
};

module.exports = {
  getSinceSeenData,
};