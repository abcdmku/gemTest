import { io, Socket } from 'socket.io-client';
import type { GameState, Player } from '@stellcom/shared';

export interface GameContextType {
  socket: Socket | null;
  gameState: GameState | null;
  player: Player | null;
  joinGame: (name: string) => void;
  isConnected: boolean;
}

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3000');
  }
  return socket;
};
