# XP Arena

A live, Kahoot-style quiz game for medical terminology (prefixes, suffixes and roots), built as a game-based learning (GBL) project. Every correct answer pays out twice: **XP** that counts toward the class grade, and **coins** for avatar cosmetics.

**Group:** Lasala · Jomoc · David · Ausan · Mayam

## What's in this repository

| Path | What it is |
|---|---|
| [`xp-arena/`](xp-arena/) | The high-fidelity prototype: Node.js + TypeScript, React + Vite, Socket.IO. Setup and features are in [its README](xp-arena/README.md). |
| [`XP Arena - Design a GBL Idea.pptx`](XP%20Arena%20-%20Design%20a%20GBL%20Idea.pptx) | The pitch deck the prototype is built from. |
| [`Progress1_XPArena.pdf`](Progress1_XPArena.pdf) | Progress Report 1 (October 22, 2026): tasks, roles, screenshots and issues. |

## Run it

Requires Node.js 20 or newer.

```bash
cd xp-arena
npm install
npm run dev
```

Open http://localhost:5173 and click **Host a game**. Students on the same Wi-Fi join by scanning the QR code on the projector. To try it alone, click **Add 5 demo players** in the lobby.
