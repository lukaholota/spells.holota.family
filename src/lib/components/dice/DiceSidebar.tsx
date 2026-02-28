"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { diceService } from "./diceService";
import { ChevronRight, Dices, Minus, Swords, Target, X } from "lucide-react";
import { useDiceUIStore } from "@/lib/stores/diceUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

const DICE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

const DIE_SIDES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export function DiceSidebar() {
  const { isOpen, close, mode, weaponContext } = useDiceUIStore();
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [lastBaseResult, setLastBaseResult] = useState<number | null>(null);
  const [lastAppliedBonus, setLastAppliedBonus] = useState<number>(0);
  const [lastRollLabel, setLastRollLabel] = useState<string | null>(null);
  const [lastRolls, setLastRolls] = useState<Array<{ sides: number; value: number; rollId?: number | string }> | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isOpenRef = useRef(isOpen);
  const pendingMetaRef = useRef<{ bonus: number; label: string | null } | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const resetRollState = useCallback(() => {
    setLastResult(null);
    setLastBaseResult(null);
    setLastAppliedBonus(0);
    setLastRollLabel(null);
    setLastRolls(null);
    diceService.clear();
  }, []);

  useEffect(() => {
    const checkReady = () => {
      setIsReady(diceService.isInitialized());
    };
    checkReady();
    const interval = setInterval(checkReady, 500);

    diceService.onRollComplete((result) => {
      if (!isOpenRef.current) {
        return;
      }

      const pending = pendingMetaRef.current;
      const bonus = pending?.bonus ?? 0;
      const label = pending?.label ?? null;
      pendingMetaRef.current = null;

      setLastBaseResult(result.total);
      setLastAppliedBonus(bonus);
      setLastRollLabel(label);
      setLastResult(result.total + bonus);
      setLastRolls(result.rolls);
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Clear dice when sidebar is closed
  useEffect(() => {
    if (!isOpen) {
      resetRollState();
    }
  }, [isOpen, resetRollState]);

  const triggerRoll = (type: DieType) => {
    if (!isReady) return;

    const sides = DIE_SIDES[type];
    pendingMetaRef.current = { bonus: 0, label: null };
    void diceService.roll(1, sides, { append: true });
  };

  const parseWeaponDamageDice = (notation: string): { count: number; sides: number } => {
    const normalized = String(notation)
      .toLowerCase()
      .replace(/[кk]/g, "d")
      .replace(/\s+/g, "");
    const match = normalized.match(/(\d*)d(\d+)/);
    if (!match) return { count: 1, sides: 4 };
    const count = Math.max(1, Math.trunc(Number(match[1] || "1")));
    const sides = Math.max(2, Math.trunc(Number(match[2] || "4")));
    return { count, sides };
  };

  const weaponDamageDiceLabel = (notation: string) => String(notation).replace(/d/gi, "к");

  const triggerWeaponAttack = useCallback(() => {
    if (!isReady || !weaponContext) return;
    pendingMetaRef.current = { bonus: weaponContext.attackBonus, label: "Атака" };
    void diceService.roll(1, 20, { append: false });
  }, [isReady, weaponContext]);

  const triggerWeaponDamage = useCallback(() => {
    if (!isReady || !weaponContext) return;
    const { count, sides } = parseWeaponDamageDice(weaponContext.damageDice);
    pendingMetaRef.current = { bonus: weaponContext.damageBonus, label: "Шкода" };
    void diceService.roll(count, sides, { append: false });
  }, [isReady, weaponContext]);

  const getDicePoolNotations = (): string[] => {
    const pool = new Map<number, number>();
    for (const roll of lastRolls ?? []) {
      const sides = Math.trunc(Number(roll.sides));
      if (!Number.isFinite(sides) || sides <= 0) continue;
      pool.set(sides, (pool.get(sides) ?? 0) + 1);
    }

    return Array.from(pool.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sides, count]) => `${count}d${sides}`);
  };

  const handleRoll = () => {
    if (!isReady) return;
    const notations = getDicePoolNotations();
    if (!notations.length) return;
    pendingMetaRef.current = { bonus: 0, label: null };
    void diceService.rollMany(notations);
  };

  const handleDieTypeClick = (type: DieType) => {
    triggerRoll(type);
  };

  const handleRemoveByType = (type: DieType) => {
    const sides = DIE_SIDES[type];

    setLastRolls((prev) => {
      if (!prev || prev.length === 0) return prev;

      const targetIndex = prev.findIndex((roll) => roll.sides === sides);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      const next = prev.filter((_, index) => index !== targetIndex);
      const total = next.reduce((sum, roll) => sum + roll.value, 0);
      setLastResult(next.length ? total : null);

      if (target.rollId !== undefined && target.rollId !== null) {
        void diceService.removeByRollId(target.rollId);
      }

      return next.length ? next : null;
    });
  };

  const breakdownText = lastRolls
    ? Array.from(
        lastRolls.reduce((acc, roll) => {
          const key = roll.sides;
          if (!acc.has(key)) acc.set(key, [] as number[]);
          acc.get(key)?.push(roll.value);
          return acc;
        }, new Map<number, number[]>())
      )
        .map(([sides, values]) => `к${sides}: ${values.join(", ")}`)
        .join(" · ")
    : null;

  const hasTypeRolled = (type: DieType) => {
    const sides = DIE_SIDES[type];
    return Boolean(lastRolls?.some((roll) => roll.sides === sides));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed z-[2147483646] h-screen flex flex-col gap-4 scrollbar-hide",
            mode === "weapon" ? "overflow-hidden" : "overflow-y-auto",
            mode === "weapon"
              ? "inset-0 w-screen items-stretch bg-slate-950/70 backdrop-blur-xl px-4 py-4 md:left-auto md:w-1/2"
              : "right-0 top-0 w-28 items-center border-l border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl py-4"
          )}
        >
          {/* Close Button */}
          <div className={cn("flex", mode === "weapon" ? "justify-end" : "justify-center w-full")}>
            <button
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {mode !== "weapon" && <div className="h-px w-10 bg-white/10" />}

          {mode === "weapon" && weaponContext ? (
            <div className="w-full px-3 space-y-3">
              <h1 className="text-base font-bold tracking-wide text-slate-100">Режим кидання кубиків для зброї</h1>

              <div className="rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-xl px-3 py-2 shadow-lg shadow-black/20">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Режим зброї</div>
                <div className="mt-1 text-sm font-bold text-slate-100 truncate">{weaponContext.weaponName}</div>
                <div className="mt-1 text-xs text-slate-300">
                  Шкода: <span className="font-semibold text-rose-200">{weaponDamageDiceLabel(weaponContext.damageDice)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={triggerWeaponAttack}
                disabled={!isReady}
                className="w-full rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 py-3 text-left transition hover:bg-indigo-500/25 disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-indigo-100 font-semibold">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-400/25">
                      <Target className="h-4 w-4" />
                    </span>
                    Кинути атаку (к20)
                  </div>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-300/20 text-indigo-100">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1 text-xs text-indigo-200/90">Бонус: {weaponContext.attackBonus >= 0 ? "+" : ""}{weaponContext.attackBonus}</div>
              </button>

              <button
                type="button"
                onClick={triggerWeaponDamage}
                disabled={!isReady}
                className="w-full rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-3 text-left transition hover:bg-rose-500/25 disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-rose-100 font-semibold">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-400/25">
                      <Swords className="h-4 w-4" />
                    </span>
                    Кинути шкоду ({weaponDamageDiceLabel(weaponContext.damageDice)})
                  </div>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-300/20 text-rose-100">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1 text-xs text-rose-200/90">Бонус: {weaponContext.damageBonus >= 0 ? "+" : ""}{weaponContext.damageBonus}</div>
              </button>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-center">
                <div className="text-[9px] uppercase tracking-wide text-amber-200/80">Сума</div>
                <div className="text-lg font-bold text-amber-200">{lastResult ?? "—"}</div>
                {lastRollLabel && (
                  <div className="mt-0.5 text-[10px] font-semibold text-amber-100/90">
                    {lastRollLabel}: {lastBaseResult ?? "—"} {lastAppliedBonus >= 0 ? "+" : ""}
                    {lastAppliedBonus}
                  </div>
                )}
                {breakdownText && <div className="mt-0.5 text-[9px] font-medium text-amber-300/80">{breakdownText}</div>}
              </div>

              <div className="h-[46dvh] md:h-[44dvh] rounded-2xl border border-amber-400/30 bg-slate-900/15 shadow-inner shadow-black/30" />
            </div>
          ) : (
            <>
              {/* Dice Selection */}
              <div className="flex flex-col gap-2 w-full px-2">
                {DICE_TYPES.map((type) => (
                  <div key={type} className="grid grid-cols-[1fr,30px] gap-1">
                    <button
                      onClick={() => handleDieTypeClick(type)}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold transition-all",
                        hasTypeRolled(type)
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      )}
                    >
                      {type.replace("d", "к")}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveByType(type)}
                      disabled={!lastRolls?.some((roll) => roll.sides === DIE_SIDES[type])}
                      title={`Прибрати один ${type.replace("d", "к")}`}
                      className="flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-slate-900/50 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleRoll}
                  disabled={!isReady || !lastRolls?.length}
                  className={cn(
                    "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  )}
                >
                  <Dices className="h-5 w-5" />
                </button>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-center">
                  <div className="text-[9px] uppercase tracking-wide text-amber-200/80">Сума</div>
                  <div className="text-lg font-bold text-amber-200">{lastResult ?? "—"}</div>
                  {breakdownText && <div className="mt-0.5 text-[9px] font-medium text-amber-300/80">{breakdownText}</div>}
                </div>
              </div>
            </>
          )}

          {mode !== "weapon" && (
            <>
              <div className="h-px w-10 bg-white/10" />
              <div className="flex-1" />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
