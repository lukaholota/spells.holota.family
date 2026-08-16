// KR6.3 Крок 1 — доказ, що серверний фільтр за ruleset реально виключає RULES_2024-рядки.
//
// Стратегія фікстур: жодних нових рядків не вставляємо (enum-типи name на race/class/
// background/weapon/feat не мають вільних значень без схемних змін KR6.3 Крок 2). Замість
// цього беремо наявний рядок кожної таблиці, тимчасово перемикаємо його ruleset на
// RULES_2024, перевіряємо відсутність у відповіді фільтрованої функції, і повертаємо назад
// у finally — навіть якщо assert впаде. Контентні таблиці між тестами не труncуються
// (tests/user-data.ts чіпає лише pers/user/account), тому відкат обов'язковий.
import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase } from "../user-data";
import { loadCharacterCreatorOptions } from "@/server/db/creation-content";
import { getBaseEquipment } from "@/server/db/equipment-actions";
import { loadFightingStyleOptions } from "@/server/db/progression-content";
import { getSpellForModal, getSpellsList } from "@/server/db/spell-actions";
import { buildSpellsForGenerationQuery } from "../../scripts/generate-spells";
import { buildMagicItemsForGenerationQuery } from "../../scripts/generate-magic-items";

// levelup-content.ts wraps its queries in next/cache's unstable_cache — the same passthrough
// mock tests/golden/levelup/levelup.test.ts already uses, so a call in this test actually
// hits spells_test instead of serving a cached (pre-flip) result. equipment-actions.ts and
// spell-actions.ts pull in @/lib/auth transitively — same mock as that file too.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: <T>(fn: T) => fn }));

afterAll(disconnectDatabase);

async function withFlippedRuleset<T>(
  flip: () => Promise<unknown>,
  revert: () => Promise<unknown>,
  run: () => Promise<T>,
): Promise<T> {
  await flip();
  try {
    return await run();
  } finally {
    await revert();
  }
}

describe("KR6.3 Крок 1 — loadCharacterCreatorOptions", () => {
  it("виключає RULES_2024 рядок на кожній з 5 каталогових таблиць", async () => {
    const [race, characterClass, background, weapon, feat] = await Promise.all([
      prisma.race.findFirstOrThrow({ orderBy: { raceId: "asc" } }),
      prisma.class.findFirstOrThrow({ orderBy: { classId: "asc" } }),
      prisma.background.findFirstOrThrow({ orderBy: { backgroundId: "asc" } }),
      prisma.weapon.findFirstOrThrow({ orderBy: { weaponId: "asc" } }),
      prisma.feat.findFirstOrThrow({ orderBy: { featId: "asc" } }),
    ]);

    const flipAll = (ruleset: "RULES_2014" | "RULES_2024") =>
      Promise.all([
        prisma.race.update({ where: { raceId: race.raceId }, data: { ruleset } }),
        prisma.class.update({ where: { classId: characterClass.classId }, data: { ruleset } }),
        prisma.background.update({ where: { backgroundId: background.backgroundId }, data: { ruleset } }),
        prisma.weapon.update({ where: { weaponId: weapon.weaponId }, data: { ruleset } }),
        prisma.feat.update({ where: { featId: feat.featId }, data: { ruleset } }),
      ]);

    await withFlippedRuleset(
      () => flipAll("RULES_2024"),
      () => flipAll("RULES_2014"),
      async () => {
        const [races, classes, backgrounds, weapons, feats] = await loadCharacterCreatorOptions();

        expect(races.some((r) => r.raceId === race.raceId)).toBe(false);
        expect(classes.some((c) => c.classId === characterClass.classId)).toBe(false);
        expect(backgrounds.some((b) => b.backgroundId === background.backgroundId)).toBe(false);
        expect(weapons.some((w) => w.weaponId === weapon.weaponId)).toBe(false);
        expect(feats.some((f) => f.featId === feat.featId)).toBe(false);
      },
    );

    const [raceBack, classBack, backgroundBack, weaponBack, featBack] = await Promise.all([
      prisma.race.findUniqueOrThrow({ where: { raceId: race.raceId } }),
      prisma.class.findUniqueOrThrow({ where: { classId: characterClass.classId } }),
      prisma.background.findUniqueOrThrow({ where: { backgroundId: background.backgroundId } }),
      prisma.weapon.findUniqueOrThrow({ where: { weaponId: weapon.weaponId } }),
      prisma.feat.findUniqueOrThrow({ where: { featId: feat.featId } }),
    ]);
    expect(raceBack.ruleset).toBe("RULES_2014");
    expect(classBack.ruleset).toBe("RULES_2014");
    expect(backgroundBack.ruleset).toBe("RULES_2014");
    expect(weaponBack.ruleset).toBe("RULES_2014");
    expect(featBack.ruleset).toBe("RULES_2014");
  });
});

