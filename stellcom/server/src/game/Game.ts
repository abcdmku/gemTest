import { GameState, Player, System, GAME_CONFIG, ResourceType } from '@stellcom/shared';
import { generateMap } from './mapGenerator';
import { calculateProduction } from './production';
import { resolveCombat, CombatResult } from './combat';
import { SimpleAI } from './SimpleAI';

interface Order {
  type: 'move' | 'project' | 'place';
  playerId: string;
  sourceId?: string;
  targetId: string;
  fleetCount?: number;
  projectType?: string;
}

export class Game {
  state: GameState;
  orders: Order[] = [];
  combatResults: CombatResult[] = [];
  ais: SimpleAI[] = [];

  constructor() {
    this.state = {
      players: {},
      systems: generateMap(),
      turn: 1,
      phase: 'planning',
      gameEnded: false
    };
  }

  addPlayer(id: string, name: string, isAI = false): Player {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
    const color = colors[Object.keys(this.state.players).length % colors.length];

    // Assign a homeworld (Tier 3)
    let homeworldId = '';
    const systemIds = Object.keys(this.state.systems);
    // Try to find a Tier 3 system that is not owned and far from others (simple check)
    // For prototype, just pick first available Tier 3 or Tier 2
    for (const sysId of systemIds) {
      if (!this.state.systems[sysId].owner && this.state.systems[sysId].tier === 3) {
        homeworldId = sysId;
        break;
      }
    }
    // Fallback
    if (!homeworldId) {
      homeworldId = systemIds.find(id => !this.state.systems[id].owner) || '';
    }

    const player: Player = {
      id,
      name,
      color,
      resources: { metal: 0, biomass: 0, energy: 0, exotics: 0 },
      research: { metal: 0, biomass: 0, energy: 0, exotics: 0 },
      systems: [homeworldId],
      fleetsAvailable: 0
    };

    if (homeworldId) {
      this.state.systems[homeworldId].owner = id;
      this.state.systems[homeworldId].fleets = 10; // Starting fleets
    }

    this.state.players[id] = player;

    if (isAI) {
        this.ais.push(new SimpleAI(this, id));
    }

    return player;
  }

  removePlayer(id: string) {
    delete this.state.players[id];
    // Revert systems to neutral
    for (const sysId in this.state.systems) {
      if (this.state.systems[sysId].owner === id) {
        this.state.systems[sysId].owner = null;
        this.state.systems[sysId].fleets = 0;
      }
    }
  }

  submitOrder(order: Order) {
    // Basic validation
    if (this.state.phase !== 'planning') return;
    this.orders.push(order);
  }

