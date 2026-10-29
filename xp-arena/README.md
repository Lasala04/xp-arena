# XP Arena

A live quiz game for medical terminology, where every correct answer earns **XP toward your grade** and **coins for your avatar**. This is a high-fidelity prototype of the *XP Arena – Design a GBL Idea* pitch deck.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

- Open **http://localhost:5173** on the teacher's laptop and click **Host a game**.
- Students join from their phones on the same Wi-Fi: scan the QR code on the projector, or go to the address it shows and type the 6-digit PIN.
- No class handy? In the lobby, click **+ Add 5 demo players**. Simulated classmates join and answer. Open `http://localhost:5173/#/play` in a private window to play alongside them.

Production build (one port, serves the client and the game server):

```bash
npm run build
npm start          # http://localhost:3001  (set API_PORT to change it)
```

Other scripts: `npm run typecheck`, `npm test` (scoring rules).

## What's in the prototype

| Deck slide | Where it lives |
|---|---|
| 01 Learning objective: recall, decode, apply | `server/questions.ts`: 38 questions. A round ramps recall → decode → patient scenarios |
| 03 Game concept: room code, same timed question on every device | Host lobby with PIN and QR code. 20 s per question, 4 choices |
| 04 Session flow: Join → Answer → Review → Spend | Player screens. After every question, both screens show the term broken down (`cardi + o + logy`) |
| 05 Mechanics | `shared/scoring.ts`: up to 1,000 speed-scaled XP, +200 stacking streak bonus at 3 in a row, +1 grade point per 1,000 XP (cap +5 per term), 10 coins per correct answer, +25 for the top 3, top 5 after each question |
| 06 Rewards and customization | Locker & Coin Shop: avatars (doctor, nurse, lab tech, 3 mascots), skins, frames, nameplates, answer-card themes, victory emotes, color pickers, 3 loadouts, seasonal items unlocked by streaks |
| 07 Trade-off: speed rewards guessing | Grade bonus is capped, and the last question is an untimed review that pays a flat 1,000 |
| Teacher view | Class record: term XP, grade-bonus pips, accuracy against the 80% target, and a new-term reset |

## Stack

- **Node.js + TypeScript** throughout. `shared/` holds the types, scoring rules and shop catalog that both sides import.
- **Server:** Express (REST for profiles, shop, class record) and Socket.IO (live rooms). The server owns the clock and the scoring, so a client can't fake a fast answer.
- **Client:** React 18 + Vite. Hand-built SVG avatars, so every item and color combination renders live. No UI framework. Icons are Phosphor (`@phosphor-icons/react`), so there are no emoji in the interface.
- **Design system:** `src/styles/`, imported through `index.css` in this order: `tokens.css` → `base.css` → `components.css` → `screens/*.css` → `motion.css`.
  - **Brand:** the deck's ink, cream, violet and Bricolage Grotesque.
  - **Style:** the Vibrant & Block-based quiz style from the ui-ux-pro-max skill. That means solid edges and a hard ledge shadow.
  - **Themes:** phone screens follow the device's light/dark setting. The projector is always dark.
  - **Color rule:** every text/background pair passes 4.5:1. Coral and teal carry ink text, not white.
  - **Motion:** `prefers-reduced-motion` turns off confetti and decorative loops, and emotes fade in place instead of flying.
- **Persistence:** `data/store.json`. That's fine for a classroom prototype; swap `server/store.ts` for a database when needed. Live rooms are in memory.

## Prototype limits

- Players are identified by a random ID in the browser's localStorage. There are no accounts or passwords.
- One shared class record. There's no multi-class or teacher login yet.
- Restarting the server ends any live rooms (profiles and coins are kept).
