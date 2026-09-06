import { useEffect, useState } from "react";
import {
  getWatchlistChanges,
  getWatchlists,
  loginUser,
} from "./api/api";

import WatchlistTable from "./components/WatchlistTable";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [watchlist, setWatchlist] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [brief, setBrief] = useState("");
  const [lastOpenedAt, setLastOpenedAt] = useState(null);
  const [message, setMessage] = useState("");

  const loadWatchlistData = async (authToken) => {
    try {
      setMessage("Loading your watchlist...");

      const watchlistData = await getWatchlists(authToken);

      if (!watchlistData.watchlists.length) {
        setMessage("You don't have any watchlists yet.");
        return;
      }

      const firstWatchlist = watchlistData.watchlists[0];

      setWatchlist(firstWatchlist);

      if (!firstWatchlist.symbols.length) {
        setMessage("Your watchlist is empty.");
        setBrief(
          "Nothing unusual needs your attention right now."
        );
        setQuotes([]);
        return;
      }

      const changeData = await getWatchlistChanges(
        authToken,
        firstWatchlist._id
      );

      setQuotes(changeData.quotes);
      setBrief(changeData.brief || "");
      setLastOpenedAt(changeData.lastOpenedAt || null);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadWatchlistData(token);
    }
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setMessage("Logging in...");

      const data = await loginUser(username, password);

      localStorage.setItem("token", data.token);
      setToken(data.token);

      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setWatchlist(null);
    setQuotes([]);
    setBrief("");
    setLastOpenedAt(null);
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark">S</div>

          <h1>Smart Market Watchlist</h1>

          <p className="login-subtitle">
            See what meaningfully changed since you last checked.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="primary-button">
              Login
            </button>
          </form>

          {message && (
            <p className="login-message">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">

      {/* ---------------- Header ---------------- */}

      <header className="top-header">
        <div className="header-inner">

          <div className="brand">
            <div className="brand-logo">S</div>

            <span className="brand-name">
              SmartMarket
            </span>
          </div>

          <nav className="main-nav">
            <span>Stocks</span>
            <span>F&amp;O</span>
            <span>Mutual Funds</span>
          </nav>

          <div className="header-actions">
            <div className="search-box">
              <span>⌕</span>
              <span>Search...</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Log out of SmartMarket"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* ---------------- Secondary navigation ---------------- */}

      <div className="secondary-nav">
        <div className="content-width secondary-inner">
          <span>Explore</span>
          <span>Holdings</span>
          <span>Positions</span>
          <span>Orders</span>
          <span className="active">Watchlist</span>
        </div>
      </div>

      {/* ---------------- Market strip ---------------- */}

      <div className="market-strip">
        <div className="content-width market-strip-inner">

          <div className="market-item">
            <strong>NIFTY</strong>
            <span>23,897.70</span>
            <span className="positive">
              +24.25 (0.10%)
            </span>
          </div>

          <div className="market-item">
            <strong>SENSEX</strong>
            <span>76,515.43</span>
            <span className="positive">
              +362.57 (0.48%)
            </span>
          </div>

          <div className="market-item">
            <strong>BANKNIFTY</strong>
            <span>57,369.65</span>
            <span className="negative">
              -10.95 (0.02%)
            </span>
          </div>

          <div className="market-item">
            <strong>MIDCPNIFTY</strong>
            <span>14,713.65</span>
            <span className="negative">
              -46.35 (0.31%)
            </span>
          </div>

        </div>
      </div>

      {/* ---------------- Main content ---------------- */}

      <main className="content-width main-content">

        {message && (
          <div className="status-message">
            {message}
          </div>
        )}

        {watchlist && (
          <>

            {/* Watchlist card */}

            <section className="watchlist-card">

              {/* Card header */}

              <div className="watchlist-header">

                <div className="watchlist-tabs">
                  <button className="watchlist-tab active">
                    My Watchlist
                  </button>

                  <button className="watchlist-tab add-tab">
                    + Watchlist
                  </button>
                </div>

              </div>

              {/* Search / controls */}

              <div className="watchlist-toolbar">

                <div className="watchlist-search">
                  <span>⌕</span>
                  <span>Search your watchlist</span>
                </div>

                <button
                  className="toolbar-button"
                  title="Add stocks to this watchlist"
                >
                  + Add stocks
                </button>

                <button
                  className="toolbar-button"
                  title="Manage stocks in this watchlist"
                >
                  Edit
                </button>

              </div>

              {/* Welcome brief */}

              <div className="brief-card">

                <div className="brief-heading">
                  <span className="brief-icon">✦</span>

                  <div>
                    <h2>Welcome back</h2>

                    <p>
                      Here's what deserves your attention.
                    </p>
                  </div>
                </div>

                <p className="brief-text">
                  {brief}
                </p>

              </div>

              {/* Watchlist */}

              <div className="table-section">

                <div className="table-heading">

                  <div>
                    <h2>Watchlist</h2>

                    <p>
                      Ranked by attention score — highest
                      priority first.
                    </p>
                  </div>

                  <div className="stock-count">
                    {quotes.length} stocks
                  </div>

                </div>

                <WatchlistTable
                  quotes={quotes}
                  lastOpenedAt={lastOpenedAt}
                />

              </div>

            </section>

          </>
        )}

      </main>

      <footer className="footer">
        Smart Market Watchlist · Attention is based on observable
        market signals, not predictions.
      </footer>

    </div>
  );
}

export default App;