  // Called when all players are ready (or timer ends)
  resolveTurn() {
    // AI Turns
    this.ais.forEach(ai => ai.takeTurn());

    this.state.phase = 'resolution';
    this.combatResults = [];

    // 0. Placement Phase (Handle 'place' orders)
    // Note: In this prototype, we'll auto-place fleets on homeworlds if not placed?
    // Or just let 'place' orders handle it.
    // For simplicity, let's auto-dump fleetsAvailable onto the first system (Homeworld) for everyone
    // so we don't need a UI for placement yet.
    for (const pid in this.state.players) {
        const p = this.state.players[pid];
        if (p.fleetsAvailable > 0 && p.systems.length > 0) {
            // Check for explicit placement orders? (Not implemented)
            // Auto-place on first system
            const targetSysId = p.systems[0];
            if (this.state.systems[targetSysId]) {
                this.state.systems[targetSysId].fleets += p.fleetsAvailable;
            }
            p.fleetsAvailable = 0;
        }
    }

    // 1. Production Phase
    this.processProduction();

    // 2. Movement Phase
    const movements: Record<string, { playerId: string, fleets: number }[]> = {};

    // Group moves by destination
    this.orders.forEach(order => {
      if (order.type === 'move' && order.sourceId && order.fleetCount) {
        const source = this.state.systems[order.sourceId];

        // Validate ownership and count
        if (source.owner !== order.playerId || source.fleets < order.fleetCount) return;

        // Deduct from source immediately (temporary, to prevent over-sending)
        source.fleets -= order.fleetCount;

        if (!movements[order.targetId]) movements[order.targetId] = [];
        movements[order.targetId].push({ playerId: order.playerId, fleets: order.fleetCount });
      }
    });

    // Apply movements
    for (const targetId in movements) {
      const targetSystem = this.state.systems[targetId];
      const incoming = movements[targetId];

      // Simple case: All incoming + current owner vs ?
      // If multiple players arrive, they fight.
      // Logic:
      // 1. Group fleets by player (incoming + existing owner)
      const fleetsByPlayer: Record<string, number> = {};

      if (targetSystem.owner) {
        fleetsByPlayer[targetSystem.owner] = (fleetsByPlayer[targetSystem.owner] || 0) + targetSystem.fleets;
      }

      incoming.forEach(inc => {
        fleetsByPlayer[inc.playerId] = (fleetsByPlayer[inc.playerId] || 0) + inc.fleets;
      });

      const playerIds = Object.keys(fleetsByPlayer);

      if (playerIds.length === 0) continue; // Should not happen

      if (playerIds.length === 1) {
        // Peaceful move / reinforcement
        const pid = playerIds[0];
        targetSystem.owner = pid;
        targetSystem.fleets = fleetsByPlayer[pid];
      } else {
        // Combat!
        // Identify Attacker vs Defender
        // Existing owner is defender. If no owner, random? Or first in list?
        // Logic: Sort by "isOwner" then random?
        // Let's assume owner is Defender. Everyone else attacks?
        // Multi-way combat is complex. Simplified: Battle Royale or Tournament.
        // Let's do: Strongest incoming vs Defender.
        // For prototype: Take first two different players and fight. Winner fights next.

        let currentOwnerId = targetSystem.owner;
        let currentFleets = currentOwnerId ? fleetsByPlayer[currentOwnerId] : 0;

        // Remove owner from list to process attackers
        const challengers = playerIds.filter(id => id !== currentOwnerId);

        for (const challengerId of challengers) {
            const challengerFleets = fleetsByPlayer[challengerId];

            // If no owner yet (neutral system scenario where 2 ppl arrive), first challenger becomes "temp defender"
            if (!currentOwnerId) {
                currentOwnerId = challengerId;
                currentFleets = challengerFleets;
                continue;
            }

            // Resolve Combat
            const result = resolveCombat(
                targetId,
                { ownerId: challengerId, count: challengerFleets }, // Attacker
                { ownerId: currentOwnerId, count: currentFleets }   // Defender
            );

            this.combatResults.push(result);

            // Winner keeps control
            currentOwnerId = result.winnerId;
            currentFleets = result.winnerId === challengerId ? result.rounds[result.rounds.length-1].attackerRemaining : result.rounds[result.rounds.length-1].defenderRemaining;
        }

        targetSystem.owner = currentOwnerId;
        targetSystem.fleets = currentFleets;
      }
    }

    // 3. Combat Phase (Handled inside movement for simplicity of "meeting at system")
    // Note: Stationary fleets are naturally defended in the above logic.

    // 4. Projects Logic (TODO)

    // 5. Garrison Check (Revert to Neutral if not enough fleets)
    this.checkGarrison();

    // 6. Cleanup
    this.orders = [];
    this.state.turn++;
    this.state.phase = 'planning';

    // Update player system lists
    this.updatePlayerSystems();
  }

  private updatePlayerSystems() {
     // Clear lists
     for (const pid in this.state.players) {
         this.state.players[pid].systems = [];
     }
     // Rebuild
     for (const sysId in this.state.systems) {
         const sys = this.state.systems[sysId];
         if (sys.owner && this.state.players[sys.owner]) {
             this.state.players[sys.owner].systems.push(sysId);
         }
     }
  }

  private checkGarrison() {
      // For each system, check neighbors. If neighbor is hostile/neutral, need 1 fleet per link.
      for (const sysId in this.state.systems) {
          const sys = this.state.systems[sysId];
          if (!sys.owner) continue;

          let required = 0;
          for (const targetId of sys.wormholes) {
              const neighbor = this.state.systems[targetId];
              if (neighbor.owner !== sys.owner) {
                  required++;
              }
          }
          sys.garrisonRequired = required;

          if (sys.fleets < required) {
              // Priority 5: Revert to unowned
              // Maybe give a grace period? Requirement says "can revert".
              // "If... falls below... may lose control".
              // Let's be strict for now: Revert immediately at end of turn.
              sys.owner = null;
              sys.fleets = 0; // Fleets disband/desert?
          }
      }
  }

  private processProduction() {
    for (const playerId in this.state.players) {
      const player = this.state.players[playerId];

      // Calculate total production from all systems
      const totalProd = {
        [ResourceType.Metal]: 0,
        [ResourceType.Biomass]: 0,
        [ResourceType.Energy]: 0,
        [ResourceType.Exotics]: 0
      };

      for (const sysId of player.systems) {
        const sys = this.state.systems[sysId];
        totalProd[ResourceType.Metal] += sys.production.metal;
        totalProd[ResourceType.Biomass] += sys.production.biomass;
        totalProd[ResourceType.Energy] += sys.production.energy;
        totalProd[ResourceType.Exotics] += sys.production.exotics;
      }

      const { fleets, surplus } = calculateProduction(totalProd);

      // Set fleets available for the NEXT planning phase
      player.fleetsAvailable = fleets;

      // Update Research with Surplus
      player.research.metal += surplus.metal;
      player.research.biomass += surplus.biomass;
      player.research.energy += surplus.energy;
      player.research.exotics += surplus.exotics;
    }
  }
}
