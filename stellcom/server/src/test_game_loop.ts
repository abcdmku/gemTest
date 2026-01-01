import { Game } from './game/Game';
import { ResourceType } from '@stellcom/shared';

const game = new Game();
console.log("Game initialized.");

// Add Player
const p1 = game.addPlayer('p1', 'Player 1');
console.log("Player 1 added:", p1.systems);

// Add AI
const ai = game.addPlayer('ai', 'AI Bot', true);
console.log("AI added:", ai.systems);

// Mock initial fleets
const p1SysId = p1.systems[0];
game.state.systems[p1SysId].fleets = 20;
console.log(`Player 1 system ${p1SysId} has 20 fleets.`);

// Submit Order (Move to neighbor)
const neighborId = game.state.systems[p1SysId].wormholes[0];
console.log(`Moving 10 fleets to ${neighborId}...`);

game.submitOrder({
    type: 'move',
    playerId: p1.id,
    sourceId: p1SysId,
    targetId: neighborId,
    fleetCount: 10
});

// Resolve Turn
console.log("Resolving Turn...");
game.resolveTurn();

// Check Result
const neighbor = game.state.systems[neighborId];
console.log(`Neighbor ${neighborId} owner: ${neighbor.owner}, fleets: ${neighbor.fleets}`);

if (neighbor.owner === p1.id && neighbor.fleets === 10) {
    console.log("SUCCESS: Movement and Capture worked.");
} else {
    console.log("FAILURE: Movement failed.");
}

// Check AI Move
// AI should have moved if it had fleets > 1.
const aiSysId = ai.systems[0]; // Original home
// Assuming AI Home had 10 (default), it should move 5.
// Note: resolving turn might have changed system ownership if attacked?
// But P1 and AI are likely far apart.
console.log("AI Actions check...");
// We can't easily assert exactly where it went without traversing, but we can check if it submitted orders or state changed.
// Just logging for now.
console.log("Turn resolved.");
