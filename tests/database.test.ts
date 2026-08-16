import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "./user-data";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("контент із клона прода", () => {
  it("заклинання, класи й раси на місці", async () => {
    const [spells, classes, races] = await Promise.all([
      prisma.spell.count(),
      prisma.class.count(),
      prisma.race.count(),
    ]);

    expect(spells).toBeGreaterThan(400);
    expect(classes).toBeGreaterThan(10);
    expect(races).toBeGreaterThan(0);
  });

  it("наявний content має безпечний ruleset 2014", async () => {
    const characterClass = await prisma.class.findFirstOrThrow({
      orderBy: { classId: "asc" },
      select: { ruleset: true },
    });

    expect(characterClass.ruleset).toBe("RULES_2014");
  });
});

describe("запис і читання персонажа", () => {
  let classId: number;
  let raceId: number;
  let backgroundId: number;

  beforeAll(async () => {
    const [firstClass, firstRace, firstBackground] = await Promise.all([
      prisma.class.findFirstOrThrow({ orderBy: { classId: "asc" } }),
      prisma.race.findFirstOrThrow({ orderBy: { raceId: "asc" } }),
      prisma.background.findFirstOrThrow({ orderBy: { backgroundId: "asc" } }),
    ]);

    classId = firstClass.classId;
    raceId = firstRace.raceId;
    backgroundId = firstBackground.backgroundId;
  });

  async function createPers(name: string) {
    const user = await prisma.user.create({
      data: { email: `${name}@example.test`, name: "Тестовий користувач" },
    });

    return prisma.pers.create({
      data: {
        userId: user.id,
        name,
        classId,
        raceId,
        backgroundId,
        level: 3,
        currentHp: 24,
        maxHp: 24,
        str: 16,
        dex: 12,
        con: 14,
        int: 10,
        wis: 13,
        cha: 8,
      },
    });
  }

  it("створений персонаж читається назад із тими самими значеннями", async () => {
    const created = await createPers("Дурін");
    const readBack = await prisma.pers.findUniqueOrThrow({
      where: { persId: created.persId },
      include: { user: true },
    });

    expect(readBack.name).toBe("Дурін");
    expect(readBack.level).toBe(3);
    expect(readBack.str).toBe(16);
    expect(readBack.user.email).toBe("Дурін@example.test");
  });

  it("значення за замовчуванням проставляє база, а не код", async () => {
    const created = await createPers("Тея");

    expect(created.tempHp).toBe(0);
    expect(created.xp).toBe(0);
    expect(created.isActive).toBe(true);
    expect(created.additionalSaveProficiencies).toEqual([]);
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.ruleset).toBe("RULES_2014");
  });

  it("персонаж 2024 редакції зберігається з ruleset = RULES_2024", async () => {
    const [class2024, race2024, bg2024] = await Promise.all([
      prisma.class.findFirstOrThrow({ where: { ruleset: "RULES_2024" } }),
      prisma.race.findFirstOrThrow({ where: { ruleset: "RULES_2024" } }),
      prisma.background.findFirstOrThrow({ where: { ruleset: "RULES_2024" } }),
    ]);

    const user = await prisma.user.create({
      data: { email: "pers2024@example.test", name: "2024 Гравець" },
    });

    const created2024 = await prisma.pers.create({
      data: {
        userId: user.id,
        name: "Герой 2024",
        ruleset: "RULES_2024",
        classId: class2024.classId,
        raceId: race2024.raceId,
        backgroundId: bg2024.backgroundId,
        level: 1,
        currentHp: 12,
        maxHp: 12,
        str: 16,
        dex: 14,
        con: 14,
        int: 10,
        wis: 12,
        cha: 8,
      },
    });

    const readBack = await prisma.pers.findUniqueOrThrow({
      where: { persId: created2024.persId },
    });

    expect(readBack.ruleset).toBe("RULES_2024");
    expect(readBack.name).toBe("Герой 2024");
  });

  it("між тестами дані користувача скидаються", async () => {
    const [perses, users] = await Promise.all([prisma.pers.count(), prisma.user.count()]);

    expect(perses).toBe(0);
    expect(users).toBe(0);
  });
});
