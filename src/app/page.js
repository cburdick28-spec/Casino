"use client";

// src/app/page.js
// Top-level dashboard: wires useGameLoop's state/actions into the
// presentational components. This file intentionally contains no
// simulation logic of its own — it's pure layout + prop wiring.
//
// Auth gate: nothing renders until an account is signed in (see
// src/utils/auth.js and src/components/AuthPanel.js). Session persists
// across reloads via localStorage.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useGameLoop } from "@/hooks/useGameLoop";
import { unlockAudio } from "@/utils/audio";
import { getSession, signOut } from "@/utils/auth";
import AuthPanel from "@/components/AuthPanel";
import TopBar from "@/components/TopBar";
import FloorPanel from "@/components/FloorPanel";
import ShopPanel from "@/components/ShopPanel";
import LogTicker from "@/components/LogTicker";
import EventModal from "@/components/EventModal";
import GameOverModal from "@/components/GameOverModal";

// three.js/WebGL needs the browser — load it client-only, with a plain
// fallback while the chunk fetches so the rest of the dashboard isn't
// blocked waiting on it.
const FloorMap3D = dynamic(() => import("@/components/FloorMap3D"), {
  ssr: false,
  loading: () => <div className="floor3d-loading">Booting 3D renderer…</div>,
});

export default function HomePage() {
  const [email, setEmail] = useState(null);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    setEmail(getSession());
    setCheckedSession(true);
  }, []);

  function handleSignOut() {
    signOut();
    setEmail(null);
  }

  // Avoid a flash of the auth form while we check localStorage for a
  // pre-existing session on first mount.
  if (!checkedSession) return null;

  if (!email) {
    return <AuthPanel onAuthenticated={setEmail} />;
  }

  return <Dashboard email={email} onSignOut={handleSignOut} />;
}

function Dashboard({ email, onSignOut }) {
  const { state, actions, helpers } = useGameLoop(email);
  const [show3D, setShow3D] = useState(true);

  return (
    <main className="app-root" onClick={unlockAudio}>
      <TopBar
        cash={state.cash}
        reputation={state.reputation}
        day={state.day}
        cheaterCount={state.cheaters.length}
        email={email}
        unlimitedMoney={state.unlimitedMoney}
        onSignOut={onSignOut}
      />

      <section className="panel floor3d-panel">
        <div className="floor3d-panel-header">
          <h2 className="panel-title floor3d-panel-title">
            <span className="panel-title-icon">🧊</span> 3D Floor Map
          </h2>
          <button
            type="button"
            className="btn btn-primary floor3d-toggle"
            onClick={() => setShow3D((v) => !v)}
          >
            {show3D ? "Hide 3D view" : "Show 3D view"}
          </button>
        </div>
        {show3D && (
          <FloorMap3D games={state.games} cheaters={state.cheaters} security={state.security} />
        )}
      </section>

      <div className="dashboard-grid">
        <ShopPanel
          games={state.games}
          security={state.security}
          cash={state.cash}
          onUpgradeCapacity={actions.upgradeCapacity}
          onUnlockGame={actions.unlockGame}
          onBuySecurityNode={actions.buySecurityNode}
          upgradeCost={helpers.upgradeCost}
          securityNodeCost={helpers.securityNodeCost}
        />

        <FloorPanel
          games={state.games}
          cheaters={state.cheaters}
          onEdgeChange={actions.setHouseEdge}
          onCatchCheater={actions.catchCheater}
        />

        <LogTicker logs={state.logs} />
      </div>

      <EventModal event={state.activeEvent} onChoose={actions.resolveEvent} />

      <GameOverModal
        gameOver={state.gameOver}
        reason={state.gameOverReason}
        day={state.day}
        stats={state.stats}
        onRestart={actions.restartGame}
      />
    </main>
  );
}
