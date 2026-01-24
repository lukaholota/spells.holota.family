
import { PersI } from "@/lib/types/model-types";

/**
 * Calculates all skills the character currently has, combining:
 * 1. Base skills from persisted character data (pers.skills)
 * 2. Skills selected in the current form session (formData.skills)
 * 3. Skills granted by background or other sources if available in data
 * 
 * @param pers - The existing character data
 * @param formData - The current form data (optional)
 * @returns Array of unique skill names (enums)
 */
export const getEffectiveSkills = (
  pers: PersI | null | undefined, 
  formData: Record<string, any> = {}
): string[] => {
  const skills = new Set<string>();

  // 1. From Pers (base skills)
  if (pers && pers.skills && Array.isArray(pers.skills)) {
     // Check if it's an array of strings or objects
     pers.skills.forEach((s: any) => {
         if (typeof s === 'string') {
             skills.add(s);
         } else if (s && typeof s === 'object') {
             if ('skill' in s && typeof s.skill === 'string') {
               skills.add(s.skill);
             } else if ('name' in s && typeof s.name === 'string') {
               skills.add(s.name);
             }
         }
     });
  }

  // 2. From FormData (Skills step)
  if (formData.skills && Array.isArray(formData.skills)) {
    formData.skills.forEach((skill: string) => {
        // Simple check if it looks like a skill enum
        if (typeof skill === 'string' && /^[A-Z_]+$/.test(skill)) {
             skills.add(skill);
        }
    });
  }
  
  // 3. Fallback/Legacy: check if pers has direct boolean flags or similar?
  // (Assuming Prisma model uses string[] for skills based on usage seen)

  return Array.from(skills);
};

export const getEffectiveExpertises = (
  pers: PersI | null | undefined,
  formData: Record<string, any> = {}
): string[] => {
    const expertises = new Set<string>();

    // From Pers (if stored)
    // Note: Database storage for expertise varies. Often it's in a JSON field or separate table.
    // If specific fields exist in PersI, use them.
    // For now, we rely heavily on formData for the active session.

     if (formData.expertiseSchema?.expertises && Array.isArray(formData.expertiseSchema.expertises)) {
      formData.expertiseSchema.expertises.forEach((exp: string) => expertises.add(exp));
    }

    return Array.from(expertises);
}

/**
 * Extracts skill enum value from optionNameEng
 * Handles formats like "Skill Expert Proficiency (ATHLETICS)" -> "ATHLETICS"
 * @param optionNameEng - The English option name
 * @returns The skill enum value or original string
 */
export const extractSkillFromOptionName = (optionNameEng: string): string => {
  // Try to extract skill from parentheses
  const match = optionNameEng.match(/\(([^)]+)\)\s*$/);
  if (match) {
    return match[1];
  }
  return optionNameEng;
};

export type ChoiceOptionSkillEffect = {
  kind: "SKILL_PROFICIENCY" | "SKILL_EXPERTISE";
  skill: string;
};

export const extractChoiceOptionSkillEffects = (choiceOption: any): ChoiceOptionSkillEffect[] => {
  const out: ChoiceOptionSkillEffect[] = [];
  if (!choiceOption) return out;

  const kind = String(choiceOption.effectKind ?? "").trim();
  const skill = String(choiceOption.effectSkill ?? "").trim();
  if ((kind === "SKILL_PROFICIENCY" || kind === "SKILL_EXPERTISE") && skill) {
    out.push({ kind: kind as ChoiceOptionSkillEffect["kind"], skill });
  }

  const effects = Array.isArray(choiceOption.effects) ? choiceOption.effects : [];
  for (const effect of effects) {
    const k = String(effect?.kind ?? "").trim();
    const s = String(effect?.skill ?? "").trim();
    if ((k === "SKILL_PROFICIENCY" || k === "SKILL_EXPERTISE") && s) {
      out.push({ kind: k as ChoiceOptionSkillEffect["kind"], skill: s });
    }
  }

  return out;
};

export const extractSkillsFromChoiceOption = (choiceOption: any): string[] => {
  const skills = new Set<string>();
  const effects = extractChoiceOptionSkillEffects(choiceOption);
  effects.forEach((e) => {
    skills.add(e.skill);
  });

  if (skills.size === 0) {
    const name = String(choiceOption?.optionNameEng ?? choiceOption?.optionName ?? "");
    const extracted = extractSkillFromOptionName(name);
    if (extracted && extracted !== "UNKNOWN") skills.add(extracted);
  }

  return Array.from(skills);
};

export const extractExpertisesFromChoiceOption = (choiceOption: any): string[] => {
  const skills = new Set<string>();
  const effects = extractChoiceOptionSkillEffects(choiceOption);
  effects.forEach((e) => {
    if (e.kind === "SKILL_EXPERTISE") skills.add(e.skill);
  });
  if (skills.size === 0) {
    const rawNameEng = String(choiceOption?.optionNameEng ?? "");
    const rawName = String(choiceOption?.optionName ?? "");
    const combined = `${rawNameEng} ${rawName}`.toLowerCase();
    if (combined.includes("expertise") || combined.includes("експертиза")) {
      const extracted = extractSkillFromOptionName(rawNameEng || rawName);
      if (extracted && extracted !== "UNKNOWN") skills.add(extracted);
    }
  }
  return Array.from(skills);
};