describe("KR6.3 Крок 1 — levelup-content (клас/риса/інфузія каталоги при рівні)", () => {
  it("клас із RULES_2024 не потрапляє у loadLevelUpBaseContent", async () => {
    const characterClass = await prisma.class.findFirstOrThrow({ orderBy: { classId: "asc" } });

    await withFlippedRuleset(
      () => prisma.class.update({ where: { classId: characterClass.classId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.class.update({ where: { classId: characterClass.classId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const { loadLevelUpBaseContent } = await import("@/server/db/levelup-content");
        const { classes } = await loadLevelUpBaseContent(-1);
        expect(classes.some((c) => c.classId === characterClass.classId)).toBe(false);
      },
    );
  });

  it("риса з RULES_2024 не потрапляє у loadLevelUpBaseContent", async () => {
    const feat = await prisma.feat.findFirstOrThrow({ orderBy: { featId: "asc" } });

    await withFlippedRuleset(
      () => prisma.feat.update({ where: { featId: feat.featId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.feat.update({ where: { featId: feat.featId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const { loadLevelUpBaseContent } = await import("@/server/db/levelup-content");
        const { feats } = await loadLevelUpBaseContent(-1);
        expect(feats.some((f) => f.featId === feat.featId)).toBe(false);
      },
    );
  });

  it("інфузія з RULES_2024 не потрапляє у loadLevelUpBaseContent", async () => {
    const infusion = await prisma.infusion.findFirstOrThrow({ orderBy: { infusionId: "asc" } });

    await withFlippedRuleset(
      () => prisma.infusion.update({ where: { infusionId: infusion.infusionId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.infusion.update({ where: { infusionId: infusion.infusionId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const { loadLevelUpBaseContent } = await import("@/server/db/levelup-content");
        const { infusions } = await loadLevelUpBaseContent(-1);
        expect(infusions.some((i) => i.infusionId === infusion.infusionId)).toBe(false);
      },
    );
  });
});

describe("KR6.3 Крок 1 — getBaseEquipment", () => {
  it("зброя і броня з RULES_2024 не потрапляють у список", async () => {
    const [weapon, armor] = await Promise.all([
      prisma.weapon.findFirstOrThrow({ orderBy: { weaponId: "asc" } }),
      prisma.armor.findFirstOrThrow({ orderBy: { armorId: "asc" } }),
    ]);

    await withFlippedRuleset(
      () =>
        Promise.all([
          prisma.weapon.update({ where: { weaponId: weapon.weaponId }, data: { ruleset: "RULES_2024" } }),
          prisma.armor.update({ where: { armorId: armor.armorId }, data: { ruleset: "RULES_2024" } }),
        ]),
      () =>
        Promise.all([
          prisma.weapon.update({ where: { weaponId: weapon.weaponId }, data: { ruleset: "RULES_2014" } }),
          prisma.armor.update({ where: { armorId: armor.armorId }, data: { ruleset: "RULES_2014" } }),
        ]),
      async () => {
        const result = await getBaseEquipment();
        // success is inferred as plain boolean (not a literal), same as the existing callers in
        // AddArmorDialog.tsx/AddWeaponDialog.tsx — narrowing needs the field checks too.
        if (!result.success || !result.weapons || !result.armors) {
          throw new Error("getBaseEquipment failed: " + JSON.stringify(result));
        }

        expect(result.weapons.some((w) => w.weaponId === weapon.weaponId)).toBe(false);
        expect(result.armors.some((a) => a.armorId === armor.armorId)).toBe(false);
      },
    );
  });
});

describe("KR6.3 Крок 1 — loadFightingStyleOptions", () => {
  // fighting_style has zero rows in spells_test (and likely prod — nothing seeds it), so there's
  // no existing row to flip. Insert-and-delete a throwaway RULES_2024 fixture instead: engName is
  // a plain unique String, not a Postgres enum, so this doesn't hit the KR6.1 enum-identity wall
  // that blocks fixturing race/class/background/weapon/feat before KR6.3 Крок 2's schema change.
  it("бойовий стиль з RULES_2024 не потрапляє у список", async () => {
    const fixture = await prisma.fightingStyle.create({
      data: {
        name: "KR6.3 тестовий фікстур",
        engName: "KR6.3 test fixture — ruleset filter",
        description: "Тимчасовий рядок для controlled-red доказу, видаляється в кінці тесту.",
        ruleset: "RULES_2024",
      },
    });

    try {
      const options = await loadFightingStyleOptions();
      expect(options.some((o) => o.id === fixture.id)).toBe(false);
    } finally {
      await prisma.fightingStyle.delete({ where: { id: fixture.id } });
    }
  });
});

describe("KR6.3 Крок 1 — spell-actions", () => {
  it("getSpellForModal не знаходить заклинання з RULES_2024 ні за id, ні за engName", async () => {
    const spell = await prisma.spell.findFirstOrThrow({ orderBy: { spellId: "asc" } });

    await withFlippedRuleset(
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        expect(await getSpellForModal(String(spell.spellId))).toBeNull();
        expect(await getSpellForModal(spell.engName)).toBeNull();
      },
    );
  });

  it("getSpellsList виключає заклинання з RULES_2024", async () => {
    const spell = await prisma.spell.findFirstOrThrow({ orderBy: { spellId: "asc" } });

    await withFlippedRuleset(
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const spells = await getSpellsList();
        expect(spells.some((s) => s.spellId === spell.spellId)).toBe(false);
      },
    );
  });
});

describe("KR6.3 Крок 1 — generate-spells.ts / generate-magic-items.ts (build-time SSG)", () => {
  it("buildSpellsForGenerationQuery виключає заклинання з RULES_2024", async () => {
    const spell = await prisma.spell.findFirstOrThrow({ orderBy: { spellId: "asc" } });

    await withFlippedRuleset(
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.spell.update({ where: { spellId: spell.spellId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const spells = await prisma.spell.findMany(buildSpellsForGenerationQuery());
        expect(spells.some((s) => s.spellId === spell.spellId)).toBe(false);
      },
    );
  });

  it("buildMagicItemsForGenerationQuery виключає предмет з RULES_2024", async () => {
    const magicItem = await prisma.magicItem.findFirstOrThrow({ orderBy: { magicItemId: "asc" } });

    await withFlippedRuleset(
      () => prisma.magicItem.update({ where: { magicItemId: magicItem.magicItemId }, data: { ruleset: "RULES_2024" } }),
      () => prisma.magicItem.update({ where: { magicItemId: magicItem.magicItemId }, data: { ruleset: "RULES_2014" } }),
      async () => {
        const items = await prisma.magicItem.findMany(buildMagicItemsForGenerationQuery());
        expect(items.some((i) => i.magicItemId === magicItem.magicItemId)).toBe(false);
      },
    );
  });
});
