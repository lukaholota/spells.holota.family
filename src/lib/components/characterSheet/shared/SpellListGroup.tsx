"use client";

import { ReactNode, type ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Sparkles,
  WandSparkles,
  Clock3,
  BookOpen,
  Flame,
  Skull,
  Shield,
  Eye,
  Heart,
  Ghost,
  Atom,
  CircleDashed,
} from "lucide-react";
import { spellSchoolTranslations } from "@/lib/refs/translation";

type SchoolVisual = {
  icon: ComponentType<{ className?: string }>;
  iconWrap: string;
  iconColor: string;
  badgeClass: string;
};

const DEFAULT_SCHOOL_VISUAL: SchoolVisual = {
  icon: CircleDashed,
  iconWrap: "bg-slate-900/65 border-slate-600/60",
  iconColor: "text-slate-300",
  badgeClass: "border-slate-600/60 bg-slate-900/55",
};

function schoolVisualByValue(school: string | null | undefined): SchoolVisual {
  const key = String(school ?? "").toLowerCase();

  if (key.includes("evocation") || key.includes("втілен")) {
    return {
      icon: Flame,
      iconWrap: "bg-rose-950/55 border-rose-800/50",
      iconColor: "text-rose-300",
      badgeClass: "border-rose-800/50 bg-rose-950/40",
    };
  }
  if (key.includes("necromancy") || key.includes("некром")) {
    return {
      icon: Skull,
      iconWrap: "bg-emerald-950/55 border-emerald-800/45",
      iconColor: "text-emerald-300",
      badgeClass: "border-emerald-800/45 bg-emerald-950/35",
    };
  }
  if (key.includes("abjuration") || key.includes("огородж") || key.includes("захист")) {
    return {
      icon: Shield,
      iconWrap: "bg-sky-950/55 border-sky-800/45",
      iconColor: "text-sky-300",
      badgeClass: "border-sky-800/45 bg-sky-950/35",
    };
  }
  if (key.includes("conjuration") || key.includes("виклик")) {
    return {
      icon: WandSparkles,
      iconWrap: "bg-teal-950/55 border-teal-800/45",
      iconColor: "text-teal-300",
      badgeClass: "border-teal-800/45 bg-teal-950/35",
    };
  }
  if (key.includes("divination") || key.includes("віщ") || key.includes("ворож")) {
    return {
      icon: Eye,
      iconWrap: "bg-amber-950/55 border-amber-800/50",
      iconColor: "text-amber-300",
      badgeClass: "border-amber-800/50 bg-amber-950/35",
    };
  }
  if (key.includes("enchantment") || key.includes("зачар") || key.includes("причар")) {
    return {
      icon: Heart,
      iconWrap: "bg-pink-950/55 border-pink-800/50",
      iconColor: "text-pink-300",
      badgeClass: "border-pink-800/50 bg-pink-950/35",
    };
  }
  if (key.includes("illusion") || key.includes("ілюз")) {
    return {
      icon: Ghost,
      iconWrap: "bg-cyan-950/55 border-cyan-800/45",
      iconColor: "text-cyan-100",
      badgeClass: "border-cyan-800/45 bg-cyan-950/35",
    };
  }
  if (key.includes("transmutation") || key.includes("перетвор")) {
    return {
      icon: Atom,
      iconWrap: "bg-purple-950/60 border-purple-800/50",
      iconColor: "text-purple-300",
      badgeClass: "border-purple-800/50 bg-purple-950/40",
    };
  }

  return DEFAULT_SCHOOL_VISUAL;
}

function levelShortLabel(level: number): string {
  return level === 0 ? "Замовляння" : `${level} рівень`;
}

function isPositiveFlag(value: unknown): boolean {
  const flag = String(value ?? "").trim().toLowerCase();
  return flag === "так" || flag === "yes" || flag === "true" || flag === "1";
}

function hexToRgbTuple(color: string): [number, number, number] | null {
  const raw = String(color || "").trim().replace("#", "");
  const hex = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function userBadgeStyle(badgeColor: string) {
  const rgb = hexToRgbTuple(badgeColor) ?? [148, 163, 184];
  const [r, g, b] = rgb;
  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.28), rgba(${r}, ${g}, ${b}, 0.12) 62%, rgba(${r}, ${g}, ${b}, 0.05))`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.52)`,
    color: "#f8fafc",
  } as const;
}

type SpellListGroupProps = {
  title: string;
  spells: any[];
  isPending: boolean;
  isReadOnly?: boolean;
  onOpenSpell: (spellId: number) => void;
  onOpenSettings: (persSpell: any) => void;
  subtitleVariant?: "default" | "with-level";
  rightAction?: (persSpell: any) => ReactNode;
  compact?: boolean;
  hideSettings?: boolean;
  rightActionPlacement?: "side" | "belowMeta";
};

