# MC-Bot Control System — Setup Guide

A remote control system for a Minecraft AI bot. Run the bot on your Windows laptop,
control it from your Mac's browser.

---

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│       Mac (Dev)          │         │    Windows Laptop        │
│                          │  WiFi   │                          │
│  Browser Console ────────┼────────►│  Backend (port 3001)     │
│  (React + Vite)          │ Socket  │    ├─ Express            │
│                          │   IO    │    ├─ Socket.IO           │
│                          │         │    └─ Mineflayer Bot ──► Minecraft Server │
└──────────────────────────┘         └──────────────────────────┘
```

---

## Prerequisites

- **Node.js 18+** installed on BOTH machines (https://nodejs.org)
- **Minecraft Java Edition** on the Windows laptop
- Both machines on the **same local network** (WiFi or Ethernet)

---

## Step 1: Set Up a Minecraft Server (Windows)

You need a Minecraft server for the bot to join.

### Option A: Open to LAN (easiest)
1. Open Minecraft Java Edition
2. Create/load a world
3. Press **Esc** → **Open to LAN**
4. Choose settings → click **Start LAN World**
5. Note the port number shown in chat (e.g., `54321`)

### Option B: Dedicated Server
1. Download the server jar from https://www.minecraft.net/en-us/download/server
2. Run it: `java -jar server.jar`
3. Accept the EULA in `eula.txt`
4. Server runs on port `25565` by default

---

## Step 2: Install & Run the Backend (Windows)

Open a terminal (PowerShell or Command Prompt) on your Windows laptop:

```bash
# Navigate to the project
cd path\to\mc-bot\backend

# Install dependencies
npm install

# Start the server
npm start
```

You should see:
```
========================================
  MC-Bot Backend running on port 3001
  Local:   http://localhost:3001
  Network: http://<YOUR_WINDOWS_IP>:3001
========================================
```

### Find your Windows IP address:
```bash
ipconfig
```
Look for `IPv4 Address` under your WiFi adapter (e.g., `192.168.1.105`).

---

## Step 3: Install & Run the Frontend (Mac)

Open a terminal on your Mac:

```bash
# Navigate to the project
cd path/to/mc-bot/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## Step 4: Connect Mac → Windows

1. In the browser console, find the **Backend Server** field in the sidebar
2. Enter your Windows IP and port: `192.168.1.105:3001`
3. Click **Connect**
4. The connection indicator should turn green

---

## Step 5: Start the Bot

1. In the **Minecraft Server** section:
   - **Host**: `localhost` (since the bot runs on the same Windows machine)
   - **Port**: `25565` (or the LAN port from Step 1)
   - **Username**: `AIWorker` (or any name)
2. Click **Start Bot**
3. You should see logs appearing: "Connecting…", "Bot spawned in world!"

---

## Step 6: Windows Firewall Setup

If the Mac can't connect to the Windows backend:

### Allow port 3001 through Windows Firewall:

1. Open **Windows Defender Firewall** → **Advanced Settings**
2. Click **Inbound Rules** → **New Rule**
3. Choose **Port** → **TCP** → Specific port: `3001`
4. Allow the connection → apply to all profiles
5. Name it: `MC-Bot Backend`

### Or via PowerShell (Run as Admin):
```powershell
New-NetFirewallRule -DisplayName "MC-Bot Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

---

## Using the Console

### Commands
| Command | Description |
|---------|-------------|
| `say <msg>` | Send a chat message |
| `jump` | Jump once |
| `goto <x> <y> <z>` | Navigate to coordinates |
| `follow <player>` | Follow a player |
| `stop` | Stop all movement |
| `look` | Look in a random direction |
| `attack` | Attack nearest mob |
| `status` | Show bot health/position |
| `players` | List online players |
| `inventory` | Show inventory contents |
| `auto` | Toggle autonomous wander mode |
| `help` | Show all commands |

### Tips
- Use **Arrow Up/Down** to cycle through command history
- The bot auto-reconnects if it gets disconnected
- Autonomous mode starts by default — use `auto` to toggle it off

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect from Mac | Check Windows firewall, verify IP address, ensure same network |
| Bot can't join server | Verify Minecraft server is running, check host/port |
| "Invalid version" error | Update the `version` field in `backend/src/bot.js` to match your server |
| Bot gets kicked | Server may require online-mode auth — set `online-mode=false` in `server.properties` |

---

## Project Structure

```
mc-bot/
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js          # Express + Socket.IO server
│       ├── bot.js            # Mineflayer bot lifecycle
│       ├── commands.js       # Command parser & executor
│       └── autonomous.js     # Autonomous wander/jump/look loop
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Main app with socket connection
│       ├── App.css           # Dark theme styles
│       └── components/
│           ├── ConnectPanel.jsx   # Server/bot connection controls
│           ├── StatusPanel.jsx    # Health, food, position display
│           ├── LogPanel.jsx       # Live scrolling log viewer
│           └── CommandInput.jsx   # Command input with history
└── SETUP.md
```

---

## Future Upgrades (v2 Ideas)

- **Block mining/building** — send build commands remotely
- **Chat AI** — integrate an LLM so the bot can respond to in-game chat
- **Inventory management** — equip armor, eat food, craft items
- **Multi-bot support** — spawn and control multiple bots
- **Map view** — render bot position on a 2D map in the browser
- **Task queue** — schedule sequences of commands
- **Recording & playback** — record bot actions and replay them
- **Authentication** — add login to the web console for security
