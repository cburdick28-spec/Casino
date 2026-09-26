"use client";

// src/components/FloorPanel.js
// The casino floor: one card per game module showing live guests/capacity,
// the house-edge slider, and a live list of active cheaters to catch.

export default function FloorPanel({ games, cheaters, onEdgeChange, onCatchCheater }) {
  const unlockedGames = Object.values(games).filter((g) => g.unlocked);

  return (
    <section className="panel floor-panel">
      <h2 className="panel-title">
        <span className="panel-title-icon">🏙</span> Casino Floor
      </h2>

      <div className="game-grid">
        {unlockedGames.map((game) => {
          const cheatersHere = cheaters.filter((c) => c.gameKey === game.key);
          const occupancyPct = game.capacity
            ? Math.round((game.guests / game.capacity) * 100)
            : 0;

          return (
            <div key={game.key} className={`game-card game-card--${game.key}`}>
              <div className="game-card-header">
                <span className="game-icon">{game.icon}</span>
                <div>
                  <div className="game-name">{game.name}</div>
                  <div className="game-desc">{game.description}</div>
                </div>
              </div>

              <div className="game-stat-row">
                <span>Guests</span>
                <span>
                  {game.guests} / {game.capacity}
                </span>
              </div>
              <div className="occupancy-bar">
                <div
                  className="occupancy-bar-fill"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>

              <div className="game-stat-row">
                <span>Upkeep</span>
                <span className="text-magenta">-${game.upkeep}/tick</span>
              </div>

              <div className="game-stat-row">
                <span>Last Tick Net</span>
                <span className={game.lastNet >= 0 ? "text-lime" : "text-magenta"}>
                  {game.lastNet >= 0 ? "+" : ""}${game.lastNet}
                </span>
              </div>

              <div className="edge-control">
                <label htmlFor={`edge-${game.key}`}>
                  House Edge: <strong>{game.houseEdge}%</strong>
                </label>
                <input
                  id={`edge-${game.key}`}
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={game.houseEdge}
                  onChange={(e) => onEdgeChange(game.key, Number(e.target.value))}
                  className="edge-slider"
                />
                <div className="edge-slider-labels">
                  <span>Fair</span>
                  <span>Greedy</span>
                </div>
              </div>

              {cheatersHere.length > 0 && (
                <div className="cheater-alert-box">
                  {cheatersHere.map((c) => (
                    <button
                      key={c.id}
                      className="btn btn-danger cheater-btn"
                      onClick={() => onCatchCheater(c.id)}
                      title="Click to personally catch this cheater"
                    >
                      🚨 Catch Cheater! ({c.ticksAlive} ticks active)
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
