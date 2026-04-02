/**
 * Centralized utility for game state calculations.
 * Ensures Admin and Participants always see the same time.
 */
function getCalculatedGameState(gameState) {
  if (!gameState) return { phase: "waiting", timeRemainingSec: 7200 };

  const now = Date.now();
  let timeLeft = gameState.timeRemainingSec;
  let currentPhase = gameState.phase;

  if (currentPhase === "recon") {
    // Calculate real-time elapsed since the last database update
    const elapsed = Math.floor((now - new Date(gameState.lastUpdateAt).getTime()) / 1000);
    timeLeft = Math.max(0, timeLeft - elapsed);

    // Auto-end the game if time is up
    if (timeLeft === 0 && gameState.phase !== "ended") {
      currentPhase = "ended";
    }
  }

  return {
    phase: currentPhase,
    timeRemainingSec: timeLeft,
    lastUpdateAt: gameState.lastUpdateAt
  };
}

module.exports = { getCalculatedGameState };
