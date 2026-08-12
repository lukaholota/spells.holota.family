type FlexibleGroup = { value?: number; choiceCount: number; groupName?: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Mirrors character.ts's normalizeASI/extractFlexibleGroups just enough to build valid
 * racialBonusChoiceSchema fixtures — not a copy of the production logic, only what's needed
 * to read how many abilities a given race/subrace ASI JSON expects the player to pick.
 */
export function flexibleGroupsFromAsi(asiJson: unknown, mode: "basic" | "tasha"): FlexibleGroup[] {
  if (!isRecord(asiJson)) return [];
  let container = isRecord(asiJson[mode]) ? (asiJson[mode] as Record<string, unknown>) : null;
  if (!container && mode === "basic" && isRecord(asiJson.tasha)) {
    const tasha = asiJson.tasha as Record<string, unknown>;
    if (isRecord(tasha.flexible)) container = { flexible: tasha.flexible };
  }
  const flexible = container && isRecord(container.flexible) ? (container.flexible as Record<string, unknown>) : null;
  const groups = flexible && Array.isArray(flexible.groups) ? (flexible.groups as FlexibleGroup[]) : [];
  return groups;
}

const ABILITY_ORDER = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;

/** Picks distinct abilities per group's choiceCount, in a fixed order, for reproducible fixtures. */
export function pickAbilitiesForGroups(groups: FlexibleGroup[]) {
  let cursor = 0;
  return groups.map((group, groupIndex) => {
    const selectedAbilities = ABILITY_ORDER.slice(cursor, cursor + group.choiceCount);
    cursor += group.choiceCount;
    return { groupIndex, choiceCount: group.choiceCount, selectedAbilities: [...selectedAbilities] };
  });
}
