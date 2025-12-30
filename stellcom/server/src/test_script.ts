import { generateMap } from './game/mapGenerator';
import { calculateProduction } from './game/production';
import { ResourceType } from '@stellcom/shared';

console.log("Generating Map...");
const map = generateMap();
const systemIds = Object.keys(map);
console.log(`Generated ${systemIds.length} systems.`);

if (systemIds.length > 0) {
    const sampleSystem = map[systemIds[0]];
    console.log("Sample System:", sampleSystem);
} else {
    console.error("No systems generated!");
}

console.log("\nTesting Production Logic...");
const testProd = {
  [ResourceType.Metal]: 14,
  [ResourceType.Biomass]: 16,
  [ResourceType.Energy]: 18,
  [ResourceType.Exotics]: 14
};
console.log("Input:", testProd);
const result = calculateProduction(testProd);
console.log("Fleets:", result.fleets); // Should be 14
console.log("Surplus:", result.surplus); // Should be Metal 0, Bio 2, Energy 4, Exotics 0

if (result.fleets === 14 && result.surplus.energy === 4) {
  console.log("SUCCESS: Logic matches requirements.");
} else {
  console.error("FAILURE: Logic mismatch.");
}
