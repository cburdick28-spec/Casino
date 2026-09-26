"use client";

// src/hooks/useGameLoop.js
// The core simulation engine for Cyber-Tycoon: Neon Casino.
// This hook owns all game state and exposes a small set of action
// callbacks. Components should be "dumb" — they read state from here and
// call these actions; they never mutate the sim themselves.

import { useCallback, useEffect, useRef, useState } from "react";
import { playSound } from "@/utils/audio";
import {
  STARTING_CASH,
  STARTING_REPUTATION,
  TICK_MS,
  MAX_LOG_ENTRIES,
  GAME_DEFS,
  UPGRADE_CAPACITY_STEP,
  UPGRADE_UPKEEP_STEP_PCT,
  upgradeCost,
  HOUSE_EDGE_MIN,
  HOUSE_EDGE_MAX,
  HOUSE_EDGE_DEFAULT,
  FAIR_EDGE_THRESHOLD,
  REP_DECAY_PER_EXCESS_EDGE,
  REP_RECOVERY_BELOW_THRESHOLD,
  SECURITY_NODE_BASE_COST,
  SECURITY_NODE_COST_GROWTH,
  SECURITY_NODE_MITIGATION_PCT,
  SECURITY_NODE_MITIGATION_CAP,
  CHEATER_BASE_SPAWN_CHANCE,
  CHEATER_DRAIN_PER_TICK,
  CHEATER_MAX_LIFETIME_TICKS,
  CHEATER_CAUGHT_BONUS,
  EVENT_DEFS,
  EVENT_CHANCE_PER_TICK,
  SOUND,
  LOG_TYPES,
} from "@/utils/gameData";

const TICKS_PER_DAY = 6;

// --- Helpers ---------------------------------------------------------------

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function makeInitialGames() {
  const games = {};
  Object.values(GAME_DEFS).forEach((def) => {
    games[def.key] = {
      key: def.key,
      name: def.name,
      icon: def.icon,
      description: def.description,
      unlocked: def.unlocked,
      unlockCost: def.unlockCost,
      avgBet: def.avgBet,
      level: 1,
      capacity: def.baseCapacity,
      upkeep: def.baseUpkeep,
      houseEdge: HOUSE_EDGE_DEFAULT,
      guests: 0,
      lastNet: 0,
      lifetimeRevenue: 0,
    };
  });
  return games;
}

function makeInitialState() {
  return {
    cash: STARTING_CASH,
    reputation: STARTING_REPUTATION,
    day: 1,
    tickCount: 0,
    gameOver: false,
    gameOverReason: "",
    games: makeInitialGames(),
    security: {
      nodes: 0,
    },
    cheaters: [],
    activeEvent: null,
    logs: [
      {
        id: "log-init",
        text: "Neon Casino powers up. Welcome to the floor, Boss.",
        type: LOG_TYPES.INFO,
        timestamp: Date.now(),
      },
    ],
    stats: {
      totalGuestsServed: 0,
      totalRevenue: 0,
      totalUpkeepPaid: 0,
      cheatersCaught: 0,
      cheatersFled: 0,
    },
  };
}

let logIdCounter = 1;
function nextLogId() {
  logIdCounter += 1;
  return `log-${Date.now()}-${logIdCounter}`;
}

let cheaterIdCounter = 1;
function nextCheaterId() {
  cheaterIdCounter += 1;
  return `cheater-${Date.now()}-${cheaterIdCounter}`;
}

function pushLog(logs, text, type = LOG_TYPES.INFO) {
  const entry = { id: nextLogId(), text, type, timestamp: Date.now() };
  const next = [entry, ...logs];
  if (next.length > MAX_LOG_ENTRIES) next.length = MAX_LOG_ENTRIES;
  return next;
}

// --- The hook ---------------------------------------------------------------

