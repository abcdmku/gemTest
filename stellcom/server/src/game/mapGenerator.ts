import { System, SystemTier, ResourceType, Resources, GAME_CONFIG } from '@stellcom/shared';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(index: number): string {
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const suffixes = ['Prime', 'Major', 'Minor', 'Ceti', 'Eridani'];
  return `${prefixes[index % prefixes.length]} ${suffixes[index % suffixes.length]} ${Math.floor(index / prefixes.length) + 1}`;
}

function generateProduction(tier: SystemTier): Resources {
  // Tier 1: 1-3 total
  // Tier 2: 3-6 total
  // Tier 3: 6-10 total
  const multiplier = tier === SystemTier.Tier1 ? 1 : tier === SystemTier.Tier2 ? 2 : 4;

  return {
    [ResourceType.Metal]: randomInt(1, 3) * multiplier,
    [ResourceType.Biomass]: randomInt(1, 3) * multiplier,
    [ResourceType.Energy]: randomInt(1, 3) * multiplier,
    [ResourceType.Exotics]: randomInt(0, 2) * multiplier, // Exotics are rarer
  };
}

export function generateMap(): Record<string, System> {
  const systems: Record<string, System> = {};
  const systemIds: string[] = [];

  // 1. Create Systems
  for (let i = 0; i < GAME_CONFIG.SYSTEM_COUNT; i++) {
    const id = `sys_${i}`;
    // Random Tier
    const tierRoll = Math.random();
    let tier = SystemTier.Tier1;
    if (tierRoll > 0.7) tier = SystemTier.Tier2;
    if (tierRoll > 0.9) tier = SystemTier.Tier3;

    systems[id] = {
      id,
      name: generateName(i),
      x: randomInt(50, GAME_CONFIG.MAP_WIDTH - 50),
      y: randomInt(50, GAME_CONFIG.MAP_HEIGHT - 50),
      tier,
      production: generateProduction(tier),
      owner: null,
      fleets: 0,
      wormholes: [],
      defenseNet: false,
      terraformed: false,
      garrisonRequired: 0
    };
    systemIds.push(id);
  }

  // 2. Connect Systems (Wormholes)
  // Ensure graph is connected (Minimum Spanning Tree-ish or just random links)
  // Simple approach: Link to 2-3 nearest neighbors

  systemIds.forEach(sourceId => {
    const source = systems[sourceId];
    // Find distances
    const distances = systemIds
      .filter(id => id !== sourceId)
      .map(id => {
        const target = systems[id];
        const dist = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
        return { id, dist };
      })
      .sort((a, b) => a.dist - b.dist);

    // Connect to closest 2 (if not already connected)
    for (let i = 0; i < 2; i++) {
      const targetId = distances[i].id;
      if (!source.wormholes.includes(targetId)) {
        source.wormholes.push(targetId);
        systems[targetId].wormholes.push(sourceId);
      }
    }

    // Randomly connect distant one (g.10)
    if (Math.random() < 0.2) {
       const randomTarget = distances[randomInt(5, distances.length - 1)];
       if (randomTarget && !source.wormholes.includes(randomTarget.id)) {
         source.wormholes.push(randomTarget.id);
         systems[randomTarget.id].wormholes.push(sourceId);
       }
    }
  });

  return systems;
}
