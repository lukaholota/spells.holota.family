"use client";

import { ArrowLeftRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTwoStepConfirm } from "@/hooks/useTwoStepConfirm";

interface Props {
  onReset: () => void;
  onOpenAuth: () => void;
  isAuthenticated?: boolean;
  canSelect2024?: boolean;
  ruleset?: "RULES_2014" | "RULES_2024";
  onRulesetChange?: (ruleset: "RULES_2014" | "RULES_2024") => void;
}

export const CharacterCreateHeader = ({
  onReset,
  onOpenAuth,
  isAuthenticated = false,
  canSelect2024 = false,
  ruleset = "RULES_2014",
  onRulesetChange,
}: Props) => {
  const resetConfirm = useTwoStepConfirm<HTMLButtonElement>({
    onConfirm: onReset,
  });

  return (
    <div className="glass-panel border-gradient-rpg w-full rounded-2xl px-3 py-4 sm:px-4 sm:py-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="space-y-1">
          <h1 className="font-rpg-display text-xl font-semibold uppercase tracking-widest text-slate-200 sm:text-2xl md:text-3xl">
            Створити персонажа
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canSelect2024 && (
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1" data-testid="ruleset-switcher">
              <button
                type="button"
                onClick={() => onRulesetChange?.("RULES_2014")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  ruleset === "RULES_2014"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
                data-testid="ruleset-2014-btn"
              >
                PHB 2014
              </button>
              <button
                type="button"
                onClick={() => onRulesetChange?.("RULES_2024")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  ruleset === "RULES_2024"
                    ? "bg-amber-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
                data-testid="ruleset-2024-btn"
              >
                PHB 2024
                <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1 text-[10px] text-amber-300">Власник</span>
              </button>
            </div>
          )}
          <Button
            ref={resetConfirm.ref}
            onClick={resetConfirm.onClick}
            variant={resetConfirm.isConfirming ? "destructive" : "ghost"}
            size="sm"
            className={cn(
              "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/7 hover:text-white",
              resetConfirm.isConfirming && "border-rose-500/50 ring-1 ring-rose-500/40"
            )}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Скинути
          </Button>
          {!isAuthenticated && (
            <Button
              variant="secondary"
              className="border border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={onOpenAuth}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Увійти
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
