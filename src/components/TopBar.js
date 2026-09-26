"use client";

// src/components/TopBar.js
// Sticky metrics bar: cash, reputation meter, day counter, active cheater
// count, plus the signed-in account and a sign-out control.

export default function TopBar({
  cash,
  reputation,
  day,
  cheaterCount,
  email,
  unlimitedMoney,
  onSignOut,
}) {
  const repColor =
    reputation > 66 ? "var(--neon-lime)" : reputation > 33 ? "var(--neon-cyan)" : "var(--neon-magenta)";

  const cashColor = unlimitedMoney ? "var(--neon-lime)" : cash < 0 ? "var(--neon-magenta)" : "var(--neon-lime)";
  const cashDisplay = unlimitedMoney
    ? "∞"
    : `$${cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

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
            {cashDisplay}
            {unlimitedMoney && <span className="vip-badge"> VIP</span>}
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

        {email && (
          <div className="metric account-metric">
            <span className="metric-label">Account</span>
            <span className="account-row">
              <span className="account-email" title={email}>
                {email}
              </span>
              <button className="btn btn-primary account-signout" onClick={onSignOut}>
                Sign out
              </button>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
