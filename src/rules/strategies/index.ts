import { rules2014Strategy } from "./rules2014";
import { rules2024Strategy } from "./rules2024";
import type { RulesetId, RulesStrategy } from "./types";

const STRATEGIES_BY_RULESET: Record<RulesetId, RulesStrategy> = {
  RULES_2014: rules2014Strategy,
  RULES_2024: rules2024Strategy,
};

export function getRulesStrategy(ruleset: RulesetId): RulesStrategy {
  return STRATEGIES_BY_RULESET[ruleset];
}

export type { OriginFeatRequirement, RulesetId, RulesStrategy } from "./types";
export { rules2014Strategy } from "./rules2014";
export { rules2024Strategy, Rules2024NotImplementedError } from "./rules2024";

