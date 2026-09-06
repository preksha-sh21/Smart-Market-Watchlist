const calculateAttentionScore = ({
  todayPct,
  meanDailyPct,
  stdDailyPct,
  todayVolume,
  avgVolume,
  crossed52,
  sinceSeenPct,
}) => {
  const moveZ =
    stdDailyPct > 0
      ? (todayPct - meanDailyPct) / stdDailyPct
      : 0;

  const volRatio =
    avgVolume > 0
      ? todayVolume / avgVolume
      : 0;

  const moveComponent =
    40 * Math.min(Math.abs(moveZ) / 3, 1);

  const volumeComponent =
    25 *
    Math.min(
      Math.max(volRatio - 1, 0) / 2,
      1
    );

  const crossed52Component =
    20 * (crossed52 ? 1 : 0);

  const sinceSeenComponent =
    15 *
    Math.min(
      Math.abs(sinceSeenPct) / 5,
      1
    );

  const score =
    moveComponent +
    volumeComponent +
    crossed52Component +
    sinceSeenComponent;

  const unusual =
    Math.abs(moveZ) >= 2 ||
    volRatio >= 2 ||
    crossed52 === 1;

  const direction =
    todayPct > 0
      ? "up"
      : todayPct < 0
      ? "down"
      : "flat";

  return {
    score: Number(score.toFixed(2)),

    moveZ: Number(moveZ.toFixed(2)),

    volRatio: Number(volRatio.toFixed(2)),

    crossed52,

    unusual,

    direction,

    // Expose the individual score components
    // so the user can understand why a stock
    // received its attention score.
    scoreBreakdown: {
      movement: Number(
        moveComponent.toFixed(2)
      ),

      volume: Number(
        volumeComponent.toFixed(2)
      ),

      week52: Number(
        crossed52Component.toFixed(2)
      ),

      sinceLastCheck: Number(
        sinceSeenComponent.toFixed(2)
      ),
    },
  };
};

module.exports = {
  calculateAttentionScore,
};