export function useGameLoop() {
  const [state, setState] = useState(makeInitialState);
  const intervalRef = useRef(null);
  const pausedRef = useRef(false);

  // Simulation is paused while an event modal is open or the game has ended.
  useEffect(() => {
    pausedRef.current = Boolean(state.activeEvent) || state.gameOver;
  }, [state.activeEvent, state.gameOver]);

  // --- The main tick ------------------------------------------------------
  const runTick = useCallback(() => {
    setState((prev) => {
      if (prev.gameOver || prev.activeEvent) return prev;

      let cash = prev.cash;
      let reputation = prev.reputation;
      let logs = prev.logs;
      const stats = { ...prev.stats };
      const games = {};
      let cheatersThisTick = [...prev.cheaters];
      let totalActiveGuests = 0;

      // 1. Simulate each unlocked game module.
      Object.values(prev.games).forEach((game) => {
        if (!game.unlocked) {
          games[game.key] = game;
          return;
        }

        const demandFactor = clamp(reputation / 100, 0.15, 1.3);
        const variance = randRange(0.7, 1.15);
        const guests = Math.round(
          clamp(game.capacity * demandFactor * variance, 0, game.capacity)
        );
        totalActiveGuests += guests;

        const edgeFactor = game.houseEdge / 100;
        const revenue = guests * game.avgBet * edgeFactor * randRange(0.85, 1.25);
        const net = revenue - game.upkeep;

        cash += net;
        stats.totalRevenue += Math.max(0, revenue);
        stats.totalUpkeepPaid += game.upkeep;
        stats.totalGuestsServed += guests;

        games[game.key] = {
          ...game,
          guests,
          lastNet: Math.round(net),
          lifetimeRevenue: game.lifetimeRevenue + Math.max(0, revenue),
        };
      });

      if (totalActiveGuests > 0) {
        playSound(SOUND.PAYOUT);
      }

      // 2. Reputation drift from house-edge greed (or fairness).
      Object.values(games).forEach((game) => {
        if (!game.unlocked) return;
        if (game.houseEdge > FAIR_EDGE_THRESHOLD) {
          reputation -= (game.houseEdge - FAIR_EDGE_THRESHOLD) * REP_DECAY_PER_EXCESS_EDGE;
        } else {
          reputation += (FAIR_EDGE_THRESHOLD - game.houseEdge) * REP_RECOVERY_BELOW_THRESHOLD;
        }
      });
      reputation = clamp(reputation, 0, 100);

      // 3. Cheater spawn roll — more guests, more temptation.
      const unlockedGames = Object.values(games).filter((g) => g.unlocked);
      const spawnChance =
        CHEATER_BASE_SPAWN_CHANCE * clamp(totalActiveGuests / 10, 0.3, 2.5);
      if (unlockedGames.length > 0 && Math.random() < spawnChance) {
        const target = unlockedGames[Math.floor(Math.random() * unlockedGames.length)];
        const cheater = {
          id: nextCheaterId(),
          gameKey: target.key,
          gameName: target.name,
          ticksAlive: 0,
        };
        cheatersThisTick = [...cheatersThisTick, cheater];
        logs = pushLog(
          logs,
          `⚠ Cyber-Cheater detected rigging ${target.name}!`,
          LOG_TYPES.DANGER
        );
        playSound(SOUND.CHEATER_ALERT);
      }

      // 4. Resolve existing cheaters (auto-mitigation vs drain vs fleeing).
      const mitigationChance = clamp(
        prev.security.nodes * SECURITY_NODE_MITIGATION_PCT,
        0,
        SECURITY_NODE_MITIGATION_CAP
      );
      const survivors = [];
      cheatersThisTick.forEach((cheater) => {
        const autoCaught = Math.random() < mitigationChance;
        if (autoCaught) {
          stats.cheatersCaught += 1;
          logs = pushLog(
            logs,
            `🛡 Security Nodes auto-caught a cheater at ${cheater.gameName}.`,
            LOG_TYPES.SECURITY
          );
          return; // removed from the floor
        }

        const ticksAlive = cheater.ticksAlive + 1;
        cash -= CHEATER_DRAIN_PER_TICK;
        logs = pushLog(
          logs,
          `💸 Cheater drained $${CHEATER_DRAIN_PER_TICK} from ${cheater.gameName}.`,
          LOG_TYPES.CASH_DOWN
        );

        if (ticksAlive >= CHEATER_MAX_LIFETIME_TICKS) {
          stats.cheatersFled += 1;
          logs = pushLog(
            logs,
            `🏃 The cheater fled ${cheater.gameName} with their winnings.`,
            LOG_TYPES.DANGER
          );
          return; // fled, removed
        }

        survivors.push({ ...cheater, ticksAlive });
      });

      // 5. Random dynamic event roll (pauses the loop once shown).
      let activeEvent = null;
      if (Math.random() < EVENT_CHANCE_PER_TICK) {
        const def = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)];
        activeEvent = def;
        logs = pushLog(logs, `📰 Event: ${def.title}`, LOG_TYPES.EVENT);
        playSound(SOUND.EVENT);
      }

      // 6. Day/tick bookkeeping + bankruptcy check.
      const tickCount = prev.tickCount + 1;
      const day = 1 + Math.floor(tickCount / TICKS_PER_DAY);

      let gameOver = false;
      let gameOverReason = "";
      if (cash <= -2500) {
        gameOver = true;
        gameOverReason =
          "The corp repo squad shut down your casino over unpaid debts.";
        playSound(SOUND.BUZZER);
      } else if (reputation <= 0) {
        gameOver = true;
        gameOverReason =
          "Your reputation collapsed to zero — the district blacklisted your casino.";
        playSound(SOUND.BUZZER);
      }

      return {
        ...prev,
        cash: Math.round(cash * 100) / 100,
        reputation,
        day,
        tickCount,
        games,
        cheaters: survivors,
        activeEvent,
        logs,
        stats,
        gameOver,
        gameOverReason,
      };
    });
  }, []);

  // --- Interval management -------------------------------------------------
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        runTick();
      }
    }, TICK_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runTick]);

  // --- Actions ---------------------------------------------------------------

  const setHouseEdge = useCallback((gameKey, value) => {
    setState((prev) => {
      const game = prev.games[gameKey];
      if (!game) return prev;
      const clamped = clamp(Math.round(value), HOUSE_EDGE_MIN, HOUSE_EDGE_MAX);
      return {
        ...prev,
        games: {
          ...prev.games,
          [gameKey]: { ...game, houseEdge: clamped },
        },
      };
    });
  }, []);

  const upgradeCapacity = useCallback((gameKey) => {
    setState((prev) => {
      const game = prev.games[gameKey];
      if (!game || !game.unlocked) return prev;
      const cost = upgradeCost(game.level);
      if (prev.cash < cost) {
        return {
          ...prev,
          logs: pushLog(
            prev.logs,
            `Not enough cash to upgrade ${game.name} (needs $${cost}).`,
            LOG_TYPES.DANGER
          ),
        };
      }
      playSound(SOUND.UPGRADE);
      return {
        ...prev,
        cash: Math.round((prev.cash - cost) * 100) / 100,
        logs: pushLog(
          prev.logs,
          `🔧 Upgraded ${game.name} to level ${game.level + 1}.`,
          LOG_TYPES.INFO
        ),
        games: {
          ...prev.games,
          [gameKey]: {
            ...game,
            level: game.level + 1,
            capacity: game.capacity + UPGRADE_CAPACITY_STEP,
            upkeep: Math.round(game.upkeep * (1 + UPGRADE_UPKEEP_STEP_PCT)),
          },
        },
      };
    });
  }, []);

  const unlockGame = useCallback((gameKey) => {
    setState((prev) => {
      const game = prev.games[gameKey];
      if (!game || game.unlocked) return prev;
      if (prev.cash < game.unlockCost) {
        return {
          ...prev,
          logs: pushLog(
            prev.logs,
            `Not enough cash to unlock ${game.name} (needs $${game.unlockCost}).`,
            LOG_TYPES.DANGER
          ),
        };
      }
      playSound(SOUND.UPGRADE);
      return {
        ...prev,
        cash: Math.round((prev.cash - game.unlockCost) * 100) / 100,
        logs: pushLog(prev.logs, `✨ Unlocked ${game.name}!`, LOG_TYPES.INFO),
        games: {
          ...prev.games,
          [gameKey]: { ...game, unlocked: true },
        },
      };
    });
  }, []);

  const buySecurityNode = useCallback(() => {
    setState((prev) => {
      const cost = Math.round(
        SECURITY_NODE_BASE_COST *
          Math.pow(SECURITY_NODE_COST_GROWTH, prev.security.nodes)
      );
      if (prev.cash < cost) {
        return {
          ...prev,
          logs: pushLog(
            prev.logs,
            `Not enough cash for another Security Node (needs $${cost}).`,
            LOG_TYPES.DANGER
          ),
        };
      }
      playSound(SOUND.UPGRADE);
      return {
        ...prev,
        cash: Math.round((prev.cash - cost) * 100) / 100,
        security: { ...prev.security, nodes: prev.security.nodes + 1 },
        logs: pushLog(
          prev.logs,
          `🤖 Deployed AI Bouncer Node #${prev.security.nodes + 1}.`,
          LOG_TYPES.SECURITY
        ),
      };
    });
  }, []);

  const catchCheater = useCallback((cheaterId) => {
    setState((prev) => {
      const cheater = prev.cheaters.find((c) => c.id === cheaterId);
      if (!cheater) return prev;
      playSound(SOUND.UPGRADE);
      return {
        ...prev,
        cash: Math.round((prev.cash + CHEATER_CAUGHT_BONUS) * 100) / 100,
        cheaters: prev.cheaters.filter((c) => c.id !== cheaterId),
        stats: { ...prev.stats, cheatersCaught: prev.stats.cheatersCaught + 1 },
        logs: pushLog(
          prev.logs,
          `👊 You personally caught a cheater at ${cheater.gameName} (+$${CHEATER_CAUGHT_BONUS}).`,
          LOG_TYPES.SECURITY
        ),
      };
    });
  }, []);

  const resolveEvent = useCallback((choiceIndex) => {
    setState((prev) => {
      if (!prev.activeEvent) return prev;
      const choice = prev.activeEvent.choices[choiceIndex];
      if (!choice) return prev;
      const effects = choice.effects || {};
      const cash =
        Math.round((prev.cash + (effects.cash || 0)) * 100) / 100;
      const reputation = clamp(
        prev.reputation + (effects.reputation || 0),
        0,
        100
      );
      return {
        ...prev,
        cash,
        reputation,
        activeEvent: null,
        logs: pushLog(
          prev.logs,
          `✅ Resolved "${prev.activeEvent.title}": ${choice.label}`,
          LOG_TYPES.EVENT
        ),
      };
    });
  }, []);

  const restartGame = useCallback(() => {
    setState(makeInitialState());
  }, []);

  return {
    state,
    actions: {
      setHouseEdge,
      upgradeCapacity,
      unlockGame,
      buySecurityNode,
      catchCheater,
      resolveEvent,
      restartGame,
    },
    helpers: {
      upgradeCost,
      securityNodeCost: (nodes) =>
        Math.round(
          SECURITY_NODE_BASE_COST * Math.pow(SECURITY_NODE_COST_GROWTH, nodes)
        ),
    },
  };
}