export default function SpellListGroup({
  title,
  spells,
  isPending,
  isReadOnly,
  onOpenSpell,
  onOpenSettings,
  subtitleVariant: _subtitleVariant = "default",
  rightAction,
  compact = false,
  hideSettings = false,
  rightActionPlacement = "side",
}: SpellListGroupProps) {
  if (!spells.length) return null;

  return (
    <Card className="border-white/10 bg-transparent">
      <CardHeader className="pb-2 py-3">
        <CardTitle className="text-base flex justify-between items-center text-slate-200">
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        {spells.map((ps: any, i: number) => {
          const spell = ps?.spell;
          const spellId = Number(spell?.spellId);
          const badgeText = String(ps?.badgeText ?? "").trim();
          const badgeColor = String(ps?.badgeColor ?? "").trim() || "#94a3b8";
          const hasBadge = badgeText.length > 0;
          const schoolText = (spellSchoolTranslations as any)[spell?.school] || spell?.school || "—";
          const schoolVisual = schoolVisualByValue(spell?.school);
          const SchoolIcon = schoolVisual.icon;
          const hasRitual = isPositiveFlag(spell?.hasRitual);

          return (
            <div
              key={ps?.persSpellId ?? `${spellId}-${i}`}
              className={
                "group w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950/40 transition-all duration-300 hover:border-white/20 hover:bg-white/5 " +
                (compact ? "p-2.5" : "p-3")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (Number.isFinite(spellId)) onOpenSpell(spellId);
                    }}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-0.5 flex shrink-0 items-center justify-center rounded-md border ${schoolVisual.iconWrap} ${compact ? "h-8 w-8" : "h-9 w-9"}`}>
                        <SchoolIcon className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${schoolVisual.iconColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className={`truncate font-serif leading-tight text-slate-100 transition-colors group-hover:text-white ${compact ? "text-[15px]" : "text-base"}`}>
                          {spell?.name ?? "—"}
                        </div>

                        {rightActionPlacement === "belowMeta" ? (
                          <>
                            <div className={`mt-1.5 flex flex-wrap items-center text-slate-400 ${compact ? "gap-x-2 gap-y-0.5 text-[11px]" : "gap-x-3 gap-y-1 text-xs"}`}>
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} text-slate-500`} />
                                {levelShortLabel(Number(spell?.level ?? 0))}
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <Clock3 className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} text-slate-500`} />
                                {spell?.castingTime ?? "—"}
                              </span>
                            </div>

                            <div className={`mt-1.5 flex flex-wrap items-center text-slate-400 ${compact ? "gap-x-2 gap-y-0.5 text-[11px]" : "gap-x-3 gap-y-1 text-xs"}`}>
                              <span className={`inline-flex items-center rounded-sm border bg-gradient-to-br from-white/10 to-transparent px-1.5 py-[2px] font-mono tracking-wide text-slate-50 ${compact ? "text-[8px]" : "text-[9px]"} ${schoolVisual.badgeClass}`}>
                                {schoolText}
                              </span>

                              {hasRitual ? (
                                <span className={`inline-flex items-center rounded-sm border border-amber-800/50 bg-amber-950/40 px-1.5 py-0.5 font-mono tracking-wide text-amber-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                                  <BookOpen className={`mr-1 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
                                  РИТУАЛ
                                </span>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <div className={`mt-1.5 flex flex-wrap items-center text-slate-400 ${compact ? "gap-x-2 gap-y-0.5 text-[11px]" : "gap-x-3 gap-y-1 text-xs"}`}>
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} text-slate-500`} />
                              {levelShortLabel(Number(spell?.level ?? 0))}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Clock3 className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} text-slate-500`} />
                              {spell?.castingTime ?? "—"}
                            </span>

                            <span className={`inline-flex items-center rounded-sm border bg-gradient-to-br from-white/10 to-transparent px-1.5 py-[2px] font-mono tracking-wide text-slate-50 ${compact ? "text-[8px]" : "text-[9px]"} ${schoolVisual.badgeClass}`}>
                              {schoolText}
                            </span>

                            {hasRitual ? (
                              <span className={`inline-flex items-center rounded-sm border border-amber-800/50 bg-amber-950/40 px-1.5 py-0.5 font-mono tracking-wide text-amber-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                                <BookOpen className={`mr-1 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
                                РИТУАЛ
                              </span>
                            ) : null}

                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                </div>

                <div
                  className={
                    "shrink-0 " +
                    (rightActionPlacement === "belowMeta"
                      ? "flex flex-col items-end gap-2"
                      : "flex items-center gap-1.5")
                  }
                >
                  {rightAction && rightActionPlacement === "side" ? rightAction(ps) : null}

                  {!hideSettings ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Налаштувати бейдж заклинання"
                      disabled={isPending || !Number.isFinite(spellId) || isReadOnly}
                      title={isReadOnly ? "Режим перегляду" : "Налаштувати бейдж або видалити заклинання"}
                      className={
                        "h-8 w-[82px] shrink-0 overflow-hidden rounded-lg p-0 text-slate-200 " +
                        (hasBadge
                          ? "border border-transparent bg-transparent hover:bg-transparent"
                          : "border border-white/10 bg-white/5 hover:bg-white/10")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!Number.isFinite(spellId) || isReadOnly) return;
                        onOpenSettings(ps);
                      }}
                    >
                      {hasBadge ? (
                        <span
                          className="flex h-full w-full items-center justify-center overflow-hidden whitespace-nowrap rounded-[10px] border px-1.5 text-center text-[10px] font-semibold"
                          style={userBadgeStyle(badgeColor)}
                        >
                          {badgeText}
                        </span>
                      ) : (
                        <Settings2 className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}

                  {rightAction && rightActionPlacement === "belowMeta" ? rightAction(ps) : null}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
