export type SkillProficiency = "NONE" | "HALF" | "PROFICIENT" | "EXPERTISE";

export type NormalizedSkillProficiency<Skill extends string> =
  | { type: "fixed"; skills: Skill[] }
  | { type: "choice"; choiceCount: number; options: Skill[] };

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function calculateSkillProficiencyBonus(
  proficiency: SkillProficiency,
  proficiencyBonus: number,
  hasJackOfAllTrades: boolean,
): number {
  if (proficiency === "EXPERTISE") return proficiencyBonus * 2;
  if (proficiency === "PROFICIENT") return proficiencyBonus;
  if (proficiency === "HALF" || hasJackOfAllTrades) return Math.floor(proficiencyBonus / 2);
  return 0;
}

export function calculateSavingThrowProficiencyBonus(
  isProficient: boolean,
  proficiencyBonus: number,
): number {
  return isProficient ? proficiencyBonus : 0;
}

export function normalizeSkillProficiencies<Skill extends string>(
  value: unknown,
  allSkills: readonly Skill[],
): NormalizedSkillProficiency<Skill> | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return { type: "fixed", skills: value.filter((skill): skill is Skill => allSkills.includes(skill as Skill)) };
  }

  if (typeof value !== "object") return null;

  const raw = value as { options?: unknown; choices?: unknown; choiceCount?: unknown; chooseAny?: unknown; any?: unknown };
  const anyCount = toFiniteNumber(raw.any);
  const choiceCount = toFiniteNumber(raw.choiceCount) ?? anyCount;
  const optionSource = Array.isArray(raw.options) ? raw.options : Array.isArray(raw.choices) ? raw.choices : [];
  const chooseAny = Boolean(raw.chooseAny) || optionSource.includes("ANY") || anyCount !== null;
  const options = chooseAny
    ? [...allSkills]
    : optionSource.filter((skill): skill is Skill => allSkills.includes(skill as Skill));

  if (choiceCount === null || choiceCount <= 0) return null;
  return { type: "choice", choiceCount: Math.max(0, Math.trunc(choiceCount)), options: options.length ? options : [...allSkills] };
}

function toFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
