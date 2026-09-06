function formatSinceSeen(quote) {
  if (
    quote.sinceSeenPct === undefined ||
    quote.sinceSeenPct === null
  ) {
    return (
      <span className="first-visit">
        First visit
      </span>
    );
  }

  const priceDelta =
    quote.sinceSeenPriceDelta ?? 0;

  const pct = Number(quote.sinceSeenPct);

  if (priceDelta === 0 && pct === 0) {
    return (
      <span className="no-change">
        No change
      </span>
    );
  }

  return (
    <div className="since-seen">

      <div
        className={
          priceDelta >= 0
            ? "positive"
            : "negative"
        }
      >
        {priceDelta >= 0 ? "+" : "-"}₹
        {Math.abs(priceDelta).toFixed(2)}
      </div>

      <div
        className={
          pct >= 0
            ? "positive"
            : "negative"
        }
      >
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </div>

    </div>
  );
}

function getAttentionLabel(quote) {
  if (quote.unusual) {
    return "Attention";
  }

  if (quote.score >= 20) {
    return "Watch";
  }

  return "Normal";
}

function getTrendSymbol(quote) {
  if (quote.direction === "up") {
    return "↑";
  }

  if (quote.direction === "down") {
    return "↓";
  }

  return "—";
}

function getTrendClass(quote) {
  if (quote.direction === "up") {
    return "trend-up";
  }

  if (quote.direction === "down") {
    return "trend-down";
  }

  return "trend-flat";
}

function getAttentionClass(quote) {
  if (quote.unusual) {
    return "attention";
  }

  if (quote.score >= 20) {
    return "watch";
  }

  return "normal";
}

function formatSymbol(symbol) {
  return symbol
    .replace(".NS", "")
    .replace(".BO", "");
}

function WatchlistTable({ quotes }) {
  if (!quotes.length) {
    return (
      <div className="empty-watchlist">
        <div className="empty-icon">☆</div>

        <h2>Your watchlist is empty</h2>

        <p>
          Add stocks to start tracking meaningful market
          changes.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">

      <table className="watchlist-table">

        <thead>
          <tr>
            <th>Company</th>
            <th>Trend</th>
            <th>Mkt price</th>
            <th>1D change</th>
            <th>Since last checked</th>
            <th>Vol vs avg</th>
            <th>Attention</th>
          </tr>
        </thead>

        <tbody>

          {quotes.map((quote) => {

            const attentionLabel =
              getAttentionLabel(quote);

            const attentionClass =
              getAttentionClass(quote);

            const trendClass =
              getTrendClass(quote);

            return (
              <tr
                key={quote.symbol}
                className={
                  quote.stale
                    ? "stale-row"
                    : ""
                }
              >

                {/* Company */}

                <td>
                  <div className="company-cell">

                    <div className="company-icon">
                      {formatSymbol(
                        quote.symbol
                      ).charAt(0)}
                    </div>

                    <div>

                      <div className="company-name">
                        {formatSymbol(
                          quote.symbol
                        )}
                      </div>

                      <div className="company-exchange">
                        {quote.stale
                          ? "Stale data"
                          : quote.source}
                      </div>

                    </div>

                  </div>
                </td>

                {/* Trend */}

                <td>
                  <span
                    className={`trend ${trendClass}`}
                  >
                    {getTrendSymbol(quote)}
                  </span>
                </td>

                {/* Market price */}

                <td>
                  <span className="market-price">
                    ₹
                    {Number(
                      quote.price
                    ).toFixed(2)}
                  </span>
                </td>

                {/* 1D change */}

                <td>
                  <span
                    className={
                      quote.dayChangePct >= 0
                        ? "change-value positive"
                        : "change-value negative"
                    }
                  >
                    {quote.dayChangePct >= 0
                      ? "+"
                      : ""}
                    {Number(
                      quote.dayChangePct
                    ).toFixed(2)}
                    %
                  </span>
                </td>

                {/* Since last checked */}

                <td>
                  {formatSinceSeen(quote)}
                </td>

                {/* Volume */}

                <td>
                  <div className="volume-cell">

                    <strong>
                      {Number(
                        quote.volRatio
                      ).toFixed(2)}
                      ×
                    </strong>

                    <span>
                      average
                    </span>

                  </div>
                </td>

                {/* Attention */}

                <td>
                  <div
                    className={`attention-cell ${attentionClass}`}
                  >

                    <span className="attention-dot"></span>

                    <div>

                      <strong>
                        {attentionLabel}
                      </strong>

                      <span className="score">
                        Score:{" "}
                        {Number(
                          quote.score
                        ).toFixed(2)}
                      </span>

                    </div>

                  </div>
                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}

export default WatchlistTable;