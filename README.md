# Smart Market Watchlist

> **See what meaningfully changed since you last checked.**

Smart Market Watchlist is a full-stack Indian stock-market monitoring application that turns a traditional watchlist into an **attention engine**.

Instead of simply showing prices, the application identifies which stocks have experienced meaningful observable changes and ranks them by an explainable attention score.

The core product principle is:

> **Math decides what is meaningful. The LLM only explains it.**

The system does not predict prices or make buy/sell recommendations.

---

## 🚀 Live Demo

**Frontend:**  
https://smart-market-watchlist-lovat.vercel.app

**Backend API:**  
https://smart-market-watchlist-api-a9p0.onrender.com

**GitHub:**  
https://github.com/preksha-sh21/Smart-Market-Watchlist

---

## 🎯 Problem

Traditional stock watchlists answer:

> "What are my stocks doing today?"

Smart Market Watchlist focuses on a different question:

> **"What meaningfully changed since I last checked, and what deserves my attention now?"**

A user may have several stocks in their watchlist but limited time to investigate all of them.

The application therefore:

1. Tracks the user's last visit.
2. Compares current market data with the previous state.
3. Detects unusual observable market signals.
4. Calculates an attention score.
5. Ranks stocks by attention.
6. Uses an LLM only to explain the highest-priority signals.

---

# ✨ Features

## 1. Attention Ranking

Stocks are ranked using an explainable attention score based on observable signals:

- Unusual price movement
- Movement relative to historical volatility
- Volume compared with average volume
- 52-week high/low crossings
- Price movement since the user's last check

The resulting score is deterministic and reproducible.

---

## 2. Since-Last-Check Tracking

The application records when a user last opened their watchlist.

For each stock, the UI can show:

- Price change since last checked
- Percentage change since last checked
- Previous visit state
- First-visit state when no previous snapshot exists

This allows the application to answer:

> **"What changed since I was last here?"**

rather than only displaying today's movement.

---

## 3. Explainable Attention Scores

Every stock has a score breakdown that explains why it received its ranking.

| Signal | Maximum Contribution |
|---|---:|
| Movement | 40 |
| Volume | 25 |
| 52-week level | 20 |
| Since last check | 15 |
| **Total** | **100** |

The frontend exposes this information through the **"Why this score?"** section.

---

## 4. Unusual-Move Detection

A stock can be flagged when observable signals indicate unusual activity.

Current thresholds include:

- Absolute movement Z-score ≥ 2
- Volume ratio ≥ 2× average
- Crossing a 52-week level

The application uses these signals to determine which stocks deserve attention.

---

## 5. Volume vs Average

The system compares current trading volume against historical average volume.

For example:

```text
2.16× average volume