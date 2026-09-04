function WatchlistTable({ quotes }) {
  if (!quotes.length) {
    return (
      <div>
        <h2>Your Watchlist</h2>
        <p>No stocks have been added to this watchlist yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Watchlist</h2>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>1D Change</th>
            <th>Volume</th>
            <th>Source</th>
          </tr>
        </thead>

        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.symbol}>
              <td>{quote.symbol}</td>

              <td>
                ₹{Number(quote.price).toFixed(2)}
              </td>

              <td>
                {Number(quote.dayChangePct).toFixed(2)}%
              </td>

              <td>
                {Number(quote.volume).toLocaleString("en-IN")}
              </td>

              <td>
                {quote.stale ? "Stale" : quote.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WatchlistTable;