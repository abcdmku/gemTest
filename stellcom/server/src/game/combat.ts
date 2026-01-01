export interface CombatUnit {
  ownerId: string;
  count: number;
}

export interface CombatRound {
  roundNumber: number;
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
  attackerRemaining: number;
  defenderRemaining: number;
}

export interface CombatResult {
  systemId: string;
  attackerId: string;
  defenderId: string;
  winnerId: string;
  rounds: CombatRound[];
}

export function resolveCombat(
  systemId: string,
  attacker: CombatUnit,
  defender: CombatUnit
): CombatResult {
  const rounds: CombatRound[] = [];
  let attCount = attacker.count;
  let defCount = defender.count;

  let roundNum = 1;
  const HIT_THRESHOLD = 6; // Roll 6+ to hit (d10)

  while (attCount > 0 && defCount > 0) {
    const attRolls = [];
    const defRolls = [];
    let attHits = 0;
    let defHits = 0;

    // Attacker rolls
    for (let i = 0; i < attCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;
      attRolls.push(roll);
      if (roll >= HIT_THRESHOLD) attHits++;
    }

    // Defender rolls
    for (let i = 0; i < defCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;
      defRolls.push(roll);
      if (roll >= HIT_THRESHOLD) defHits++;
    }

    // Apply hits simultaneously
    const attLoss = defHits; // Defender hits attacker
    const defLoss = attHits; // Attacker hits defender

    attCount = Math.max(0, attCount - attLoss);
    defCount = Math.max(0, defCount - defLoss);

    rounds.push({
      roundNumber: roundNum++,
      attackerRolls: attRolls,
      defenderRolls: defRolls,
      attackerLosses: attLoss,
      defenderLosses: defLoss,
      attackerRemaining: attCount,
      defenderRemaining: defCount
    });

    // Tie-breaker or max rounds check could go here
    // Requirement says "Defender wins ties" (if both reach 0?)
    if (attCount === 0 && defCount === 0) {
        // Technically both died. But system ownership?
        // Usually defender holds if attackers are wiped out.
        // If defenders are wiped out, attacker takes it.
        // If both wiped out, system becomes neutral? Or defender holds ghost?
        // Let's say if both die, defender "wins" (keeps system but 0 fleets? or becomes neutral?)
        // Rule: "defender wins ties". Let's assume defender keeps control.
    }
  }

  return {
    systemId,
    attackerId: attacker.ownerId,
    defenderId: defender.ownerId,
    winnerId: attCount > 0 ? attacker.ownerId : defender.ownerId,
    rounds
  };
}
