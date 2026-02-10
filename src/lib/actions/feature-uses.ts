"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canEditPers } from "@/lib/actions/pers";

export async function spendFeatureUse({
  persId,
  featureId,
}: {
  persId: number;
  featureId: number;
}): Promise<{ success: true; usesRemaining: number | null } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Не авторизовано" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { success: false, error: "Користувача не знайдено" };

  // Fetch feature to know max uses if we need to initialize
  const feature = await prisma.feature.findUnique({
    where: { featureId },
    select: { 
      usesCount: true, 
      usesCountDependsOnProficiencyBonus: true, 
      usesCountSpecial: true,
      usesPoolKey: true,
      usePrice: true,
      classFeatures: { select: { classId: true } }
    },
  });
  if (!feature) return { success: false, error: "Вміння не знайдено" };

  // Need more pers info to calculate max uses
  const pers = await prisma.pers.findUnique({
    where: { persId },
    include: {
      multiclasses: true,
      class: true
    }
  });

  if (!pers) return { success: false, error: "Немає доступу до персонажа" };
  const canEdit = await canEditPers(persId, user.id);
  if (!canEdit) return { success: false, error: "Немає доступу до персонажа" };

  const calculateMaxUsesForFeature = (featureInput: {
    usesCount: number | null;
    usesCountDependsOnProficiencyBonus: boolean;
    usesCountSpecial: unknown;
    classFeatures: Array<{ classId: number }>;
  }) => {
      const getClassLevelForFeature = () => {
        const classIdsWithFeature = new Set(featureInput.classFeatures.map(cf => cf.classId));
        if (classIdsWithFeature.has(pers.classId)) {
          const multiclassSum = pers.multiclasses.reduce((acc, current) => acc + (Number(current.classLevel) || 0), 0);
          return Math.max(1, (Number(pers.level) || 1) - multiclassSum);
        }
        const mc = pers.multiclasses.find(m => classIdsWithFeature.has(m.classId));
        if (mc) return Number(mc.classLevel) || 1;
        return pers.level;
      };

      const getAbilityMod = (stat: string) => {
        const key = String(stat || "").toLowerCase();
        const score = (pers as any)[key];
        if (typeof score !== "number") return 0;
        return Math.floor((score - 10) / 2);
      };

      const special = featureInput.usesCountSpecial as any;

      if (Array.isArray(special)) {
        const classLevel = getClassLevelForFeature();
        const match = [...special]
        .filter((entry) => typeof entry?.lvl === "number" && classLevel >= entry.lvl)
        .sort((a, b) => b.lvl - a.lvl)[0];
        if (match && typeof match.uses === "number") return match.uses;
      }
      
      // Handle equalsToClassLevel
      if (special && typeof special === 'object' && special.equalsToClassLevel === true) {
        return getClassLevelForFeature();
      }

      if (special && typeof special === "object" && special.type === "FORMULA") {
        const operation = String(special.operation || "ADD").toUpperCase();
        const minimum = typeof special.minimum === "number" ? special.minimum : null;

        if (special.group === "STAT_BASED") {
          const base = Number(special.base ?? 0);
          const mod = getAbilityMod(special.stat);
          const value = operation === "MULTIPLY" ? base * mod : base + mod;
          return minimum !== null ? Math.max(minimum, value) : value;
        }

        if (special.group === "LEVEL_BASED") {
          const classLevel = getClassLevelForFeature();
          const multiplier = Number(special.multiplier ?? 1);
          const base = Number(special.base ?? 0);
          const value = operation === "MULTIPLY" ? classLevel * multiplier : base + classLevel;
          return minimum !== null ? Math.max(minimum, value) : value;
        }

        if (special.group === "PROFICIENCY_BONUS") {
          const pb = Math.ceil(pers.level / 4) + 1;
          const multiplier = Number(special.multiplier ?? 1);
          const base = Number(special.base ?? 0);
          const value = operation === "MULTIPLY" ? pb * multiplier : base + pb;
          return minimum !== null ? Math.max(minimum, value) : value;
        }
      }

      if (featureInput.usesCountDependsOnProficiencyBonus) {
          return Math.ceil(pers.level / 4) + 1;
      }
      
      return featureInput.usesCount;
  };

  const poolKey = feature.usesPoolKey;
  if (poolKey) {
      const cost = Math.max(1, Number(feature.usePrice ?? 1));
      const hasCounts = feature.usesCountDependsOnProficiencyBonus || typeof feature.usesCount === "number" || (feature.usesCountSpecial && typeof feature.usesCountSpecial === "object");
      const provider = hasCounts
        ? feature
        : await prisma.feature.findFirst({
            where: {
              usesPoolKey: poolKey,
              OR: [
                { usesCount: { not: null } },
                { usesCountDependsOnProficiencyBonus: true },
                { usesCountSpecial: { not: Prisma.AnyNull } }
              ]
            },
            select: {
              usesCount: true,
              usesCountDependsOnProficiencyBonus: true,
              usesCountSpecial: true,
              classFeatures: { select: { classId: true } }
            }
          }) ?? feature;

      const max = calculateMaxUsesForFeature(provider);
      const pool = await prisma.persResourcePool.findUnique({
          where: { persId_poolKey: { persId, poolKey } },
          select: { usesRemaining: true },
      });

      const cur = pool?.usesRemaining ?? max;
      if (typeof cur !== "number" || typeof max !== "number") {
        return { success: true, usesRemaining: null };
      }

      const next = Math.max(0, Math.trunc(cur) - cost);
      const updatedPool = await prisma.persResourcePool.upsert({
        where: { persId_poolKey: { persId, poolKey } },
        create: { persId, poolKey, usesRemaining: next },
        update: { usesRemaining: next },
        select: { usesRemaining: true },
      });

      revalidatePath(`/char/${persId}`);
      revalidatePath(`/character/${persId}`);

      return { success: true, usesRemaining: updatedPool.usesRemaining };
  }

  const pf = await prisma.persFeature.findUnique({
    where: {
      persId_featureId: {
        persId,
        featureId,
      },
    },
    select: { usesRemaining: true },
  });

  const max = calculateMaxUsesForFeature(feature);
  const cur = pf?.usesRemaining ?? max;
  
  if (typeof cur !== "number" || typeof max !== "number") {
    return { success: true, usesRemaining: null };
  }

  const cost = Math.max(1, Number(feature.usePrice ?? 1));
  const next = Math.max(0, Math.trunc(cur) - cost);

  const updated = await prisma.persFeature.upsert({
    where: {
      persId_featureId: {
        persId,
        featureId,
      },
    },
    create: {
      persId,
      featureId,
      usesRemaining: next
    },
    update: { 
      usesRemaining: next 
    },
    select: { usesRemaining: true },
  });

  revalidatePath(`/char/${persId}`);
  revalidatePath(`/character/${persId}`);

  return { success: true, usesRemaining: updated.usesRemaining };
}

