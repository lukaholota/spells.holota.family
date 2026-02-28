"use client";

import { motion, AnimatePresence } from "framer-motion";

import { PersWithRelations } from "@/lib/actions/pers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatModifier } from "@/lib/logic/utils";
import { ArrowUpDown, Check, ChevronDown, Plus, Wand2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { SPELL_SLOT_PROGRESSION } from "@/lib/refs/static";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeSpellFromPers, setPreparedSpellsForPers, updateSpellBadgeForPers } from "@/lib/actions/spell-actions";
import { spendPactSlot, spendSpellSlot, restorePactSlot, restoreSpellSlot } from "@/lib/actions/spell-slots";
import { useRouter } from "next/navigation";

import { calculateSpellAttack, calculateSpellDC } from "@/lib/logic/bonus-calculator";
import ModifyStatModal, { ModifyConfig } from "../ModifyStatModal";
import { Ability } from "@prisma/client";
import { calculateCasterLevel } from "@/lib/logic/spell-logic";
import AddSpellDialog from "../AddSpellDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatSpellCountValue, getSpellcastingCountsLines } from "@/lib/logic/spellcasting-progression";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SpellListGroup from "@/lib/components/characterSheet/shared/SpellListGroup";
import { classTranslations, subclassTranslations } from "@/lib/refs/translation";

const SPELL_BADGE_COLORS = [
  { name: "Sky", value: "#38bdf8" },
  { name: "Mint", value: "#34d399" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Rose", value: "#fb7185" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Slate", value: "#94a3b8" },
  { name: "Lime", value: "#a3e635" },
  { name: "Teal", value: "#2dd4bf" },
] as const;

const BADGE_COLOR_CLASS = "#fb7185";
const BADGE_COLOR_SUBCLASS = "#fbbf24";
const BADGE_COLOR_BASE = "#a78bfa";
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
  const normalized = rawValues
    .map((item) => normalizeAutoBadgeToken(item))
    .filter((item) => item.length > 0)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });

  return normalized;
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

interface MagicSlideProps {
  pers: PersWithRelations;
  onPersUpdate: (next: PersWithRelations) => void;
  isReadOnly?: boolean;
}

