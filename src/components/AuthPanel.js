"use client";

// src/components/AuthPanel.js
// Sign-up / sign-in gate shown before the casino dashboard loads.
// Accounts are stored client-side only (see src/utils/auth.js) — there is
// no backend, so this only ever gates a single browser/device.

import { useState } from "react";
import { signIn, signUp, isUnlimitedAccount } from "@/utils/auth";

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalized =
        mode === "signup" ? await signUp(email, password) : await signIn(email, password);
      onAuthenticated(normalized);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const previewingVip = isUnlimitedAccount(email);

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-glyph">▣</span>
          <span className="brand-text">
            CYBER-TYCOON <span className="brand-sub">// NEON CASINO</span>
          </span>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "signin" ? "auth-tab--active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "signup" ? "auth-tab--active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              required
              minLength={4}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
            />
          </label>

          {previewingVip && (
            <div className="auth-vip-hint">
              💎 This account gets <strong>unlimited money</strong>.
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? "Connecting…" : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="auth-footnote">
          Accounts are stored on this device only — no server, no backend. Your casino
          save is tied to your email on this browser.
        </p>
      </div>
    </div>
  );
}
