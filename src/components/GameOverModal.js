"use client";

// src/components/GameOverModal.js
// Shown when the casino goes bankrupt or reputation collapses to zero.

export default function GameOverModal({ gameOver, reason, day, stats, onRestart }) {
  if (!gameOver) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card game-over-modal">
        <h3 className="game-over-title">SYSTEM SHUTDOWN</h3>
        <p className="modal-text">{reason}</p>
        <div className="game-over-stats">
          <div>
            Survived <strong>{day}</strong> day{day === 1 ? "" : "s"}
          </div>
          <div>
            Total revenue: <strong>${Math.round(stats.totalRevenue).toLocaleString()}</strong>
          </div>
          <div>
            Guests served: <strong>{stats.totalGuestsServed.toLocaleString()}</strong>
          </div>
          <div>
            Cheaters caught: <strong>{stats.cheatersCaught}</strong> · fled:{" "}
            <strong>{stats.cheatersFled}</strong>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onRestart}>
          🔁 Reboot Casino
        </button>
      </div>
    </div>
  );
}
