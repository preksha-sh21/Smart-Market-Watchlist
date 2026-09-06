const API_BASE_URL = "https://smart-market-watchlist-api-a9p0.onrender.com";

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

export const loginUser = async (username, password) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
};

export const getWatchlists = async (token) => {
  return request("/watchlists", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getWatchlistChanges = async (token, watchlistId) => {
  return request(`/watchlists/${watchlistId}/changes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getQuotes = async (symbols) => {
  const query = symbols.join(",");

  return request(`/quotes?symbols=${encodeURIComponent(query)}`);
};