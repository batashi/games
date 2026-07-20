# 🎮 Omani Kids Web Game Platform

A collection of culturally-themed web games for Omani children (ages 7–12), playable on computers and tablets. Built with vanilla HTML, CSS, and JavaScript ES modules.

## 🚀 Quick Start

Because the project uses ES modules, you need to serve it over HTTP:

```bash
cd /root
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## 🎯 Current Game Catalogue

| # | Game | Status | Mode |
|---|------|--------|------|
| 1 | Frankincense Collector Adventure | ✅ Implemented | Single-player |
| 2 | Omani Tic Tac Toe (X-O) | ✅ Implemented | Single + Online 1v1 |
| 3 | Fort Archers Battle | ✅ Implemented | Single + Online 1v1 |
| 4 | Camel Race in the Eastern Sands | 🔜 Coming Soon | — |
| 5 | Omani Sweets Catcher | 🔜 Coming Soon | — |
| 6 | Castles & Forts Challenge | 🔜 Coming Soon | — |
| 7 | Wadi Shaik / Salalah Explorer | 🔜 Coming Soon | — |
| 8 | The Lost Dagger Puzzle | 🔜 Coming Soon | — |
| 9 | Heritage Memory Challenge | 🔜 Coming Soon | — |
| 10 | Beach Football — Soor | 🔜 Coming Soon | — |
| 11 | Nakhal Fort Guard | 🔜 Coming Soon | — |
| 12 | Traditional Boat Race (Mwash) | 🔜 Coming Soon | — |
| 13 | Green Mountain Farmer | 🔜 Coming Soon | — |
| 14 | Words & Capitals Challenge | 🔜 Coming Soon | — |
| 15 | Junior Knights Sudoku | 🔜 Coming Soon | — |
| 16 | Mountain Rally Fan | 🔜 Coming Soon | — |
| 17 | Omani Falaj Maze | 🔜 Coming Soon | — |
| 18 | Omani Balloon Pop | 🔜 Coming Soon | — |
| 19 | Muttrah Fishing Challenge | 🔜 Coming Soon | — |
| 20 | Pottery Maker | 🔜 Coming Soon | — |

## 🎮 Game Development Notes

Detailed status for the games that have been started.

### 1. Frankincense Collector Adventure
- **Idea:** An endless runner where a child collects frankincense while jumping over desert obstacles in an Omani valley.
- **Achieved:** Full game loop, keyboard (Arrow Up / Space) and touch controls, scoring, increasing speed, restart after game over, sound effects.
- **Pending:** Online multiplayer, power-ups, themed biomes.

### 2. Omani Tic Tac Toe (X-O)
- **Idea:** Classic X-O with an Omani dagger-and-sword theme, playable against AI or a friend online.
- **Achieved:** Single-player vs simple AI, online 1v1 via PeerJS, 4-digit room codes, quick emoji reactions, turn handling, win/draw detection, restart.
- **Pending:** Move animations, AI difficulty levels, match history.

### 3. Fort Archers Battle
- **Idea:** Two Omani forts face each other across the screen; each player controls an archer and tries to destroy the enemy fort first.
- **Achieved:** Drag-to-aim (works outside the canvas) and keyboard controls, arrow physics with gravity, fort visuals and health bars, AI opponent in single-player, online 1v1 with shot and damage synchronization, fullscreen support.
- **Pending:** Destructible fort blocks, wind/obstacles, power-ups, mobile virtual aim controls.

### Coming Soon Games
The remaining 17 games are listed in the catalogue above. Each will get its own development note once work starts.

## 🌐 Online Multiplayer

Online games use **PeerJS (WebRTC)** through the public `0.peerjs.com` broker — no dedicated server is required.

1. Pick a game that supports online play.
2. Choose **"Play with a Friend"**.
3. **Host:** click **Create Room** and share the 4-digit code.
4. **Guest:** enter the code and click **Join**.
5. Once connected, the battle begins.

For child safety, there is **no free text chat**. Players can only send quick emoji reactions (👍, 😃, 👏, 🏆).

## 🕹️ Controls

- **Runner:** Arrow Up / Space to jump, Arrow Down to duck. Touch buttons appear on tablets.
- **Tic Tac Toe:** Click or tap a cell to place your mark.
- **Fort Archers:** Drag from your archer toward the enemy fort to aim, then release to shoot. You can drag outside the canvas. Arrow keys + Space work too.
- **Fullscreen:** Use the ⛶ button in the header.
- **Mute:** Use the 🔊 button in the header.

## 📁 Project Structure

```
/root
├── index.html          # Main page structure
├── styles.css          # Responsive, RTL-ready styles
├── README.md           # This file
├── mastergame          # Original requirements document
├── js/
│   ├── app.js          # App orchestration
│   ├── config.js       # Game catalogue & constants
│   ├── state.js        # Shared state & DOM refs
│   ├── utils.js        # Audio, confetti, helpers
│   ├── network.js      # PeerJS multiplayer manager
│   ├── ui.js           # Grid, modals, navigation
│   └── games/
│       ├── runner.js   # Endless runner
│       ├── tictactoe.js # X-O game
│       └── fortBattle.js # Fort-vs-fort archery
```

## 🏗️ Architecture & Best Practices

- **ES Modules:** Code is split by responsibility (UI, network, each game). No build step is needed.
- **Separation of Concerns:** Games do not directly touch PeerJS; they receive/send messages through `network.js`.
- **State Management:** One shared state object keeps the app predictable.
- **Fixed Canvas for Networked Games:** The fort battle uses a fixed internal resolution so arrow positions sync consistently between players.
- **Responsive Design:** CSS Grid, Flexbox, and touch-friendly controls work on both desktop and tablet.
- **Child-Safe Chat:** Only pre-defined emoji reactions; no free text.
- **Progressive Enhancement:** No external dependencies except PeerJS and Google Fonts.

## 🛠️ Tech Stack

- HTML5
- CSS3 (custom properties, Grid, Flexbox)
- Vanilla JavaScript (ES modules)
- PeerJS for WebRTC multiplayer
- Web Audio API for generated sound effects

## 🗺️ Roadmap

- Implement the remaining 17 games as placeholders are filled in.
- Add a self-hosted PeerJS server option for production stability.
- Add score persistence and simple player profiles.

## 📝 Notes

- The public PeerJS cloud broker is used for easy testing. For a production launch, consider running your own PeerServer.
- Open the browser console for connection/debug logs when testing multiplayer.
