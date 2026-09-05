const Groq = require("groq-sdk");

const GROQ_TIMEOUT_MS = 5000;

const generateFallbackBrief = (signals) => {
  if (!signals.length) {
    return "Nothing unusual needs your attention right now.";
  }

  const lines = signals.slice(0, 3).map((signal) => {
    const directionText =
      signal.direction === "up"
        ? "moved up"
        : signal.direction === "down"
        ? "moved down"
        : "was flat";

    const unusualReasons = [];

    if (Math.abs(signal.moveZ) >= 2) {
      unusualReasons.push("an unusual price move");
    }

    if (signal.volRatio >= 2) {
      unusualReasons.push("unusually high volume");
    }

    if (signal.crossed52 === 1) {
      unusualReasons.push("a new 52-week level");
    }

    const reasonText =
      unusualReasons.length > 0
        ? ` with ${unusualReasons.join(" and ")}`
        : "";

    return `${signal.symbol} ${directionText}${reasonText}.`;
  });

  return lines.join(" ");
};

const generateGroqBrief = async (signals) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const signalsJson = JSON.stringify(signals.slice(0, 3), null, 2);

  const request = groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
  {
    role: "system",
    content:
      "You explain market signals. You do not judge, recommend, or predict. Report only observable facts from the provided signals. Never use words such as bullish, bearish, strong, weak, opportunity, risk, likely, should, buy, or sell.",
  },
  {
    role: "user",
    content: `Turn these signals into 2-3 short lines telling the user what needs attention.

Use only the provided signals.
Mention the most relevant numerical facts.
Do not add information that is not present.
Do not make predictions or investment recommendations.
Do not describe a stock as good, bad, strong, weak, bullish, or bearish.

Signals:
${signalsJson}`,
  },
],
    temperature: 0.2,
    max_completion_tokens: 150,
    reasoning_effort: "low",
    include_reasoning: false,
  });

  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Groq request timed out"));
    }, GROQ_TIMEOUT_MS);
  });

  const completion = await Promise.race([request, timeout]);

  const content = completion?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return content.trim();
};

const generateBrief = async (signals) => {
  try {
    return await generateGroqBrief(signals);
  } catch (error) {
    console.error("Groq brief generation failed:", error.message);
    return generateFallbackBrief(signals);
  }
};

module.exports = {
  generateBrief,
  generateFallbackBrief,
  generateGroqBrief,
};