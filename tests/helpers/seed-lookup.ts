import { prisma } from "@/lib/prisma";
import type {
  BackgroundCategory,
  Classes,
  Feats,
  Races,
  Subclasses,
  Subraces,
  Variants,
} from "@prisma/client";

const cache = new Map<string, unknown>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  const value = await load();
  cache.set(key, value);
  return value;
}

export function clearSeedLookupCache() {
  cache.clear();
}

export const raceByName = (name: Races) =>
  cached(`race:${name}`, () => prisma.race.findFirstOrThrow({ where: { name } }));

export const subraceByName = (name: Subraces) =>
  cached(`subrace:${name}`, () => prisma.subrace.findFirstOrThrow({ where: { name } }));

export const raceVariantByName = (name: Variants) =>
  cached(`raceVariant:${name}`, () => prisma.raceVariant.findFirstOrThrow({ where: { name } }));

export const classByName = (name: Classes) =>
  cached(`class:${name}`, () => prisma.class.findFirstOrThrow({ where: { name } }));

export const subclassByName = (classId: number, name: Subclasses) =>
  cached(`subclass:${classId}:${name}`, () =>
    prisma.subclass.findFirstOrThrow({ where: { classId, name } }),
  );

export const backgroundByName = (name: BackgroundCategory) =>
  cached(`background:${name}`, () => prisma.background.findFirstOrThrow({ where: { name } }));

export const featByName = (name: Feats) =>
  cached(`feat:${name}`, () =>
    prisma.feat.findFirstOrThrow({
      where: { name },
      include: { featChoiceOptions: { include: { choiceOption: true } } },
    }),
  );

/** Feat-choice-option ids for a feat, filtered by a predicate over the joined ChoiceOption row. */
export async function featChoiceOptionIds(
  name: Feats,
  matches: (choiceOption: Awaited<ReturnType<typeof featByName>>["featChoiceOptions"][number]["choiceOption"]) => boolean,
) {
  const feat = await featByName(name);
  return feat.featChoiceOptions
    .filter((fco) => matches(fco.choiceOption))
    .map((fco) => fco.choiceOptionId);
}

/** Class-choice-option ids granted at a given level (1 for creation-time coverage), optionally filtered further. */
export async function classChoiceOptionIdsAtLevel(
  classId: number,
  level: number,
  matches?: (choiceOption: { optionNameEng: string; effectKind: string | null }) => boolean,
) {
  const rows = await prisma.classChoiceOption.findMany({
    where: { classId, levelsGranted: { has: level } },
    include: { choiceOption: true },
  });
  return rows
    .filter((r) => (matches ? matches(r.choiceOption) : true))
    .map((r) => r.choiceOptionId);
}

export async function subclassChoiceOptionIdsAtLevel(
  subclassId: number,
  level: number,
  matches?: (choiceOption: { optionNameEng: string; effectKind: string | null }) => boolean,
) {
  const rows = await prisma.subclassChoiceOption.findMany({
    where: { subclassId, levelsGranted: { has: level } },
    include: { choiceOption: true },
  });
  return rows
    .filter((r) => (matches ? matches(r.choiceOption) : true))
    .map((r) => r.choiceOptionId);
}

export async function raceChoiceOptionsFor(raceId: number, subraceId?: number | null) {
  return prisma.raceChoiceOption.findMany({
    where: { raceId, ...(subraceId ? { subraceId } : {}) },
    orderBy: { optionId: "asc" },
  });
}

/** First subclass for a class, by id order — used instead of hardcoding a Subclasses enum member. */
export const firstSubclassForClass = (classId: number) =>
  cached(`firstSubclass:${classId}`, () =>
    prisma.subclass.findFirstOrThrow({ where: { classId }, orderBy: { subclassId: "asc" } }),
  );

/** First race variant for a race, by id order — used instead of hardcoding a Variants enum member. */
export const firstRaceVariantForRace = (raceId: number) =>
  cached(`firstRaceVariant:${raceId}`, () =>
    prisma.raceVariant.findFirstOrThrow({ where: { raceId }, orderBy: { raceVariantId: "asc" } }),
  );

export const firstSubraceForRace = (raceId: number) =>
  cached(`firstSubrace:${raceId}`, () =>
    prisma.subrace.findFirstOrThrow({ where: { raceId }, orderBy: { subraceId: "asc" } }),
  );
