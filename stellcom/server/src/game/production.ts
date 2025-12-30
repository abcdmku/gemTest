import { Resources, ResourceType } from '@stellcom/shared';

/**
 * Calculates fleets produced and surplus for research.
 * Rule [t.05]: Fleets = resource with lowest production.
 * Rule [t.09]: Surplus = Production - MinProduction (used for research).
 */
export function calculateProduction(production: Resources): { fleets: number, surplus: Resources } {
  const values = [
    production[ResourceType.Metal],
    production[ResourceType.Biomass],
    production[ResourceType.Energy],
    production[ResourceType.Exotics]
  ];

  const minProd = Math.min(...values);
  const fleets = minProd;

  const surplus: Resources = {
    [ResourceType.Metal]: production[ResourceType.Metal] - minProd,
    [ResourceType.Biomass]: production[ResourceType.Biomass] - minProd,
    [ResourceType.Energy]: production[ResourceType.Energy] - minProd,
    [ResourceType.Exotics]: production[ResourceType.Exotics] - minProd,
  };

  return { fleets, surplus };
}
