import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races, SpellOrigin } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { setSpellPresenceForPers } from "@/lib/actions/spell-actions";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("spell actions", () => {
  it("adds and removes a manual unprepared spell link", async () => {
    const user = await prisma.user.create({ data: { email: "spell-actions@golden.test", name: "Spell Actions Test User" } });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);
    const [race, characterClass, background, spell] = await Promise.all([
      raceByName(Races.HUMAN_2014), classByName(Classes.FIGHTER_2014), backgroundByName(BackgroundCategory.SOLDIER),
      prisma.spell.findFirstOrThrow({ select: { spellId: true } }),
    ]);
    const created = await createCharacter(minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }));
    if ("error" in created) throw new Error(created.error);

    await expect(setSpellPresenceForPers({ persId: created.persId, spellId: spell.spellId, present: true })).resolves.toEqual({ success: true, present: true });
    await expect(prisma.persSpell.findUniqueOrThrow({ where: { persId_spellId: { persId: created.persId, spellId: spell.spellId } } }))
      .resolves.toMatchObject({ origin: SpellOrigin.MANUAL, isPrepared: false });
    await expect(setSpellPresenceForPers({ persId: created.persId, spellId: spell.spellId, present: false })).resolves.toEqual({ success: true, present: false });
  });
});
