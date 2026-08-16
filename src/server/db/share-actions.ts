'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { clonePersWithRelations, PERS_DUPLICATION_INCLUDE } from "@/lib/logic/pers-duplication";
import { revalidatePath } from "next/cache";

async function ensureFolderShareTokens(folderIds: number[]) {
  if (folderIds.length === 0) return;

  const missing = await prisma.pers.findMany({
    where: { folderId: { in: folderIds }, shareToken: null },
    select: { persId: true }
  });

  if (missing.length === 0) return;

  for (const pers of missing) {
    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      const token = randomBytes(16).toString("hex");
      try {
        await prisma.pers.update({
          where: { persId: pers.persId },
          data: { shareToken: token }
        });
        break;
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002" && attempts < 3) continue;
        throw error;
      }
    }
  }
}

async function ensureFolderEditTokens(persIds: number[]) {
  if (persIds.length === 0) return new Map<number, string>();

  const existing = await prisma.persShareToken.findMany({
    where: { persId: { in: persIds }, canEdit: true },
    select: { persId: true, token: true }
  });

  const tokenMap = new Map(existing.map((row) => [row.persId, row.token]));
  const missing = persIds.filter((id) => !tokenMap.has(id));

  for (const persId of missing) {
    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      const token = randomBytes(16).toString("hex");
      try {
        await prisma.persShareToken.create({
          data: { persId, token, canEdit: true }
        });
        tokenMap.set(persId, token);
        break;
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002" && attempts < 3) continue;
        throw error;
      }
    }
  }

  return tokenMap;
}

async function getFolderTreeIds(rootFolderId: number) {
  const collected = new Set<number>([rootFolderId]);
  let frontier = [rootFolderId];

  while (frontier.length > 0) {
    const children = await prisma.persFolder.findMany({
      where: { parentFolderId: { in: frontier } },
      select: { folderId: true }
    });

    const next: number[] = [];
    for (const child of children) {
      if (collected.has(child.folderId)) continue;
      collected.add(child.folderId);
      next.push(child.folderId);
    }

    frontier = next;
  }

  return Array.from(collected);
}

export async function generateShareToken(persId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const pers = await prisma.pers.findUnique({
      where: { persId },
      select: { userId: true }
    });

    if (!pers) return { error: "Character not found" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (pers.userId !== user?.id) return { error: "Forbidden" };

    const token = randomBytes(16).toString("hex");

    await prisma.pers.update({
      where: { persId },
      data: { shareToken: token }
    });

    return { success: true, token };
  } catch (error) {
    console.error("Token generation failed:", error);
    return { error: "Failed to generate share link" };
  }
}

export async function generateEditShareToken(persId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const pers = await prisma.pers.findUnique({
      where: { persId },
      select: { userId: true }
    });

    if (!pers) return { error: "Character not found" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (pers.userId !== user?.id) return { error: "Forbidden" };

    const existing = await prisma.persShareToken.findFirst({
      where: { persId, canEdit: true },
      select: { token: true }
    });

    if (existing?.token) return { success: true, token: existing.token };

    const token = randomBytes(16).toString("hex");
    await prisma.persShareToken.create({
      data: { persId, token, canEdit: true }
    });

    return { success: true, token };
  } catch (error) {
    console.error("Edit token generation failed:", error);
    return { error: "Failed to generate edit share link" };
  }
}

