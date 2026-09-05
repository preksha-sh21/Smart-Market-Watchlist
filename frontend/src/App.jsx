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
        setBrief("Nothing unusual needs your attention right now.");
        setQuotes([]);
        return;
      }

      const changeData = await getWatchlistChanges(
        authToken,
        firstWatchlist._id
      );

      setQuotes(changeData.quotes);
      setBrief(changeData.brief || "");
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
  };

  if (!token) {
    return (
      <div>
        <h1>Smart Market Watchlist</h1>

        <form onSubmit={handleLogin}>
          <div>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </div>

          <button type="submit">Login</button>
        </form>

        {message && <p>{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>Smart Market Watchlist</h1>

      <button onClick={handleLogout}>Logout</button>

      {message && <p>{message}</p>}

      {watchlist && (
        <>
          <h2>{watchlist.name}</h2>

          <section>
            <h3>Welcome back</h3>
            <p>{brief}</p>
          </section>

          <WatchlistTable quotes={quotes} />
        </>
      )}
    </div>
  );
}

export default App;