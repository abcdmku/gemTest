import { Game } from './Game';
import { GameState, Player, System } from '@stellcom/shared';

export class SimpleAI {
  game: Game;
  playerId: string;

  constructor(game: Game, playerId: string) {
    this.game = game;
    this.playerId = playerId;
  }

  takeTurn() {
    const state = this.game.state;
    const player = state.players[this.playerId];
    if (!player) return;

    // 1. Identify owned systems
    const ownedSystems = player.systems.map(id => state.systems[id]);

    ownedSystems.forEach(sys => {
       if (sys.fleets > 1) {
           const fleetsToMove = Math.floor(sys.fleets * 0.5); // Move half
           if (fleetsToMove < 1) return;

           // Neighbors
           const neighbors = sys.wormholes.map(id => state.systems[id]);

           // Find best target
           let bestTarget: System | null = null;

           // Priority: Capture Neutral
           const neutrals = neighbors.filter(n => !n.owner);
           if (neutrals.length > 0) {
               bestTarget = neutrals[0];
           } else {
               // Attack Weak Enemy
               const enemies = neighbors.filter(n => n.owner && n.owner !== this.playerId);
               const weakEnemy = enemies.find(e => e.fleets < fleetsToMove);
               if (weakEnemy) {
                   bestTarget = weakEnemy;
               }
           }

           if (bestTarget) {
               this.game.submitOrder({
                   type: 'move',
                   playerId: this.playerId,
                   sourceId: sys.id,
                   targetId: bestTarget.id,
                   fleetCount: fleetsToMove
               });
           }
       }
    });
  }
}
