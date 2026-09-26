"use client";

// src/components/ShopPanel.js
// Upgrades: capacity upgrades per game, security node purchases, and
// unlocking locked game modules (e.g. High-Roller Roulette).

export default function ShopPanel({
  games,
  security,
  cash,
  onUpgradeCapacity,
  onUnlockGame,
  onBuySecurityNode,
  upgradeCost,
  securityNodeCost,
}) {
  const unlockedGames = Object.values(games).filter((g) => g.unlocked);
  const lockedGames = Object.values(games).filter((g) => !g.unlocked);
  const nextNodeCost = securityNodeCost(security.nodes);
  const mitigationPct = Math.min(90, Math.round(security.nodes * 14));

  return (
    <section className="panel shop-panel">
      <h2 className="panel-title">
        <span className="panel-title-icon">🛒</span> Upgrades
      </h2>

      <div className="shop-section">
        <h3 className="shop-subtitle">Capacity Upgrades</h3>
        {unlockedGames.map((game) => {
          const cost = upgradeCost(game.level);
          const canAfford = cash >= cost;
          return (
            <div key={game.key} className="shop-row">
              <div className="shop-row-info">
                <span className="shop-row-icon">{game.icon}</span>
                <span>
                  {game.name} <span className="text-dim">Lv.{game.level}</span>
                </span>
              </div>
              <button
                className={`btn ${canAfford ? "btn-primary" : "btn-disabled"}`}
                disabled={!canAfford}
                onClick={() => onUpgradeCapacity(game.key)}
              >
                +{4} Cap · ${cost}
              </button>
            </div>
          );
        })}
      </div>

      {lockedGames.length > 0 && (
        <div className="shop-section">
          <h3 className="shop-subtitle">Unlock Modules</h3>
          {lockedGames.map((game) => {
            const canAfford = cash >= game.unlockCost;
            return (
              <div key={game.key} className="shop-row">
                <div className="shop-row-info">
                  <span className="shop-row-icon">{game.icon}</span>
                  <span>{game.name}</span>
                </div>
                <button
                  className={`btn ${canAfford ? "btn-primary" : "btn-disabled"}`}
                  disabled={!canAfford}
                  onClick={() => onUnlockGame(game.key)}
                >
                  Unlock · ${game.unlockCost}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="shop-section">
        <h3 className="shop-subtitle">Security Nodes</h3>
        <p className="shop-hint">
          {security.nodes} node{security.nodes === 1 ? "" : "s"} deployed ·{" "}
          <span className="text-cyan">{mitigationPct}%</span> auto-catch chance
        </p>
        <div className="shop-row">
          <div className="shop-row-info">
            <span className="shop-row-icon">🤖</span>
            <span>AI Bouncer / Camera Node</span>
          </div>
          <button
            className={`btn ${cash >= nextNodeCost ? "btn-primary" : "btn-disabled"}`}
            disabled={cash < nextNodeCost}
            onClick={onBuySecurityNode}
          >
            Deploy · ${nextNodeCost}
          </button>
        </div>
      </div>
    </section>
  );
}
