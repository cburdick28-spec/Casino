// src/utils/saveGame.js
// Per-account save/load for the sim's game state, backed by localStorage.
// A custom replacer/reviver round-trips Infinity (used for the unlimited-
// money account) since JSON.stringify would otherwise turn it into null.

const SAVE_PREFIX = "cybertycoon_save_v1_";

const INFINITY_SENTINEL = "__Infinity__";
const NEG_INFINITY_SENTINEL = "__-Infinity__";

function replacer(key, value) {
  if (value === Infinity) return INFINITY_SENTINEL;
  if (value === -Infinity) return NEG_INFINITY_SENTINEL;
  return value;
}

function reviver(key, value) {
  if (value === INFINITY_SENTINEL) return Infinity;
  if (value === NEG_INFINITY_SENTINEL) return -Infinity;
  return value;
}

function safeStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function keyFor(email) {
  return `${SAVE_PREFIX}${String(email || "").trim().toLowerCase()}`;
}

export function saveGameState(email, state) {
  const storage = safeStorage();
  if (!storage || !email) return;
  try {
    storage.setItem(keyFor(email), JSON.stringify(state, replacer));
  } catch (err) {
    console.warn("[saveGame] failed to save:", err);
  }
}

export function loadGameState(email) {
  const storage = safeStorage();
  if (!storage || !email) return null;
  try {
    const raw = storage.getItem(keyFor(email));
    if (!raw) return null;
    return JSON.parse(raw, reviver);
  } catch (err) {
    console.warn("[saveGame] failed to load:", err);
    return null;
  }
}

export function clearGameState(email) {
  const storage = safeStorage();
  if (!storage || !email) return;
  storage.removeItem(keyFor(email));
}
