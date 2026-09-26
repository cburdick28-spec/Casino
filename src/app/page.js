"use client";

// src/app/page.js
// Top-level dashboard: wires useGameLoop's state/actions into the
// presentational components. This file intentionally contains no
// simulation logic of its own — it's pure layout + prop wiring.

import { useGameLoop } from "@/hooks/useGameLoop";
import { unlockAudio } from "@/utils/audio";
import TopBar from "@/components/TopBar";
import FloorPanel from "@/components/FloorPanel";
import ShopPanel from "@/components/ShopPanel";
import LogTicker from "@/components/LogTicker";
import EventModal from "@/components/EventModal";
import GameOverModal from "@/components/GameOverModal";

export default function HomePage() {
  const { state, actions, helpers } = useGameLoop();

  return (
    <main className="app-root" onClick={unlockAudio}>
      <TopBar
        cash={state.cash}
        reputation={state.reputation}
        day={state.day}
        cheaterCount={state.cheaters.length}
      />

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
