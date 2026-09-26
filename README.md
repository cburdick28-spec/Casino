# Cyber-Tycoon: Neon Casino

A browser-based cyberpunk casino management sim, built with **Next.js 14 (App Router)** and vanilla React state — no external game engine, no external audio assets (all sound effects are synthesized with the Web Audio API).

## Stack

- **Next.js 14** (App Router, `src/` directory)
- **React 18**, plain `useState`/`useEffect`/`useCallback` — no external state library
- Plain CSS (`src/app/globals.css`) — dark slate + neon cyan/magenta/lime synthwave theme
- Zero external media: all SFX generated on the fly in `src/utils/audio.js`

## Project structure

```
src/
  app/
    layout.js        Root layout, metadata
    page.js           Dashboard — wires useGameLoop into the components
    globals.css        Cyberpunk/synthwave theme
  components/
    TopBar.js          Sticky metrics bar (cash, reputation, day, cheaters)
    FloorPanel.js       Game module cards, house-edge sliders, catch-cheater buttons
    ShopPanel.js        Capacity upgrades, module unlocks, security nodes
    LogTicker.js        Scrolling live event feed
    EventModal.js       Random dynamic event decision modal
    GameOverModal.js    Bankruptcy / reputation-collapse end screen
  hooks/
    useGameLoop.js      The simulation engine — all game state + tick logic
  utils/
    gameData.js          Tunable constants, game/event definitions
    audio.js              Web Audio API synth chime engine
```

## Game mechanics

- Start with **$10,000**. Guests arrive every tick (every 2s) based on your **Reputation** and each module's capacity.
- Three modules: **Neon Slots**, **Holo-Blackjack**, **High-Roller Roulette** (roulette starts locked — unlock it from the Shop panel).
- Each module has a **House Edge slider (1%–15%)**. Higher edge = faster cash, but erodes Reputation over time; low edge slowly rebuilds it.
- **Cyber-Cheaters** spawn randomly and drain cash each tick until caught — either automatically by your **Security Nodes** (AI Bouncers/Cameras, each adding auto-catch chance) or manually by clicking the on-floor "Catch Cheater!" button.
- **Random dynamic events** pause the sim with a text decision that affects cash and/or reputation.
- Go bankrupt (cash ≤ -$2,500) or crash reputation to 0 and it's game over — reboot to try again.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

This is a standard Next.js App Router project — no special configuration needed.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset: **Next.js** (auto-detected). Build command `next build`, output handled automatically.
4. Deploy — no environment variables required.

Or via the CLI:

```bash
npm i -g vercel
vercel
```