export async function restoreFeatureUse({
  persId,
  featureId,
}: {
  persId: number;
  featureId: number;
}): Promise<{ success: true; usesRemaining: number | null } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Не авторизовано" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { success: false, error: "Користувача не знайдено" };

  // Fetch feature to know max uses
  const feature = await prisma.feature.findUnique({
    where: { featureId },
    select: { 
      usesCount: true, 
      usesCountDependsOnProficiencyBonus: true, 
      usesCountSpecial: true,
      usesPoolKey: true,
      usePrice: true,
      classFeatures: { select: { classId: true } }
    },
  });
  if (!feature) return { success: false, error: "Вміння не знайдено" };

  const pers = await prisma.pers.findUnique({
    where: { persId },
    include: {
      multiclasses: true,
      class: true
    }
  });

  if (!pers) return { success: false, error: "Немає доступу до персонажа" };
  const canEdit = await canEditPers(persId, user.id);
  if (!canEdit) return { success: false, error: "Немає доступу до персонажа" };

  const calculateMaxUsesForFeature = (featureInput: {
    usesCount: number | null;
    usesCountDependsOnProficiencyBonus: boolean;
    usesCountSpecial: unknown;
    classFeatures: Array<{ classId: number }>;
  }) => {
      const special = featureInput.usesCountSpecial as any;
      
      if (special && typeof special === 'object' && special.equalsToClassLevel === true) {
          const classIdsWithFeature = new Set(featureInput.classFeatures.map(cf => cf.classId));
          
          if (classIdsWithFeature.has(pers.classId)) {
               const multiclassSum = pers.multiclasses.reduce((acc, current) => acc + (Number(current.classLevel) || 0), 0);
               return Math.max(1, (Number(pers.level) || 1) - multiclassSum);
          }
          
          const mc = pers.multiclasses.find(m => classIdsWithFeature.has(m.classId));
          if (mc) {
              return Number(mc.classLevel) || 1;
          }
          
          return pers.level;
      }

      if (featureInput.usesCountDependsOnProficiencyBonus) {
          return Math.ceil(pers.level / 4) + 1;
      }
      
      return featureInput.usesCount;
  };

  const poolKey = feature.usesPoolKey;
  if (poolKey) {
      const cost = Math.max(1, Number(feature.usePrice ?? 1));
      const hasCounts = feature.usesCountDependsOnProficiencyBonus || typeof feature.usesCount === "number" || (feature.usesCountSpecial && typeof feature.usesCountSpecial === "object");
      const provider = hasCounts
        ? feature
        : await prisma.feature.findFirst({
            where: {
              usesPoolKey: poolKey,
              OR: [
                { usesCount: { not: null } },
                { usesCountDependsOnProficiencyBonus: true },
                { usesCountSpecial: { not: Prisma.AnyNull } }
              ]
            },
            select: {
              usesCount: true,
              usesCountDependsOnProficiencyBonus: true,
              usesCountSpecial: true,
              classFeatures: { select: { classId: true } }
            }
          }) ?? feature;

      const max = calculateMaxUsesForFeature(provider);
      const pool = await prisma.persResourcePool.findUnique({
          where: { persId_poolKey: { persId, poolKey } },
          select: { usesRemaining: true },
      });

      const cur = pool?.usesRemaining ?? max;
      if (typeof cur !== "number" || typeof max !== "number") {
        return { success: true, usesRemaining: null };
      }

      const next = Math.min(max, Math.trunc(cur) + cost);
      const updatedPool = await prisma.persResourcePool.upsert({
        where: { persId_poolKey: { persId, poolKey } },
        create: { persId, poolKey, usesRemaining: next },
        update: { usesRemaining: next },
        select: { usesRemaining: true },
      });

      revalidatePath(`/char/${persId}`);
      revalidatePath(`/character/${persId}`);

      return { success: true, usesRemaining: updatedPool.usesRemaining };
  }

  const pf = await prisma.persFeature.findUnique({
    where: {
      persId_featureId: {
        persId,
        featureId,
      },
    },
    select: { usesRemaining: true },
  });

  const max = calculateMaxUsesForFeature(feature);
  const cur = pf?.usesRemaining ?? max;

  if (typeof cur !== "number" || typeof max !== "number") {
    return { success: true, usesRemaining: null };
  }

  const cost = Math.max(1, Number(feature.usePrice ?? 1));
  const next = Math.min(max, Math.trunc(cur) + cost);

  const updated = await prisma.persFeature.upsert({
    where: {
      persId_featureId: {
        persId,
        featureId,
      },
    },
    create: {
      persId,
      featureId,
      usesRemaining: next
    },
    update: { 
      usesRemaining: next 
    },
    select: { usesRemaining: true },
  });

  revalidatePath(`/char/${persId}`);
  revalidatePath(`/character/${persId}`);

  return { success: true, usesRemaining: updated.usesRemaining };
}