export async function getPersByShareToken(token: string) {
  const editToken = await prisma.persShareToken.findUnique({
    where: { token },
    select: { persId: true, canEdit: true }
  });

  const pers = editToken
    ? await prisma.pers.findUnique({
        where: { persId: editToken.persId },
        include: {
        race: {
            include: {
                traits: {
                    include: {
                        feature: true
                    }
                }
            }
        },
        subrace: {
            include: {
                traits: {
                    include: {
                        feature: true
                    }
                }
            }
        },
        class: {
            include: {
                features: {
                    include: {
                        feature: true
                    }
                }
            }
        },
        subclass: {
            include: {
                features: {
                    include: {
                        feature: true
                    }
                }
            }
        },
        multiclasses: {
            include: {
                class: {
                    include: {
                        features: {
                            include: {
                                feature: true,
                            },
                        },
                    },
                },
                subclass: {
                    include: {
                        features: {
                            include: {
                                feature: true,
                            },
                        },
                    },
                },
            },
        },
        background: true,
        skills: true,
        feats: { 
            include: { 
                feat: true,
                choices: {
                    include: {
                        choiceOption: true,
                    }
                }
            } 
        },
        raceVariants: {
            include: {
                traits: {
                    include: {
                        feature: true,
                    },
                },
            },
        },
        magicItems: {
          include: {
            magicItem: true,
          },
        },
        features: { include: { feature: true } },
        choiceOptions: true,
        raceChoiceOptions: true,
        spells: true,
        persSpells: {
            include: {
                spell: true,
            },
            orderBy: [
                { spell: { level: "asc" } },
                { spell: { name: "asc" } },
            ],
        },
        weapons: { include: { weapon: true } },
        armors: { include: { armor: true } },
        resourcePools: true,
    }
      })
    : await prisma.pers.findUnique({
        where: { shareToken: token },
        include: {
          race: {
            include: {
              traits: {
                include: {
                  feature: true
                }
              }
            }
          },
          subrace: {
            include: {
              traits: {
                include: {
                  feature: true
                }
              }
            }
          },
          class: {
            include: {
              features: {
                include: {
                  feature: true
                }
              }
            }
          },
          subclass: {
            include: {
              features: {
                include: {
                  feature: true
                }
              }
            }
          },
          multiclasses: {
            include: {
              class: {
                include: {
                  features: {
                    include: {
                      feature: true,
                    },
                  },
                },
              },
              subclass: {
                include: {
                  features: {
                    include: {
                      feature: true,
                    },
                  },
                },
              },
            },
          },
          background: true,
          skills: true,
          feats: { 
            include: { 
              feat: true,
              choices: {
                include: {
                  choiceOption: true,
                }
              }
            } 
          },
          raceVariants: {
            include: {
              traits: {
                include: {
                  feature: true,
                },
              },
            },
          },
          magicItems: {
            include: {
              magicItem: true,
            },
          },
          features: { include: { feature: true } },
          choiceOptions: true,
          raceChoiceOptions: true,
          spells: true,
          persSpells: {
            include: {
              spell: true,
            },
            orderBy: [
              { spell: { level: "asc" } },
              { spell: { name: "asc" } },
            ],
          },
          weapons: { include: { weapon: true } },
          armors: { include: { armor: true } },
          resourcePools: true,
        }
      });

  return { pers, canEdit: Boolean(editToken?.canEdit) };
}

export async function acceptPersEditShareToken(token: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Авторизуйтесь, щоб отримати доступ" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "Користувача не знайдено" };

  const share = await prisma.persShareToken.findUnique({
    where: { token },
    select: { persId: true, canEdit: true }
  });

  if (!share || !share.canEdit) return { error: "Посилання недійсне" };

  const pers = await prisma.pers.findUnique({
    where: { persId: share.persId },
    select: { persId: true, userId: true }
  });

  if (!pers) return { error: "Персонажа не знайдено" };

  if (pers.userId !== user.id) {
    await prisma.persAdditionalUser.upsert({
      where: { persId_userId: { persId: pers.persId, userId: user.id } },
      update: {},
      create: { persId: pers.persId, userId: user.id }
    });
  }

  return { success: true, persId: pers.persId };
}

export async function generateFolderShareToken(folderId: number, canEdit: boolean) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const folder = await prisma.persFolder.findUnique({
    where: { folderId },
    select: { userId: true }
  });

  if (!folder) return { error: "Folder not found" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (folder.userId !== user?.id) return { error: "Forbidden" };

  const existing = await prisma.persFolderShareToken.findFirst({
    where: { folderId, canEdit },
    select: { token: true }
  });

  if (existing?.token) return { success: true, token: existing.token };

  const token = randomBytes(16).toString("hex");
  await prisma.persFolderShareToken.create({
    data: { folderId, token, canEdit }
  });

  return { success: true, token };
}

