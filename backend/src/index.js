const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createBot, getBotState, destroyBot } = require('./bot');
const { handleCommand } = require('./commands');

const app = express();
const server = http.createServer(app);

// Allow connections from any origin (Mac browser on the local network)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', bot: getBotState() });
});

// ---- Socket.IO connection handling ----
io.on('connection', (socket) => {
  console.log(`[Server] Console connected: ${socket.id}`);

  // Send current bot state immediately on connect
  socket.emit('bot:state', getBotState());

  // Handle commands from the browser console
  socket.on('command', (text) => {
    console.log(`[Server] Command received: ${text}`);
    handleCommand(text, io);
  });

  // Handle bot start/stop from console
  socket.on('bot:start', (config) => {
    createBot(config, io);
  });

  socket.on('bot:stop', () => {
    destroyBot(io);
  });

  socket.on('disconnect', () => {
    console.log(`[Server] Console disconnected: ${socket.id}`);
  });
});

// ---- Start server ----
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  MC-Bot Backend running on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<YOUR_WINDOWS_IP>:${PORT}`);
  console.log(`========================================\n`);
});
