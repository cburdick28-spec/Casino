"use client";

// src/components/TopBar.js
// Sticky metrics bar: cash, reputation meter, day counter, active cheater count.

export default function TopBar({ cash, reputation, day, cheaterCount }) {
  const repColor =
    reputation > 66 ? "var(--neon-lime)" : reputation > 33 ? "var(--neon-cyan)" : "var(--neon-magenta)";

  const cashColor = cash < 0 ? "var(--neon-magenta)" : "var(--neon-lime)";

  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-glyph">▣</span>
        <span className="brand-text">
          CYBER-TYCOON <span className="brand-sub">// NEON CASINO</span>
        </span>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="metric-label">Cash</span>
          <span className="metric-value" style={{ color: cashColor }}>
            ${cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="metric metric-rep">
          <span className="metric-label">Reputation</span>
          <div className="rep-bar" title={`${Math.round(reputation)} / 100`}>
            <div
              className="rep-bar-fill"
              style={{ width: `${reputation}%`, background: repColor }}
            />
          </div>
          <span className="metric-value-small" style={{ color: repColor }}>
            {Math.round(reputation)}
          </span>
        </div>

        <div className="metric">
          <span className="metric-label">Day</span>
          <span className="metric-value">{day}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Cheaters</span>
          <span
            className="metric-value"
            style={{ color: cheaterCount > 0 ? "var(--neon-magenta)" : "var(--text-dim)" }}
          >
            {cheaterCount}
          </span>
        </div>
      </div>
    </header>
  );
}
