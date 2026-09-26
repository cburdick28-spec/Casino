"use client";

// src/components/EventModal.js
// Modal overlay for a random dynamic event. The simulation is paused
// (see useGameLoop) while this is open, forcing the player to decide.

export default function EventModal({ event, onChoose }) {
  if (!event) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card event-modal">
        <div className="modal-header">
          <span className="modal-icon">📰</span>
          <h3>{event.title}</h3>
        </div>
        <p className="modal-text">{event.text}</p>
        <div className="modal-choices">
          {event.choices.map((choice, idx) => (
            <button
              key={choice.label}
              className="btn btn-primary modal-choice-btn"
              onClick={() => onChoose(idx)}
            >
              {choice.label}
              <span className="modal-choice-effects">
                {choice.effects.cash ? (
                  <span className={choice.effects.cash > 0 ? "text-lime" : "text-magenta"}>
                    {choice.effects.cash > 0 ? "+" : ""}
                    {choice.effects.cash}$
                  </span>
                ) : null}
                {choice.effects.reputation ? (
                  <span className={choice.effects.reputation > 0 ? "text-cyan" : "text-magenta"}>
                    {" "}
                    {choice.effects.reputation > 0 ? "+" : ""}
                    {choice.effects.reputation} rep
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