export async function getFolderByShareToken(token: string) {
  const share = await prisma.persFolderShareToken.findUnique({
    where: { token },
    select: { folderId: true, canEdit: true }
  });

  if (!share) return null;

  const folderIds = await getFolderTreeIds(share.folderId);
  await ensureFolderShareTokens(folderIds);

  const folder = await prisma.persFolder.findUnique({
    where: { folderId: share.folderId },
    select: {
      folderId: true,
      name: true,
      color: true,
      isPinned: true,
    }
  });

  if (!folder) return null;

  const folders = await prisma.persFolder.findMany({
    where: { folderId: { in: folderIds }, NOT: { folderId: share.folderId } },
    select: {
      folderId: true,
      name: true,
      color: true,
      parentFolderId: true,
      isPinned: true,
    },
    orderBy: { name: "asc" },
  });

  const perses = await prisma.pers.findMany({
    where: { folderId: { in: folderIds } },
    select: {
      persId: true,
      name: true,
      level: true,
      currentHp: true,
      maxHp: true,
      isPinned: true,
      folderId: true,
      shareToken: true,
      race: { select: { name: true } },
      class: { select: { name: true } },
      background: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" }
  });

  if (!share.canEdit) {
    return { folder: { ...folder, perses, folders }, canEdit: false };
  }

  const editTokens = await ensureFolderEditTokens(perses.map((p) => p.persId));
  const folderWithEdit = {
    ...folder,
    perses: perses.map((p) => ({
      ...p,
      editToken: editTokens.get(p.persId) ?? null,
    })),
    folders,
  };

  return { folder: folderWithEdit, canEdit: true };
}

export async function acceptFolderEditShareToken(token: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Авторизуйтесь, щоб отримати доступ" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "Користувача не знайдено" };

  const share = await prisma.persFolderShareToken.findUnique({
    where: { token },
    select: { folderId: true, canEdit: true }
  });

  if (!share || !share.canEdit) return { error: "Посилання недійсне" };

  const folder = await prisma.persFolder.findUnique({
    where: { folderId: share.folderId },
    select: { folderId: true, userId: true }
  });

  if (!folder) return { error: "Папку не знайдено" };

  if (folder.userId !== user.id) {
    const folderIds = await getFolderTreeIds(folder.folderId);

    await prisma.persFolderMember.updateMany({
      where: { folderId: { in: folderIds }, userId: user.id },
      data: { canEdit: true }
    });

    await prisma.persFolderMember.createMany({
      data: folderIds.map((folderId) => ({ folderId, userId: user.id, canEdit: true })),
      skipDuplicates: true
    });

    const perses = await prisma.pers.findMany({
      where: { folderId: { in: folderIds } },
      select: { persId: true }
    });

    if (perses.length > 0) {
      await prisma.persAdditionalUser.createMany({
        data: perses.map((p) => ({ persId: p.persId, userId: user.id })),
        skipDuplicates: true
      });
    }
  }

  revalidatePath("/char/home");
  return { success: true, folderId: folder.folderId };
}

export async function copyFolderByShareToken(token: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Авторизуйтесь, щоб скопіювати папку" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "Користувача не знайдено" };

  const share = await prisma.persFolderShareToken.findUnique({
    where: { token },
    select: { folderId: true, canEdit: true }
  });

  if (!share) return { error: "Посилання недійсне" };
  if (share.canEdit) return { error: "Це посилання для редагування. Додайте папку в профіль." };

  const source = await prisma.persFolder.findUnique({
    where: { folderId: share.folderId },
    select: { folderId: true, name: true, color: true, isPinned: true }
  });

  if (!source) return { error: "Папку не знайдено" };

  const created = await prisma.$transaction(async (tx) => {
    const cloneFolder = async (folderId: number, parentId: number | null, addCopySuffix: boolean) => {
      const folder = await tx.persFolder.findUnique({
        where: { folderId },
        select: { folderId: true, name: true, color: true, isPinned: true }
      });

      if (!folder) return null;

      const createdFolder = await tx.persFolder.create({
        data: {
          userId: user.id,
          name: addCopySuffix ? `${folder.name} (Копія)` : folder.name,
          color: folder.color,
          isPinned: folder.isPinned,
          parentFolderId: parentId,
        },
        select: {
          folderId: true,
          name: true,
          color: true,
          isPinned: true,
          parentFolderId: true,
        },
      });

      const perses = await tx.pers.findMany({
        where: { folderId: folder.folderId },
        include: PERS_DUPLICATION_INCLUDE,
      });

      for (const pers of perses) {
        await clonePersWithRelations(tx, pers, {
          userId: user.id,
          name: `${pers.name} (Копія)`,
          folderId: createdFolder.folderId,
          isPinned: pers.isPinned ?? false,
        });
      }

      const children = await tx.persFolder.findMany({
        where: { parentFolderId: folder.folderId },
        select: { folderId: true }
      });

      for (const child of children) {
        await cloneFolder(child.folderId, createdFolder.folderId, false);
      }

      return createdFolder;
    };

    return cloneFolder(source.folderId, null, true);
  });

  if (!created) return { error: "Не вдалося скопіювати папку" };

  revalidatePath("/char/home");

  return { success: true, folder: created };
}

export async function copyPersByToken(token: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Авторизуйтесь, щоб скопіювати персонажа" };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Користувача не знайдено" };

    const editToken = await prisma.persShareToken.findUnique({
      where: { token },
      select: { persId: true }
    });

    const sourcePers = await prisma.pers.findUnique({
      where: editToken ? { persId: editToken.persId } : { shareToken: token },
      include: {
        skills: true,
        persSpells: true,
        features: true,
        feats: { include: { choices: true } },
        weapons: true,
        armors: true,
        multiclasses: true,
        magicItems: true,
        raceVariants: true,
        raceChoiceOptions: true,
        choiceOptions: true,
        classOptionalFeatures: true,
        spells: true,
      }
    });

    if (!sourcePers) return { error: "Персонажа не знайдено за цим токеном" };

    const newPersId = await prisma.$transaction(async (tx) => {
      // Use a variable to avoid TS excess-property checks before Prisma Client is regenerated.
      const data = {
          userId: user.id,
          name: `${sourcePers.name} (Копія)`,
          level: sourcePers.level,
          currentSpellSlots: sourcePers.currentSpellSlots,
          currentPactSlots: sourcePers.currentPactSlots,
          classId: sourcePers.classId,
          subclassId: sourcePers.subclassId,
          backgroundId: sourcePers.backgroundId,
          raceId: sourcePers.raceId,
          subraceId: sourcePers.subraceId,
          currentHp: sourcePers.currentHp,
          maxHp: sourcePers.maxHp,
          tempHp: sourcePers.tempHp,
          deathSaveSuccesses: sourcePers.deathSaveSuccesses,
          deathSaveFailures: sourcePers.deathSaveFailures,
          isDead: sourcePers.isDead,
          raceCustom: sourcePers.raceCustom,
          classCustom: sourcePers.classCustom,
          alignment: sourcePers.alignment,
          xp: sourcePers.xp,
          customBackground: sourcePers.customBackground,
          customProficiencies: sourcePers.customProficiencies,
          customFeatures: sourcePers.customFeatures,
          customLanguagesKnown: sourcePers.customLanguagesKnown,
          customEquipment: sourcePers.customEquipment,
          personalityTraits: sourcePers.personalityTraits,
          ideals: sourcePers.ideals,
          bonds: sourcePers.bonds,
          flaws: sourcePers.flaws,
          backstory: sourcePers.backstory,
          notes: sourcePers.notes,
          str: sourcePers.str,
          dex: sourcePers.dex,
          con: sourcePers.con,
          int: sourcePers.int,
          wis: sourcePers.wis,
          cha: sourcePers.cha,
          cp: sourcePers.cp,
          ep: sourcePers.ep,
          sp: sourcePers.sp,
          gp: sourcePers.gp,
          pp: sourcePers.pp,
          additionalSaveProficiencies: sourcePers.additionalSaveProficiencies,
          miscSaveBonuses: sourcePers.miscSaveBonuses || undefined,
          wearsShield: sourcePers.wearsShield,
          additionalShieldBonus: sourcePers.additionalShieldBonus,
          armorBonus: sourcePers.armorBonus,
          overrideBaseAC: sourcePers.overrideBaseAC ?? undefined,
          wearsNaturalArmor: sourcePers.wearsNaturalArmor,
          statBonuses: sourcePers.statBonuses || undefined,
          statModifierBonuses: sourcePers.statModifierBonuses || undefined,
          saveBonuses: sourcePers.saveBonuses || undefined,
          skillBonuses: sourcePers.skillBonuses || undefined,
          hpBonuses: sourcePers.hpBonuses || undefined,
          acBonuses: sourcePers.acBonuses || undefined,
          speedBonuses: sourcePers.speedBonuses || undefined,
          proficiencyBonuses: sourcePers.proficiencyBonuses || undefined,
          initiativeBonuses: sourcePers.initiativeBonuses || undefined,
          spellAttackBonuses: sourcePers.spellAttackBonuses || undefined,
          spellDCBonuses: sourcePers.spellDCBonuses || undefined,
          currentHitDice: sourcePers.currentHitDice || undefined,
          usedHitDice: sourcePers.usedHitDice || undefined,
          
          isSnapshot: false,
          
          raceVariants: { connect: sourcePers.raceVariants.map(rv => ({ raceVariantId: rv.raceVariantId })) },
          raceChoiceOptions: { connect: sourcePers.raceChoiceOptions.map(rco => ({ optionId: rco.optionId })) },
          choiceOptions: { connect: sourcePers.choiceOptions.map(co => ({ choiceOptionId: co.choiceOptionId })) },
          classOptionalFeatures: { connect: sourcePers.classOptionalFeatures.map(cof => ({ optionalFeatureId: cof.optionalFeatureId })) },
          spells: { connect: sourcePers.spells.map(s => ({ spellId: s.spellId })) },
        };

      const newPers = await tx.pers.create({
        data,
      });

      if (sourcePers.skills.length > 0) {
        await tx.persSkill.createMany({
          data: sourcePers.skills.map(s => ({
            persId: newPers.persId,
            skillId: s.skillId,
            name: s.name,
            proficiencyType: s.proficiencyType,
            customModifier: s.customModifier,
          }))
        });
      }

      if (sourcePers.persSpells.length > 0) {
        await tx.persSpell.createMany({
          data: sourcePers.persSpells.map(ps => ({
            persId: newPers.persId,
            spellId: ps.spellId,
            learnedAtLevel: ps.learnedAtLevel,
            isPrepared: ps.isPrepared,
            excludeFromPreparedCount: ps.excludeFromPreparedCount,
            excludeFromKnownCount: ps.excludeFromKnownCount,
            badgeText: ps.badgeText,
            badgeColor: ps.badgeColor,
            origin: ps.origin,
            sourceId: ps.sourceId,
            sourceName: ps.sourceName,
            notes: ps.notes,
          }))
        });
      }

      if (sourcePers.features.length > 0) {
        await tx.persFeature.createMany({
          data: sourcePers.features.map(f => ({
            persId: newPers.persId,
            featureId: f.featureId,
            usesRemaining: f.usesRemaining,
          }))
        });
      }

      for (const pf of sourcePers.feats) {
        const newPersFeat = await tx.persFeat.create({
          data: { persId: newPers.persId, featId: pf.featId }
        });
        if (pf.choices.length > 0) {
          await tx.persFeatChoice.createMany({
            data: pf.choices.map(c => ({
              persFeatId: newPersFeat.persFeatId,
              choiceOptionId: c.choiceOptionId,
            }))
          });
        }
      }

      if (sourcePers.weapons.length > 0) {
        await tx.persWeapon.createMany({
          data: sourcePers.weapons.map(w => ({
            persId: newPers.persId,
            weaponId: w.weaponId,
            overrideName: w.overrideName,
            customDamageDice: w.customDamageDice,
            customDamageAbility: w.customDamageAbility,
            customDamageBonus: w.customDamageBonus === null ? Prisma.JsonNull : w.customDamageBonus,
            isProficient: w.isProficient,
          }))
        });
      }

      if (sourcePers.armors.length > 0) {
        await tx.persArmor.createMany({
          data: sourcePers.armors.map(a => ({
            persId: newPers.persId,
            armorId: a.armorId,
            overrideName: a.overrideName,
            overrideBaseAC: a.overrideBaseAC,
            abilityBonuses: a.abilityBonuses ?? [],
            abilityBonusType: a.abilityBonusType ?? undefined,
            isProficient: a.isProficient,
            equipped: a.equipped,
            miscACBonus: a.miscACBonus,
          }))
        });
      }

      if (sourcePers.multiclasses.length > 0) {
        await tx.persMulticlass.createMany({
          data: sourcePers.multiclasses.map(m => ({
            persId: newPers.persId,
            classId: m.classId,
            classLevel: m.classLevel,
            subclassId: m.subclassId,
          }))
        });
      }

      if (sourcePers.magicItems.length > 0) {
        await tx.persMagicItem.createMany({
          data: sourcePers.magicItems.map(mi => ({
            persId: newPers.persId,
            magicItemId: mi.magicItemId,
          }))
        });
      }

      return newPers.persId;
    });

    return { success: true, persId: newPersId };
  } catch (error) {
    console.error("Copy char failed:", error);
    return { error: "Помилка при копіюванні персонажа" };
  }
}
