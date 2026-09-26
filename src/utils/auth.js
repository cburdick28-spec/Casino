// src/utils/auth.js
// Lightweight client-side account system.
//
// IMPORTANT: this app has no backend/database — it's a static Next.js
// site meant to run on Vercel. "Accounts" here are stored entirely in the
// browser's localStorage, per-device. Passwords are hashed (SHA-256, via
// the Web Crypto API) before storage so a raw password is never kept, but
// this is still NOT real production-grade auth (no server-side salting,
// no session tokens, no protection against someone else opening the same
// browser profile). It's meant to gate/personalize a casual browser game,
// not to protect anything sensitive.

const USERS_KEY = "cybertycoon_users_v1";
const SESSION_KEY = "cybertycoon_session_v1";

// The one account that gets unlimited funds — case-insensitive.
const UNLIMITED_MONEY_EMAIL = "cburdick28@brewstermadrid.com";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadUsers() {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Is this email the special account with unlimited money? */
export function isUnlimitedAccount(email) {
  return normalizeEmail(email) === UNLIMITED_MONEY_EMAIL;
}

/** Create a new account. Throws on invalid input or duplicate email. */
export async function signUp(email, password) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  if (!password || password.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const users = loadUsers();
  if (users[normalized]) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await hashPassword(password);
  users[normalized] = { email: normalized, passwordHash, createdAt: Date.now() };
  saveUsers(users);
  setSession(normalized);
  return normalized;
}

/** Sign in to an existing account. Throws on bad credentials. */
export async function signIn(email, password) {
  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const account = users[normalized];
  if (!account) {
    throw new Error("No account found for that email — sign up instead.");
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== account.passwordHash) {
    throw new Error("Incorrect password.");
  }
  setSession(normalized);
  return normalized;
}

export function setSession(email) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(SESSION_KEY, normalizeEmail(email));
}

/** Returns the logged-in account's email, or null. */
export function getSession() {
  const storage = safeStorage();
  if (!storage) return null;
  return storage.getItem(SESSION_KEY);
}

export function signOut() {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(SESSION_KEY);
}
