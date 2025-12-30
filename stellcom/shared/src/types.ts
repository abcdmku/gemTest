export enum ResourceType {
  Metal = 'metal',
  Biomass = 'biomass',
  Energy = 'energy',
  Exotics = 'exotics'
}

export interface Resources {
  [ResourceType.Metal]: number;
  [ResourceType.Biomass]: number;
  [ResourceType.Energy]: number;
  [ResourceType.Exotics]: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Resources;
  research: Resources; // Surplus stored here as research points
  systems: string[]; // System IDs
  fleetsAvailable: number; // Fleets to place this turn
}

export enum SystemTier {
  Tier1 = 1, // Low resources
  Tier2 = 2,
  Tier3 = 3  // High resources (Homeworld candidate)
}

export interface System {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: SystemTier;
  production: Resources;
  owner: string | null; // Player ID
  fleets: number; // Number of fleets
  wormholes: string[]; // Connected System IDs
  defenseNet: boolean;
  terraformed: boolean;
  garrisonRequired: number; // Calculated based on links to hostile/neutral
}

export interface GameState {
  players: Record<string, Player>;
  systems: Record<string, System>;
  turn: number;
  phase: 'planning' | 'resolution';
  gameEnded: boolean;
}

export const GAME_CONFIG = {
  PROJECT_COST: 5,
  FLEET_COST: 1, // 1 of each resource implicitly via production min
  COMBAT_BASE_ROLL: 10,
  SYSTEM_COUNT: 20,
  MAP_WIDTH: 1000,
  MAP_HEIGHT: 1000
};