export default function MagicSlide({ pers, onPersUpdate, isReadOnly }: MagicSlideProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [prepareOpen, setPrepareOpen] = useState(false);
  const [prepareSelection, setPrepareSelection] = useState<Set<number>>(() => new Set());
  const [prepareQuery, setPrepareQuery] = useState("");
  const [prepareSortMode, setPrepareSortMode] = useState<"level" | "badge">("level");
  const [sortMode, setSortMode] = useState<"level" | "badge">("level");
  const [badgeEditorOpen, setBadgeEditorOpen] = useState(false);
  const [badgeEditorSpellId, setBadgeEditorSpellId] = useState<number | null>(null);
  const [badgeEditorSpellName, setBadgeEditorSpellName] = useState<string>("");
  const [badgeEditorText, setBadgeEditorText] = useState<string>("");
  const [badgeEditorColor, setBadgeEditorColor] = useState<string>(SPELL_BADGE_COLORS[0].value);
  const [confirmDeleteInBadgeEditor, setConfirmDeleteInBadgeEditor] = useState(false);

  const [localPers, setLocalPers] = useState<PersWithRelations>(pers);
  const [modifyConfig, setModifyConfig] = useState<ModifyConfig | null>(null);

  useEffect(() => {
    setLocalPers(pers);
  }, [pers]);

  const spellcastingAbility = localPers.class?.primaryCastingStat;
  
  const spellAttackBonus = useMemo(() => {
    if (!spellcastingAbility) return 0;
    return calculateSpellAttack(localPers, spellcastingAbility as Ability);
  }, [localPers, spellcastingAbility]);

  const spellSaveDC = useMemo(() => {
    if (!spellcastingAbility) return 8;
    return calculateSpellDC(localPers, spellcastingAbility as Ability);
  }, [localPers, spellcastingAbility]);

  const [localPersSpells, setLocalPersSpells] = useState(() => (localPers as any).persSpells ?? []);
  const [spellQuery, setSpellQuery] = useState("");

  // If data refreshes from server, keep local list in sync.
  useEffect(() => {
    setLocalPersSpells((localPers as any).persSpells ?? []);
  }, [localPers]);

  const [localCurrentSlots, setLocalCurrentSlots] = useState<number[]>(() => {
    const raw = (pers.currentSpellSlots ?? []) as number[];
    return Array.from({ length: 9 }, (_, idx) => {
      const v = raw[idx];
      return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
    });
  });

  const [localPactSlots, setLocalPactSlots] = useState(pers.currentPactSlots ?? 0);
  const [openSlotLevel, setOpenSlotLevel] = useState<number | null>(null);
  const [openPactSlots, setOpenPactSlots] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenSlotLevel(null);
      setOpenPactSlots(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    const currentSpellSlots = localPers.currentSpellSlots;
    const currentPactSlots = (localPers as any).currentPactSlots;
    setLocalCurrentSlots(
      Array.from({ length: 9 }, (_, idx) => {
        const v = (currentSpellSlots as number[])?.[idx];
        return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
      })
    );
    setLocalPactSlots(Number.isFinite(currentPactSlots) ? Math.max(0, Math.trunc(currentPactSlots)) : 0);
  }, [localPers]);

  const caster = useMemo(() => calculateCasterLevel(localPers as any), [localPers]);

  const spellcastingCounts = useMemo(() => {
	return getSpellcastingCountsLines(localPers);
  }, [localPers]);

  const autoBadgeMatchers = useMemo(() => collectCharacterBadgeMatchers(localPers), [localPers]);

  const autoExcludedSpellIds = useMemo(() => {
    const ids = new Set<number>();
    for (const ps of localPersSpells as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (isAutoCalculatedByBadgeText(ps?.badgeText, autoBadgeMatchers)) ids.add(spellId);
    }
    return ids;
  }, [localPersSpells, autoBadgeMatchers]);

  const autoExcludedCount = useMemo(() => autoExcludedSpellIds.size, [autoExcludedSpellIds]);

  const knownSpellsCount = useMemo(() => {
    const ids = new Set<number>();
    for (const ps of localPersSpells as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (autoExcludedSpellIds.has(spellId)) continue;
      ids.add(spellId);
    }
    return ids.size;
  }, [localPersSpells, autoExcludedSpellIds]);

  const preparedSpellsCount = useMemo(() => {
    const ids = new Set<number>();
    for (const ps of localPersSpells as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (autoExcludedSpellIds.has(spellId)) continue;
      const level = Number(ps?.spell?.level ?? 0);
      if (Number.isFinite(level) && level === 0) continue;
      if (Boolean(ps?.isPrepared)) ids.add(spellId);
    }
    return ids.size;
  }, [localPersSpells, autoExcludedSpellIds]);

  const maxSlots = useMemo(() => {
    const level = Math.max(0, Math.min(20, Math.trunc(caster.casterLevel || 0)));
    if (level <= 0) return Array.from({ length: 9 }, () => 0);
    const row = (SPELL_SLOT_PROGRESSION as any).FULL?.[level] as number[] | undefined;
    if (!Array.isArray(row)) return Array.from({ length: 9 }, () => 0);
    return Array.from({ length: 9 }, (_, idx) => {
      const v = row[idx];
      return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
    });
  }, [caster.casterLevel]);

  const pactInfo = useMemo(() => {
    const pactLevel = Math.max(0, Math.min(20, Math.trunc(caster.pactLevel || 0)));
    const pact = (SPELL_SLOT_PROGRESSION as any).PACT?.[pactLevel] as { slots: number; level: number } | undefined;
    if (!pact || pactLevel <= 0) return null;
    return {
      max: Math.max(0, Math.trunc(pact.slots)),
      slotLevel: Math.max(1, Math.min(9, Math.trunc(pact.level))),
    };
  }, [caster.pactLevel]);

  const spellsByLevel = useMemo(() => {
    const query = spellQuery.trim().toLowerCase();
    const source = (localPersSpells as any[]).filter((ps) => {
      if (!Boolean(ps?.isPrepared)) return false;
      if (!query) return true;
      const name = String(ps?.spell?.name ?? "").toLowerCase();
      return name.includes(query);
    });

    const byLevel: Record<number, any[]> = {};
    for (const ps of source) {
      const level = Number(ps?.spell?.level ?? 0);
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(ps);
    }

    for (const [k, list] of Object.entries(byLevel)) {
      byLevel[Number(k)] = list.sort((a, b) => {
        const aHasBadge = String(a?.badgeText ?? "").trim().length > 0;
        const bHasBadge = String(b?.badgeText ?? "").trim().length > 0;
        if (aHasBadge !== bHasBadge) return aHasBadge ? -1 : 1;

        const aName = String(a?.spell?.name ?? "");
        const bName = String(b?.spell?.name ?? "");
        return aName.localeCompare(bName, "uk", { sensitivity: "base" });
      });
    }

    return byLevel;
  }, [localPersSpells, spellQuery]);

  const spellsByBadge = useMemo(() => {
    const query = spellQuery.trim().toLowerCase();
    const source = (localPersSpells as any[]).filter((ps) => {
      if (!Boolean(ps?.isPrepared)) return false;
      if (!query) return true;
      const name = String(ps?.spell?.name ?? "").toLowerCase();
      return name.includes(query);
    });

    const byBadge: Record<string, any[]> = {};
    for (const ps of source) {
      const badge = String(ps?.badgeText ?? "").trim() || "Без бейджа";
      if (!byBadge[badge]) byBadge[badge] = [];
      byBadge[badge].push(ps);
    }

    for (const [key, list] of Object.entries(byBadge)) {
      byBadge[key] = list.sort((a, b) => {
        const levelA = Number(a?.spell?.level ?? 0);
        const levelB = Number(b?.spell?.level ?? 0);
        if (levelA !== levelB) return levelA - levelB;
        const aName = String(a?.spell?.name ?? "");
        const bName = String(b?.spell?.name ?? "");
        return aName.localeCompare(bName, "uk", { sensitivity: "base" });
      });
    }

    return byBadge;
  }, [localPersSpells, spellQuery]);

  const badgeGroups = useMemo(() => {
    return Object.keys(spellsByBadge).sort((a, b) => {
      if (a === "Без бейджа") return 1;
      if (b === "Без бейджа") return -1;
      return a.localeCompare(b, "uk", { sensitivity: "base" });
    });
  }, [spellsByBadge]);

  const levels = useMemo(() => {
    return Object.keys(spellsByLevel)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }, [spellsByLevel]);

  const openSpell = (spellId: number) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("spell", String(spellId));
    window.history.pushState({}, "", url);
    window.dispatchEvent(new CustomEvent("spell:open", { detail: { spellId: String(spellId) } }));
    window.dispatchEvent(new Event("locationchange"));
  };

  const openBadgeEditor = (ps: any) => {
    const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
    if (!Number.isFinite(spellId)) return;
    setBadgeEditorSpellId(spellId);
    setBadgeEditorSpellName(String(ps?.spell?.name ?? "Заклинання"));
    setBadgeEditorText(String(ps?.badgeText ?? ""));
    setBadgeEditorColor(String(ps?.badgeColor ?? "").trim() || SPELL_BADGE_COLORS[0].value);
    setConfirmDeleteInBadgeEditor(false);
    setBadgeEditorOpen(true);
  };

  useEffect(() => {
    if (!prepareOpen) return;
    const preparedIds = new Set<number>();
    for (const ps of localPersSpells as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (Boolean(ps?.isPrepared)) preparedIds.add(spellId);
    }
    setPrepareSelection(preparedIds);
  }, [prepareOpen, localPersSpells]);

  const allCharacterSpells = useMemo(() => {
    const source = (localPersSpells as any[]).slice();
    return source.sort((a, b) => {
      const levelA = Number(a?.spell?.level ?? 0);
      const levelB = Number(b?.spell?.level ?? 0);
      if (levelA !== levelB) return levelA - levelB;
      const aName = String(a?.spell?.name ?? "");
      const bName = String(b?.spell?.name ?? "");
      return aName.localeCompare(bName, "uk", { sensitivity: "base" });
    });
  }, [localPersSpells]);

  const prepareSpellsByLevel = useMemo(() => {
    const query = prepareQuery.trim().toLowerCase();
    const source = allCharacterSpells.filter((ps) => {
      if (!query) return true;
      const name = String(ps?.spell?.name ?? "").toLowerCase();
      return name.includes(query);
    });

    const byLevel: Record<number, any[]> = {};
    for (const ps of source) {
      const level = Number(ps?.spell?.level ?? 0);
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(ps);
    }

    for (const [k, list] of Object.entries(byLevel)) {
      byLevel[Number(k)] = list.sort((a, b) => {
        const aName = String(a?.spell?.name ?? "");
        const bName = String(b?.spell?.name ?? "");
        return aName.localeCompare(bName, "uk", { sensitivity: "base" });
      });
    }

    return byLevel;
  }, [allCharacterSpells, prepareQuery]);

  const prepareLevels = useMemo(() => {
    return Object.keys(prepareSpellsByLevel)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }, [prepareSpellsByLevel]);

  const prepareSpellsByBadge = useMemo(() => {
    const query = prepareQuery.trim().toLowerCase();
    const source = allCharacterSpells.filter((ps) => {
      if (!query) return true;
      const name = String(ps?.spell?.name ?? "").toLowerCase();
      return name.includes(query);
    });

    const byBadge: Record<string, any[]> = {};
    for (const ps of source) {
      const badge = String(ps?.badgeText ?? "").trim() || "Без бейджа";
      if (!byBadge[badge]) byBadge[badge] = [];
      byBadge[badge].push(ps);
    }

    for (const [key, list] of Object.entries(byBadge)) {
      byBadge[key] = list.sort((a, b) => {
        const levelA = Number(a?.spell?.level ?? 0);
        const levelB = Number(b?.spell?.level ?? 0);
        if (levelA !== levelB) return levelA - levelB;
        const aName = String(a?.spell?.name ?? "");
        const bName = String(b?.spell?.name ?? "");
        return aName.localeCompare(bName, "uk", { sensitivity: "base" });
      });
    }

    return byBadge;
  }, [allCharacterSpells, prepareQuery]);

  const prepareBadgeGroups = useMemo(() => {
    return Object.keys(prepareSpellsByBadge).sort((a, b) => {
      if (a === "Без бейджа") return 1;
      if (b === "Без бейджа") return -1;
      return a.localeCompare(b, "uk", { sensitivity: "base" });
    });
  }, [prepareSpellsByBadge]);

  const prepareSelectionEffectiveCount = useMemo(() => {
    let count = 0;
    for (const spellId of prepareSelection) {
      if (autoExcludedSpellIds.has(spellId)) continue;
      const ps = (localPersSpells as any[]).find((item) => Number(item?.spellId ?? item?.spell?.spellId) === spellId);
      const level = Number(ps?.spell?.level ?? 0);
      if (Number.isFinite(level) && level === 0) continue;
      count += 1;
    }
    return count;
  }, [prepareSelection, autoExcludedSpellIds, localPersSpells]);

  const renderSpellcastingCountsBlock = (options?: { preparedCountOverride?: number }) => {
    if (spellcastingCounts.length === 0) return null;

    const preparedCount = Number.isFinite(options?.preparedCountOverride)
      ? Number(options?.preparedCountOverride)
      : preparedSpellsCount;

    return (
      <Collapsible defaultOpen={false} className="rounded-lg border border-white/10 bg-white/5">
        <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
              Кількість відомих / підготовлених
            </div>
            <div className="text-xs text-slate-400">Залежить від рівня класу та модифікатора</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="mb-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            Відомих: <span className="font-semibold">{knownSpellsCount}</span>
            {" · "}
            Підготовлено: <span className="font-semibold">{preparedCount}</span>
          </div>

          {autoExcludedCount > 0 ? (
            <div className="mb-2 rounded-md border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/90">
              Заклинання підкласу не рахуємо: {autoExcludedCount}.
            </div>
          ) : null}

          <div className="space-y-2">
            {spellcastingCounts.map((line) => (
              <div key={line.key} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-sm font-semibold text-slate-100">
                  {line.name} <span className="text-xs font-normal text-slate-400">(рів. {line.level})</span>
                </div>
                <div className="text-xs text-slate-200/80">
                  Замовлянь: <span className="font-semibold text-slate-100">{line.cantrips}</span>
                  {", "}
                  {line.spellsLabel}: <span className="font-semibold text-slate-100">{formatSpellCountValue(line.spells)}</span>
                  {line.spellsNote ? ` ${line.spellsNote}` : null}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const preparedIdsSnapshot = useMemo(() => {
    const ids = new Set<number>();
    for (const ps of localPersSpells as any[]) {
      const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
      if (!Number.isFinite(spellId)) continue;
      if (Boolean(ps?.isPrepared)) ids.add(spellId);
    }
    return ids;
  }, [localPersSpells]);

  const hasPrepareSelectionChanges = useMemo(() => {
    if (!prepareOpen) return false;
    if (prepareSelection.size !== preparedIdsSnapshot.size) return true;
    for (const id of prepareSelection) {
      if (!preparedIdsSnapshot.has(id)) return true;
    }
    return false;
  }, [prepareOpen, prepareSelection, preparedIdsSnapshot]);

  const commitPrepareSelection = () => {
    const selectedIds = Array.from(prepareSelection);

    setLocalPersSpells((prev: any[]) =>
      prev.map((item) => {
        const itemSpellId = Number(item?.spellId ?? item?.spell?.spellId);
        if (!Number.isFinite(itemSpellId)) return item;
        return { ...item, isPrepared: prepareSelection.has(itemSpellId) };
      })
    );

    startTransition(async () => {
      const res = await setPreparedSpellsForPers({
        persId: localPers.persId,
        spellIds: selectedIds,
      });

      if (!res.success) {
        router.refresh();
        return;
      }

      router.refresh();
    });
  };

  const handlePrepareOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPrepareOpen(true);
      return;
    }

    if (hasPrepareSelectionChanges && !isReadOnly) {
      commitPrepareSelection();
    }

    setPrepareOpen(false);
  };

  const badgeClassHints = useMemo(() => {
    const values: string[] = [];

    const pushClass = (raw: unknown) => {
      const value = String(raw ?? "").trim();
      if (!value) return;
      const translated = classTranslations[value as keyof typeof classTranslations] || value;
      values.push(translated);
    };

    pushClass(localPers.class?.name);
    for (const mc of (localPers.multiclasses ?? []) as any[]) {
      pushClass(mc?.class?.name);
    }

    const seen = new Set<string>();
    return values.filter((value) => {
      const key = value.toLocaleLowerCase("uk");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localPers]);

  const badgeSubclassHints = useMemo(() => {
    const values: string[] = [];

    const pushSubclass = (raw: unknown) => {
      const value = String(raw ?? "").trim();
      if (!value) return;
      const translated = subclassTranslations[value as keyof typeof subclassTranslations] || value;
      values.push(translated);
    };

    pushSubclass((localPers as any).subclass?.name);
    for (const mc of (localPers.multiclasses ?? []) as any[]) {
      pushSubclass(mc?.subclass?.name);
    }

    const seen = new Set<string>();
    return values.filter((value) => {
      const key = value.toLocaleLowerCase("uk");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localPers]);

  const badgeBaseHints = useMemo(() => {
    return ["архетип", "підклас", "клас", "раса", "підраса"];
  }, []);

  const applyBadgeHint = (value: string, color: string) => {
    const next = String(value || "").trim().slice(0, 24);
    setBadgeEditorText(next);
    setBadgeEditorColor(color);
  };

  return (
    <div
      className="h-full overflow-y-auto p-4 space-y-4"
    >

      {/* Spell Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card 
            className={"glass-card bg-fuchsia-500/20 border-fuchsia-400/40 transition " + (!isReadOnly ? "cursor-pointer hover:bg-fuchsia-500/30 active:scale-[0.98]" : "")}
            onClick={(_e) => {
                _e.stopPropagation();
                if (!isReadOnly) setModifyConfig({ type: "simple", field: "spellAttack" });
            }}
        >
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">Бонус атаки Заклинаннями</div>
            <div className="text-2xl font-bold text-fuchsia-50 drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]">{formatModifier(spellAttackBonus)}</div>
          </CardContent>
        </Card>
        <Card 
            className={"glass-card bg-fuchsia-500/20 border-fuchsia-400/40 transition " + (!isReadOnly ? "cursor-pointer hover:bg-fuchsia-500/30 active:scale-[0.98]" : "")}
            onClick={(_e) => {
                _e.stopPropagation();
                if (!isReadOnly) setModifyConfig({ type: "simple", field: "spellDC" });
            }}
        >
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">СК (Складість Ряткидка)</div>
            <div className="text-2xl font-bold text-fuchsia-50 drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]">{spellSaveDC}</div>
          </CardContent>
        </Card>
      </div>

      {/* Spell Slots */}
      <Card className="glass-card bg-white/5 border-purple-300/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-50">
            <span className="uppercase tracking-wide text-indigo-300">Комірки</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, idx) => {
              const level = idx + 1;
              const cur = localCurrentSlots[idx] ?? 0;
              const max = maxSlots[idx] ?? 0;
              
              const canSpend = cur > 0;
              const canRestore = cur < max;

              return (
                <div key={level} className="relative">
                  <button
                    type="button"
                    disabled={isPending || max <= 0 || isReadOnly}
                    title={isReadOnly ? "Режим перегляду" : max > 0 ? "Натисніть, щоб керувати комірками" : "Комірки недоступні"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (max > 0 && !isReadOnly) {
                        setOpenSlotLevel(openSlotLevel === level ? null : level);
                        setOpenPactSlots(false);
                      }
                    }}
                    className={
                      "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center transition active:scale-95 touch-manipulation " +
                      (max > 0 && !isReadOnly ? "hover:bg-white/10 cursor-pointer" : "opacity-70 cursor-not-allowed") +
                      (openSlotLevel === level ? " ring-2 ring-indigo-500/50 bg-white/10" : "")
                    }
                  >
                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{level}-й</div>
                    <div className="text-sm font-semibold text-slate-50">
                      {cur}/{max}
                    </div>
                  </button>

                  <AnimatePresence>
                    {openSlotLevel === level && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] min-w-[120px] glass-card overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 p-1 text-slate-100 shadow-xl backdrop-blur-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          disabled={!canSpend || isPending}
                          className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                          onClick={async () => {
                            setOpenSlotLevel(null);
                            if (!canSpend) return;
                            setLocalCurrentSlots((prev) => {
                              const next = prev.slice();
                              next[idx] = Math.max(0, (next[idx] ?? 0) - 1);
                              return next;
                            });
                            startTransition(async () => {
                              const res = await spendSpellSlot(localPers.persId, level);
                              if (!res.success) {
                                router.refresh();
                                return;
                              }
                              setLocalCurrentSlots(
                                Array.from({ length: 9 }, (_, j) => {
                                  const v = res.currentSpellSlots[j];
                                  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
                                })
                              );
                              router.refresh();
                            });
                          }}
                        >
                          Витратити
                        </button>
                        <button
                          disabled={!canRestore || isPending}
                          className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                          onClick={async () => {
                            setOpenSlotLevel(null);
                            if (!canRestore) return;
                            setLocalCurrentSlots((prev) => {
                              const next = prev.slice();
                              next[idx] = Math.min(max, (next[idx] ?? 0) + 1);
                              return next;
                            });
                            startTransition(async () => {
                              const res = await restoreSpellSlot(localPers.persId, level);
                              if (!res.success) {
                                router.refresh();
                                return;
                              }
                              setLocalCurrentSlots(
                                Array.from({ length: 9 }, (_, j) => {
                                  const v = res.currentSpellSlots[j];
                                  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
                                })
                              );
                              router.refresh();
                            });
                          }}
                        >
                          Відновити
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {pactInfo ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between relative">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Магія пакту</div>
                <div className="text-sm font-semibold text-slate-50">
                  {localPactSlots}/{pactInfo.max} • рівень комірки: {pactInfo.slotLevel}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending || isReadOnly}
                title={isReadOnly ? "Режим перегляду" : "Натисніть, щоб керувати комірками Магії пакту"}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPactSlots(!openPactSlots);
                  setOpenSlotLevel(null);
                }}
              >
                Керувати
              </Button>

              <AnimatePresence>
                {openPactSlots && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute bottom-full right-0 mb-2 z-[60] min-w-[120px] glass-card overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 p-1 text-slate-100 shadow-xl backdrop-blur-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      disabled={localPactSlots <= 0 || isPending}
                      className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                      onClick={async () => {
                        setOpenPactSlots(false);
                        if (!pactInfo || localPactSlots <= 0) return;
                        setLocalPactSlots((v) => Math.max(0, v - 1));
                        startTransition(async () => {
                          const res = await spendPactSlot(localPers.persId);
                          if (!res.success) {
                            router.refresh();
                            return;
                          }
                          setLocalPactSlots(Math.max(0, Math.trunc(res.currentPactSlots)));
                          router.refresh();
                        });
                      }}
                    >
                      Витратити
                    </button>
                    <button
                      disabled={localPactSlots >= pactInfo.max || isPending}
                      className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                      onClick={async () => {
                        setOpenPactSlots(false);
                        if (!pactInfo || localPactSlots >= pactInfo.max) return;
                        setLocalPactSlots((v) => Math.min(pactInfo.max, v + 1));
                        startTransition(async () => {
                          const res = await restorePactSlot(localPers.persId);
                          if (!res.success) {
                            router.refresh();
                            return;
                          }
                          setLocalPactSlots(Math.max(0, Math.trunc(res.currentPactSlots)));
                          router.refresh();
                        });
                      }}
                    >
                      Відновити
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Spell List */}
      <Card className="glass-card bg-white/5 border-purple-300/20">
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-50">
            <Wand2 className="w-5 h-5" />
            <span className="uppercase tracking-wide text-indigo-300">Заклинання</span>
          </CardTitle>
          <div className="w-full">
            {!isReadOnly && (
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setPrepareOpen(true)}
                  className="h-9 w-full justify-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                >
                  <WandSparkles className="h-3.5 w-3.5" />
                  Підготувати
                </Button>
                <AddSpellDialog 
                  pers={localPers} 
                  triggerClassName="h-9 w-full justify-center"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderSpellcastingCountsBlock()}

          <Input
            value={spellQuery}
            onChange={(e) => setSpellQuery(e.target.value)}
            placeholder="Пошук заклинань…"
            className="bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-400"
          />

          <div className="w-full">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSortMode((prev) => (prev === "level" ? "badge" : "level"))}
              className="h-9 w-full justify-between gap-2 border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortMode === "level" ? "Сортування: за рівнем" : "Сортування: за бейджем"}
            </Button>
          </div>

          {sortMode === "level" && levels.map((level) => {
            const list = spellsByLevel[level] ?? [];
            if (!list.length) return null;

            return (
              <SpellListGroup
                key={level}
                title={level === 0 ? "Замовляння" : "Рівень " + level}
                spells={list}
                isPending={isPending}
                isReadOnly={isReadOnly}
                onOpenSpell={openSpell}
                onOpenSettings={openBadgeEditor}
              />
            );
          })}

          {sortMode === "badge" && badgeGroups.map((badge) => {
            const list = spellsByBadge[badge] ?? [];
            if (!list.length) return null;

            return (
              <SpellListGroup
                key={badge}
                title={badge}
                spells={list}
                isPending={isPending}
                isReadOnly={isReadOnly}
                onOpenSpell={openSpell}
                onOpenSettings={openBadgeEditor}
                subtitleVariant="with-level"
              />
            );
          })}

          {((sortMode === "level" && levels.length === 0) || (sortMode === "badge" && badgeGroups.length === 0)) && (
            <div className="text-purple-300/60 text-sm text-center py-8">
              {spellQuery.trim() ? "Нічого не знайдено" : "Підготовлені заклинання відсутні"}
            </div>
          )}

        </CardContent>
      </Card>

      <Dialog open={prepareOpen} onOpenChange={handlePrepareOpenChange}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[88dvh] overflow-hidden overflow-x-hidden gap-0 border-white/15 bg-gradient-to-b from-slate-900/82 to-slate-900/70 p-4 text-slate-100 grid-rows-[auto,minmax(0,1fr)] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:max-w-[620px] sm:p-6">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle className="font-serif text-2xl text-slate-100">Підготувати заклинання</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden">
            <p className="text-sm text-slate-400">
              Оберіть заклинання, які мають відображатися у списку заклинань персонажа.
            </p>

            <Input
              value={prepareQuery}
              onChange={(e) => setPrepareQuery(e.target.value)}
              placeholder="Пошук заклинань…"
              className="h-10 rounded-lg border-white/10 bg-slate-900/50 text-slate-100 placeholder:text-slate-500"
            />

            {renderSpellcastingCountsBlock({ preparedCountOverride: prepareSelectionEffectiveCount })}

            <div className="w-full">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPrepareSortMode((prev) => (prev === "level" ? "badge" : "level"))}
                className="h-9 w-full justify-between gap-2 border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {prepareSortMode === "level" ? "Сортування: за рівнем" : "Сортування: за бейджем"}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/15 bg-white/8 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5">
                {prepareSortMode === "level" && prepareLevels.length === 0 ? (
                  <p className="p-3 text-sm text-slate-400">У персонажа ще немає заклинань.</p>
                ) : prepareSortMode === "badge" && prepareBadgeGroups.length === 0 ? (
                  <p className="p-3 text-sm text-slate-400">У персонажа ще немає заклинань.</p>
                ) : (
                  <div className="space-y-3">
                    {prepareSortMode === "level" && prepareLevels.map((level) => {
                      const list = prepareSpellsByLevel[level] ?? [];
                      if (!list.length) return null;

                      return (
                        <SpellListGroup
                          key={`prepare-${level}`}
                          title={level === 0 ? "Замовляння" : "Рівень " + level}
                          spells={list}
                          isPending={isPending}
                          isReadOnly={isReadOnly}
                          onOpenSpell={openSpell}
                          onOpenSettings={openBadgeEditor}
                          rightActionPlacement="belowMeta"
                          rightAction={(ps: any) => {
                            const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
                            const checked = prepareSelection.has(spellId);

                            return (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                aria-label={checked ? "Зняти підготовку" : "Підготувати заклинання"}
                                disabled={!Number.isFinite(spellId) || isPending || isReadOnly}
                                className={
                                  "h-8 w-[82px] shrink-0 border transition-colors " +
                                  (checked
                                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!Number.isFinite(spellId) || isReadOnly) return;
                                  setPrepareSelection((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(spellId)) next.delete(spellId);
                                    else next.add(spellId);
                                    return next;
                                  });
                                }}
                              >
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                                  {checked ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                  підгот.
                                </span>
                              </Button>
                            );
                          }}
                        />
                      );
                    })}

                    {prepareSortMode === "badge" && prepareBadgeGroups.map((badge) => {
                      const list = prepareSpellsByBadge[badge] ?? [];
                      if (!list.length) return null;

                      return (
                        <SpellListGroup
                          key={`prepare-badge-${badge}`}
                          title={badge}
                          spells={list}
                          isPending={isPending}
                          isReadOnly={isReadOnly}
                          onOpenSpell={openSpell}
                          onOpenSettings={openBadgeEditor}
                          subtitleVariant="with-level"
                          rightActionPlacement="belowMeta"
                          rightAction={(ps: any) => {
                            const spellId = Number(ps?.spellId ?? ps?.spell?.spellId);
                            const checked = prepareSelection.has(spellId);

                            return (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                aria-label={checked ? "Зняти підготовку" : "Підготувати заклинання"}
                                disabled={!Number.isFinite(spellId) || isPending || isReadOnly}
                                className={
                                  "h-8 w-[82px] shrink-0 border transition-colors " +
                                  (checked
                                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!Number.isFinite(spellId) || isReadOnly) return;
                                  setPrepareSelection((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(spellId)) next.delete(spellId);
                                    else next.add(spellId);
                                    return next;
                                  });
                                }}
                              >
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                                  {checked ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                  підгот.
                                </span>
                              </Button>
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="text-slate-300 hover:bg-white/5" onClick={() => setPrepareOpen(false)} disabled={isPending}>
                Скасувати
              </Button>
              <Button
                className="border border-violet-400/30 bg-violet-500/20 text-violet-100 hover:bg-violet-500/30"
                disabled={isPending}
                onClick={() => {
                  commitPrepareSelection();
                  setPrepareOpen(false);
                }}
              >
                Застосувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={badgeEditorOpen}
        onOpenChange={(open) => {
          setBadgeEditorOpen(open);
          if (!open) {
            setConfirmDeleteInBadgeEditor(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px] glass-card border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Налаштування заклинання: {badgeEditorSpellName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Підказки (бейджики)</p>

              {badgeClassHints.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400">Класи персонажа</p>
                  <div className="flex flex-wrap gap-1.5">
                    {badgeClassHints.map((hint) => (
                      <button
                        key={`class-${hint}`}
                        type="button"
                        onClick={() => applyBadgeHint(hint, BADGE_COLOR_CLASS)}
                        className="rounded-md border border-rose-400/30 bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-100 hover:bg-rose-500/30"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {badgeSubclassHints.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400">Підкласи персонажа</p>
                  <div className="flex flex-wrap gap-1.5">
                    {badgeSubclassHints.map((hint) => (
                      <button
                        key={`subclass-${hint}`}
                        type="button"
                        onClick={() => applyBadgeHint(hint, BADGE_COLOR_SUBCLASS)}
                        className="rounded-md border border-amber-400/30 bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-100 hover:bg-amber-500/30"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400">Базові</p>
                <div className="flex flex-wrap gap-1.5">
                  {badgeBaseHints.map((hint) => (
                    <button
                      key={`base-${hint}`}
                      type="button"
                      onClick={() => applyBadgeHint(hint, BADGE_COLOR_BASE)}
                      className="rounded-md border border-violet-400/30 bg-violet-500/20 px-2 py-1 text-xs font-medium text-violet-100 hover:bg-violet-500/30"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Input
              value={badgeEditorText}
              onChange={(e) => setBadgeEditorText(e.target.value)}
              maxLength={24}
              placeholder="Текст бейджа"
              className="bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-400"
            />

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Колір бейджа</p>
              <div className="grid grid-cols-8 gap-2">
                {SPELL_BADGE_COLORS.map((color) => {
                  const isActive = badgeEditorColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      title={color.name}
                      className={`h-8 w-8 rounded-full border ${isActive ? "ring-2 ring-white/70" : "border-white/10"}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setBadgeEditorColor(color.value)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant={confirmDeleteInBadgeEditor ? "destructive" : "outline"}
                className={confirmDeleteInBadgeEditor ? "" : "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"}
                disabled={isPending || isReadOnly || !Number.isFinite(badgeEditorSpellId)}
                onClick={() => {
                  if (!Number.isFinite(badgeEditorSpellId) || isReadOnly) return;

                  if (!confirmDeleteInBadgeEditor) {
                    setConfirmDeleteInBadgeEditor(true);
                    return;
                  }

                  const spellId = Number(badgeEditorSpellId);
                  startTransition(async () => {
                    const res = await removeSpellFromPers({ persId: localPers.persId, spellId });
                    if (!res.success) return;

                    setLocalPersSpells((prev: any[]) =>
                      prev.filter((item) => Number(item?.spellId ?? item?.spell?.spellId) !== spellId)
                    );
                    setBadgeEditorOpen(false);
                    setConfirmDeleteInBadgeEditor(false);
                    router.refresh();
                  });
                }}
              >
                {confirmDeleteInBadgeEditor ? "Підтвердити видалення" : "Видалити заклинання"}
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setBadgeEditorOpen(false)} disabled={isPending}>
                  Скасувати
                </Button>
                <Button
                  disabled={isPending || !Number.isFinite(badgeEditorSpellId)}
                  onClick={() => {
                    if (!Number.isFinite(badgeEditorSpellId)) return;
                    const spellId = Number(badgeEditorSpellId);
                    const nextText = badgeEditorText.trim().slice(0, 24);

                    setLocalPersSpells((prev: any[]) =>
                      prev.map((item) => {
                        const itemSpellId = Number(item?.spellId ?? item?.spell?.spellId);
                        if (itemSpellId !== spellId) return item;
                        return {
                          ...item,
                          badgeText: nextText || null,
                          badgeColor: nextText ? badgeEditorColor : null,
                        };
                      })
                    );

                    startTransition(async () => {
                      const res = await updateSpellBadgeForPers({
                        persId: localPers.persId,
                        spellId,
                        badgeText: nextText,
                        badgeColor: badgeEditorColor,
                      });
                      if (!res.success) {
                        router.refresh();
                        return;
                      }

                      setLocalPersSpells((prev: any[]) =>
                        prev.map((item) => {
                          const itemSpellId = Number(item?.spellId ?? item?.spell?.spellId);
                          if (itemSpellId !== spellId) return item;
                          return {
                            ...item,
                            badgeText: res.badgeText,
                            badgeColor: res.badgeColor,
                          };
                        })
                      );
                      setBadgeEditorOpen(false);
                      router.refresh();
                    });
                  }}
                >
                  Зберегти
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModifyStatModal 
        open={modifyConfig !== null}
        onOpenChange={(open) => !open && setModifyConfig(null)}
        pers={localPers}
        onPersUpdate={(next) => {
            setLocalPers(next);
            onPersUpdate(next);
        }}
        config={modifyConfig}
      />
    </div>
  );
}
