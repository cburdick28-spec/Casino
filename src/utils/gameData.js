// src/utils/gameData.js
// Central tuning constants and static definitions for Cyber-Tycoon: Neon Casino.
// Keeping every "magic number" here means useGameLoop.js stays readable and
// designers can rebalance the sim without touching engine logic.

export const STARTING_CASH = 10000;
export const STARTING_REPUTATION = 70;
export const TICK_MS = 2000; // one simulation tick every 2 seconds
export const MAX_LOG_ENTRIES = 60;

// --- Casino game modules -----------------------------------------------

export const GAME_DEFS = {
  slots: {
    key: "slots",
    name: "Neon Slots",
    icon: "🎰",
    baseCapacity: 15,
    baseUpkeep: 40,
    avgBet: 12,
    unlocked: true,
    unlockCost: 0,
    description: "Rows of glitching holo-reels. Cheap upkeep, low ceiling.",
  },
  blackjack: {
    key: "blackjack",
    name: "Holo-Blackjack",
    icon: "🃏",
    baseCapacity: 8,
    baseUpkeep: 90,
    avgBet: 35,
    unlocked: true,
    unlockCost: 0,
    description: "Projected dealers running perfect shuffle algorithms.",
  },
  roulette: {
    key: "roulette",
    name: "High-Roller Roulette",
    icon: "🎡",
    baseCapacity: 6,
    baseUpkeep: 150,
    avgBet: 60,
    unlocked: false,
    unlockCost: 4000,
    description: "A magnetic-levitation wheel for whales only.",
  },
};

// Capacity/upkeep growth per upgrade level, and cost curve for upgrading.
export const UPGRADE_CAPACITY_STEP = 4;
export const UPGRADE_UPKEEP_STEP_PCT = 0.18; // upkeep grows 18% per level
export function upgradeCost(level) {
  return Math.round(500 * Math.pow(1.6, level - 1));
}

// House edge bounds (percent)
export const HOUSE_EDGE_MIN = 1;
export const HOUSE_EDGE_MAX = 15;
export const HOUSE_EDGE_DEFAULT = 5;

// Reputation impact: edge above this "fair" threshold erodes reputation.
export const FAIR_EDGE_THRESHOLD = 6;
export const REP_DECAY_PER_EXCESS_EDGE = 0.02; // rep lost per tick per point of edge above threshold
export const REP_RECOVERY_BELOW_THRESHOLD = 0.05; // rep gained per tick per point of edge below threshold

// --- Security subsystem --------------------------------------------------

export const SECURITY_NODE_BASE_COST = 800;
export const SECURITY_NODE_COST_GROWTH = 1.5;
export const SECURITY_NODE_MITIGATION_PCT = 0.14; // each node adds 14% auto-catch chance (capped)
export const SECURITY_NODE_MITIGATION_CAP = 0.9;

export const CHEATER_BASE_SPAWN_CHANCE = 0.1; // per tick, scales with total guests
export const CHEATER_DRAIN_PER_TICK = 220; // cash drained per tick a cheater goes uncaught
export const CHEATER_MAX_LIFETIME_TICKS = 4; // cheater flees (and cashes out) after this many ticks
export const CHEATER_CAUGHT_BONUS = 150; // reputation-neutral cash recovered when player catches one manually

// --- Random dynamic events ------------------------------------------------
// Each event has a prompt and two-to-three choices. Effects are deltas
// applied to cash/reputation, or a modifier applied to a specific game.

export const EVENT_DEFS = [
  {
    id: "vip_whale",
    title: "VIP Whale Sighting",
    text: "A mysterious high-roller in a mirrored trenchcoat wants a private table with doubled limits. Let them in?",
    choices: [
      { label: "Roll out the red carpet", effects: { cash: 1200, reputation: 3 } },
      { label: "Politely decline (too risky)", effects: { cash: 0, reputation: 1 } },
    ],
  },
  {
    id: "power_flicker",
    title: "Grid Brownout",
    text: "The district's fusion grid is flickering. Divert reserve power to the floor, or save cash and dim the lights?",
    choices: [
      { label: "Divert power (costs cash)", effects: { cash: -600, reputation: 2 } },
      { label: "Dim the lights", effects: { cash: 0, reputation: -3 } },
    ],
  },
  {
    id: "press_expose",
    title: "Underground Press Exposé",
    text: "A neon-noir blogger is sniffing around your house-edge settings. Bribe them, or ride it out?",
    choices: [
      { label: "Bribe the blogger", effects: { cash: -900, reputation: 4 } },
      { label: "Ride it out", effects: { cash: 0, reputation: -6 } },
    ],
  },
  {
    id: "rival_raid",
    title: "Rival Casino Raid",
    text: "A rival corp is poaching your best dealers with signing bonuses. Counter-offer, or let them go?",
    choices: [
      { label: "Counter-offer (retain staff)", effects: { cash: -750, reputation: 1 } },
      { label: "Let them go", effects: { cash: 0, reputation: -2 } },
    ],
  },
  {
    id: "charity_gala",
    title: "Neon Charity Gala",
    text: "Local fixers ask you to host a charity night. Great PR, but the house takes a cut for a good cause.",
    choices: [
      { label: "Host the gala", effects: { cash: -400, reputation: 6 } },
      { label: "Skip it", effects: { cash: 0, reputation: -1 } },
    ],
  },
  {
    id: "black_market_chips",
    title: "Black-Market Chip Offer",
    text: "A fixer offers counterfeit-resistant chip stock at a discount, no questions asked.",
    choices: [
      { label: "Buy the chips", effects: { cash: -300, reputation: -2, cashBonusNextTick: 900 } },
      { label: "Stick to legit suppliers", effects: { cash: 0, reputation: 1 } },
    ],
  },
  {
    id: "streamer_shoutout",
    title: "Streamer Shoutout",
    text: "A viral streamer wants to feature your floor live. Comp their table, or charge full price?",
    choices: [
      { label: "Comp the table", effects: { cash: -250, reputation: 5 } },
      { label: "Charge full price", effects: { cash: 300, reputation: -1 } },
    ],
  },
];

export const EVENT_CHANCE_PER_TICK = 0.06;

// --- Audio event keys ------------------------------------------------------
export const SOUND = {
  PAYOUT: "payout",
  CHEATER_ALERT: "cheater_alert",
  UPGRADE: "upgrade",
  EVENT: "event",
  BUZZER: "buzzer",
};

// --- Log entry types (drive color coding in LogTicker) --------------------
export const LOG_TYPES = {
  INFO: "info",
  CASH_UP: "cash_up",
  CASH_DOWN: "cash_down",
  SECURITY: "security",
  EVENT: "event",
  DANGER: "danger",
};
