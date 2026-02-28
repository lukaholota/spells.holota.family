"use client";

import {PersWithRelations} from "@/lib/actions/pers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Search, Plus, ExternalLink, Filter} from "lucide-react";
import {useCallback, useEffect, useMemo, useState, useTransition} from "react";
import {calculateCasterLevel} from "@/lib/logic/spell-logic";
import {SPELL_SLOT_PROGRESSION} from "@/lib/refs/static";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {classTranslations, subclassTranslations} from "@/lib/refs/translation";
import { getSpellcastingCountsLines } from "@/lib/logic/spellcasting-progression";

const AUTO_BADGE_STATIC_TOKENS = ["архетип", "підклас"] as const;

function normalizeAutoBadgeToken(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("uk")
    .replace(/\s+/g, " ");
}

function collectCharacterBadgeMatchers(pers: PersWithRelations): string[] {
  const rawValues: string[] = [];

  const pushSubclass = (raw: unknown) => {
    const value = String(raw ?? "").trim();
    if (!value) return;
    rawValues.push(value);
    const translated = subclassTranslations[value as keyof typeof subclassTranslations] || value;
    rawValues.push(translated);
  };

  pushSubclass((pers as any).subclass?.name);

  for (const mc of (pers.multiclasses ?? []) as any[]) {
    pushSubclass(mc?.subclass?.name);
  }

  const seen = new Set<string>();
  return rawValues
    .map((item) => normalizeAutoBadgeToken(item))
    .filter((item) => item.length > 0)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function isAutoCalculatedByBadgeText(badgeText: unknown, matchers: string[]): boolean {
  const normalized = normalizeAutoBadgeToken(badgeText);
  if (!normalized) return false;

  for (const token of AUTO_BADGE_STATIC_TOKENS) {
    const staticToken = normalizeAutoBadgeToken(token);
    if (normalized.includes(staticToken) || staticToken.includes(normalized)) return true;
  }

  for (const matcher of matchers) {
    if (!matcher) continue;
    if (normalized.includes(matcher) || matcher.includes(normalized)) return true;
  }

  return false;
}

function extractKnownSpellIds(pers: PersWithRelations): Set<number> {
  const ids = new Set<number>();
  for (const ps of ((pers as any).persSpells ?? []) as any[]) {
    const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
    if (Number.isFinite(spellId)) ids.add(spellId);
  }
  return ids;
}

function extractSpellLevelsById(pers: PersWithRelations): Record<number, number> {
  const levels: Record<number, number> = {};
  for (const ps of ((pers as any).persSpells ?? []) as any[]) {
    const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
    if (!Number.isFinite(spellId)) continue;
    const level = Number(ps?.spell?.level ?? 1);
    levels[spellId] = Number.isFinite(level) ? Math.max(0, Math.trunc(level)) : 1;
  }
  return levels;
}

// We need a server action to fetch the base spells list
// Let's assume we'll add getBaseSpells to spell-actions.ts or similar


interface AddSpellDialogProps {
  pers: PersWithRelations;
  isReadOnly?: boolean;
  triggerClassName?: string;
}

export default function AddSpellDialog({pers, isReadOnly, triggerClassName}: AddSpellDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState(true);
  const [useFilters, setUseFilters] = useState(true);
  const [knownSpellIds, setKnownSpellIds] = useState<Set<number>>(() => extractKnownSpellIds(pers));
  const [spellLevelById, setSpellLevelById] = useState<Record<number, number>>(() => extractSpellLevelsById(pers));
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    setKnownSpellIds(extractKnownSpellIds(pers));
    setSpellLevelById(extractSpellLevelsById(pers));
  }, [pers]);

  const autoBadgeMatchers = useMemo(() => collectCharacterBadgeMatchers(pers), [pers]);

  const autoExcludedSpellIds = useMemo(() => {
    const ids = new Set<number>();
    for (const ps of ((pers as any).persSpells ?? []) as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (isAutoCalculatedByBadgeText(ps?.badgeText, autoBadgeMatchers)) ids.add(spellId);
    }
    return ids;
  }, [pers, autoBadgeMatchers]);

  const effectiveKnownSpellsCount = useMemo(() => {
    let count = 0;
    for (const spellId of knownSpellIds) {
      if (autoExcludedSpellIds.has(spellId)) continue;
      const level = Number(spellLevelById[spellId] ?? 1);
      if (level === 0) continue;
      count += 1;
    }
    return count;
  }, [knownSpellIds, autoExcludedSpellIds, spellLevelById]);

  const effectiveKnownCantripsCount = useMemo(() => {
    let count = 0;
    for (const spellId of knownSpellIds) {
      if (autoExcludedSpellIds.has(spellId)) continue;
      const level = Number(spellLevelById[spellId] ?? 1);
      if (level !== 0) continue;
      count += 1;
    }
    return count;
  }, [knownSpellIds, autoExcludedSpellIds, spellLevelById]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SPELL_TOGGLED") {
        const payload = event.data as { type: string; persId?: unknown; spellId?: unknown; spellLevel?: unknown; added?: unknown };
        const payloadPersId = Number(payload?.persId);
        const payloadSpellId = Number(payload?.spellId);
        const payloadSpellLevel = Number(payload?.spellLevel);
        const isSamePers = Number.isFinite(payloadPersId) && payloadPersId === pers.persId;

        if (isSamePers && Number.isFinite(payloadSpellId) && typeof payload?.added === "boolean") {
          setKnownSpellIds((prev) => {
            const next = new Set(prev);
            if (payload.added) next.add(payloadSpellId);
            else next.delete(payloadSpellId);
            return next;
          });

          if (payload.added && Number.isFinite(payloadSpellLevel)) {
            setSpellLevelById((prev) => ({
              ...prev,
              [payloadSpellId]: Math.max(0, Math.trunc(payloadSpellLevel)),
            }));
          }
        }

        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, pers.persId]);

  // Calculate max spell level for embed mode
  const maxSpellLevel = useMemo(() => {
    const caster = calculateCasterLevel(pers as any);
    const casterLevel = Math.max(0, Math.min(20, Math.trunc(caster.casterLevel || 0)));
    const pactLevel = Math.max(0, Math.min(20, Math.trunc(caster.pactLevel || 0)));

    let standardMax = 0;
    if (casterLevel > 0) {
      const row = (SPELL_SLOT_PROGRESSION as any).FULL?.[casterLevel] as number[] | undefined;
      if (Array.isArray(row)) {
        for (let i = row.length - 1; i >= 0; i--) {
          if (row[i] > 0) {
            standardMax = i + 1;
            break;
          }
        }
      }
    }

    const pactRow = (SPELL_SLOT_PROGRESSION as any).PACT?.[pactLevel] as {
      slots: number;
      level: number
    } | undefined;
    const pactMax = pactRow?.level ? Math.max(0, Math.min(9, Math.trunc(pactRow.level))) : 0;

    return Math.max(standardMax, pactMax);
  }, [pers]);

  const knownSpellsTarget = useMemo(() => {
    const lines = getSpellcastingCountsLines(pers);
    const fixedTotal = lines.reduce((sum, line) => {
      if (line.spells.kind !== "fixed") return sum;
      return sum + Math.max(0, Math.trunc(line.spells.value));
    }, 0);

    const preparedCapForAllKnown = lines.reduce((sum, line) => {
      const isAllKnownCasterLine = line.spellsLabel.includes("знає всі — можна підготувати");
      if (!isAllKnownCasterLine) return sum;
      if (line.spells.kind !== "formula") return sum;
      if (typeof line.spells.value !== "number" || !Number.isFinite(line.spells.value)) return sum;
      return sum + Math.max(0, Math.trunc(line.spells.value));
    }, 0);

    if (fixedTotal > 0) return fixedTotal;
    if (preparedCapForAllKnown > 0) return preparedCapForAllKnown;
    return null;
  }, [pers]);

  const cantripTarget = useMemo(() => {
    const lines = getSpellcastingCountsLines(pers);
    const total = lines.reduce((sum, line) => sum + Math.max(0, Math.trunc(line.cantrips || 0)), 0);
    return total > 0 ? total : null;
  }, [pers]);

  const remainingKnownSpells = useMemo(() => {
    if (knownSpellsTarget === null) return null;
    return Math.max(0, knownSpellsTarget - effectiveKnownSpellsCount);
  }, [knownSpellsTarget, effectiveKnownSpellsCount]);

  const remainingCantrips = useMemo(() => {
    if (cantripTarget === null) return null;
    return Math.max(0, cantripTarget - effectiveKnownCantripsCount);
  }, [cantripTarget, effectiveKnownCantripsCount]);

  const buildSpellsUrl = useCallback((applyFilters: boolean) => {
    const params = new URLSearchParams();
    params.set("origin", "character");
    params.set("persId", String(pers.persId));
    params.set("persName", pers.name || `Персонаж #${pers.persId}`);
    if (typeof knownSpellsTarget === "number" && Number.isFinite(knownSpellsTarget)) {
      params.set("knownTarget", String(Math.max(0, Math.trunc(knownSpellsTarget))));
    }
    if (typeof cantripTarget === "number" && Number.isFinite(cantripTarget)) {
      params.set("cantripTarget", String(Math.max(0, Math.trunc(cantripTarget))));
    }
    if (autoExcludedSpellIds.size > 0) {
      params.set("knownExcluded", Array.from(autoExcludedSpellIds).sort((a, b) => a - b).join(","));
    }

    if (applyFilters) {
      if (maxSpellLevel > 0) params.set("maxSpellLevel", String(maxSpellLevel));
      // Add class filter
      const classNames: string[] = [];
      if (pers.class?.name) {
        const key = pers.class.name as keyof typeof classTranslations;
        classNames.push(classTranslations[key] || String(pers.class.name));
      }
      pers.multiclasses?.forEach((mc: any) => {
        if (mc.class?.name) {
          const key = mc.class.name as keyof typeof classTranslations;
          classNames.push(classTranslations[key] || String(mc.class.name));
        }
      });
      if (classNames.length > 0) params.set("cls", classNames.join(","));

      // Add subclass filter (spells page expects translated subclass names in `sub`)
      const subclassNames: string[] = [];
      if ((pers as any).subclass?.name) {
        const key = (pers as any).subclass.name as keyof typeof subclassTranslations;
        subclassNames.push(subclassTranslations[key] || String((pers as any).subclass.name));
      }
      pers.multiclasses?.forEach((mc: any) => {
        if (mc.subclass?.name) {
          const key = mc.subclass.name as keyof typeof subclassTranslations;
          classNames.push(subclassTranslations[key] || String(mc.subclass.name));
        }
      });
      if (subclassNames.length > 0) params.set("sub", Array.from(new Set(subclassNames)).join(","));
    }

    return `/spells?${params.toString()}`;
  }, [pers, maxSpellLevel, knownSpellsTarget, cantripTarget, autoExcludedSpellIds]);

  const url = useMemo(() => buildSpellsUrl(useFilters), [buildSpellsUrl, useFilters]);

  const classList = useMemo(() => {
    const names: string[] = [];
    if (pers.class?.name) names.push(classTranslations[pers.class.name as keyof typeof classTranslations] || pers.class.name);
    pers.multiclasses?.forEach((mc: any) => {
      if (mc.class?.name) names.push(classTranslations[mc.class.name as keyof typeof classTranslations] || mc.class.name);
    });
    return names;
  }, [pers]);

  const subclassList = useMemo(() => {
    const names: string[] = [];
    if ((pers as any).subclass?.name) {
      const key = (pers as any).subclass.name as keyof typeof subclassTranslations;
      names.push(subclassTranslations[key] || String((pers as any).subclass.name));
    }
    pers.multiclasses?.forEach((mc: any) => {
      if (mc.subclass?.name) {
        const key = mc.subclass.name as keyof typeof subclassTranslations;
        names.push(subclassTranslations[key] || String(mc.subclass.name));
      }
    });
    return Array.from(new Set(names));
  }, [pers]);

  return (
    <div className="space-y-2">
      <Dialog 
        open={open} 
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            startTransition(() => {
              router.refresh();
            });
            setConfirmMode(true);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isReadOnly}
            className={"h-8 gap-1.5 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 " + (triggerClassName ?? "")}
          >
            <Plus className="w-3.5 h-3.5"/>
            Додати
          </Button>
        </DialogTrigger>
        <DialogContent
          className={`${confirmMode ? 'max-w-md' : 'max-w-6xl'} bg-slate-900 border-white/10 text-white p-0 overflow-hidden flex flex-col ${confirmMode ? 'h-auto' : 'h-[90vh]'} transition-all duration-300`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {confirmMode ? (
            <div className="p-6 space-y-6">
              <div className="space-y-2 text-center text-slate-200">
                <div
                  className="mx-auto w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Filter className="w-6 h-6"/>
                </div>
                <DialogTitle className="text-xl font-bold">Фільтрація за персонажем</DialogTitle>
                <p className="text-sm text-slate-400">Чи бажаєте активувати фільтри вашого поточного
                  персонажа?</p>
              </div>

              <div className="glass-panel border border-white/10 rounded-xl p-4 bg-white/5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Класи:</span>
                  <span className="font-semibold text-indigo-300">{classList.join(", ") || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Підкласи:</span>
                  <span
                    className="font-semibold text-indigo-300">{subclassList.join(", ") || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Макс. рівень:</span>
                  <span
                    className="font-semibold text-indigo-300">{maxSpellLevel > 0 ? maxSpellLevel : "Замовляння"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setUseFilters(true);
                    setConfirmMode(false);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12"
                >
                  Так, з фільтрами
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUseFilters(false);
                    setConfirmMode(false);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Ні, без фільтрів
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="p-4 pr-14 border-b border-white/10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Search className="w-5 h-5 text-indigo-400"/>
                      Пошук заклять
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                      >
                        <ExternalLink className="w-4 h-4"/>
                        Відкрити окремо
                      </a>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    Заклинань (без заклинань підкласу): <span className="font-semibold">{effectiveKnownSpellsCount}</span>
                    {knownSpellsTarget !== null ? (
                      <span className="text-emerald-200/80"> / {knownSpellsTarget} · ще добрати: {remainingKnownSpells}</span>
                    ) : null}
                    {autoExcludedSpellIds.size > 0 ? (
                      <span className="text-emerald-200/80"> · заклинання підкласу не рахуємо: {autoExcludedSpellIds.size}</span>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                    Замовлянь: <span className="font-semibold">{effectiveKnownCantripsCount}</span>
                    {cantripTarget !== null ? (
                      <span className="text-sky-200/80"> / {cantripTarget} · ще добрати: {remainingCantrips}</span>
                    ) : null}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1">
                <iframe
                  title="Spells"
                  src={url}
                  className="h-full w-full border-0"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
