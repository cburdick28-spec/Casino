"use client";

// src/components/LogTicker.js
// Scrolling live log of everything happening on the floor — payouts,
// cheater alerts, security catches, and event resolutions.

import { LOG_TYPES } from "@/utils/gameData";

const TYPE_CLASS = {
  [LOG_TYPES.INFO]: "log-info",
  [LOG_TYPES.CASH_UP]: "log-cash-up",
  [LOG_TYPES.CASH_DOWN]: "log-cash-down",
  [LOG_TYPES.SECURITY]: "log-security",
  [LOG_TYPES.EVENT]: "log-event",
  [LOG_TYPES.DANGER]: "log-danger",
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LogTicker({ logs }) {
  return (
    <section className="panel log-panel">
      <h2 className="panel-title">
        <span className="panel-title-icon">📡</span> Live Feed
      </h2>
      <div className="log-scroll">
        {logs.map((entry) => (
          <div key={entry.id} className={`log-entry ${TYPE_CLASS[entry.type] || "log-info"}`}>
            <span className="log-time">{formatTime(entry.timestamp)}</span>
            <span className="log-text">{entry.text}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="log-entry log-info">
            <span className="log-text">The floor is quiet... for now.</span>
          </div>
        )}
      </div>
    </section>
  );
}
