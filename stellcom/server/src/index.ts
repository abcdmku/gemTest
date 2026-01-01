import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './game/Game';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const game = new Game();

// Add an AI player for testing
game.addPlayer('ai_1', 'HAL 9000', true);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', (name: string) => {
    const player = game.addPlayer(socket.id, name);
    socket.emit('player_info', player);
    io.emit('game_state', game.state);
  });

  socket.on('submit_order', (order: any) => {
    game.submitOrder(order);
    // In a real game we would check if all players are ready.
    // For prototype, let's just trigger turn if 'force_end_turn' or simple button
  });

  socket.on('end_turn', () => {
    // For prototype simple "End Turn" button triggers resolution immediately
    // or waits for everyone.
    // Let's implement: If all players signaled end turn (not implemented yet), OR force.
    // For now: Just Trigger Resolution if it's the only player or we want to force it.
    // Actually, let's just resolve immediately for single-player/prototype testing.
    game.resolveTurn();
    io.emit('game_state', game.state);
    if (game.combatResults.length > 0) {
       io.emit('combat_results', game.combatResults);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('game_state', game.state);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
