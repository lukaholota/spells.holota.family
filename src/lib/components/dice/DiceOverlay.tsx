"use client";

import { useEffect, useRef } from "react";
import { diceService } from "./diceService";
import { useDiceUIStore } from "@/lib/stores/diceUIStore";
import { cn } from "@/lib/utils";

export function DiceOverlay() {
  const initRef = useRef(false);
  const { isOpen, mode } = useDiceUIStore();

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    // Initialize dice-box after DOM is ready
    const initDice = async () => {
      try {
        await diceService.init("#dice-box");
      } catch (error) {
        console.error("Failed to initialize dice overlay:", error);
        initRef.current = false; // Allow retry
      }
    };

    // Small delay to ensure DOM is mounted
    const timer = setTimeout(initDice, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Force a resize so the canvas matches the new overlay bounds
    if (typeof window !== "undefined") {
      diceService.setVisualPreset(mode === "weapon" ? "weapon" : "general");
      window.dispatchEvent(new Event("resize"));
    }
  }, [isOpen, mode]);

  return (
    <div
      id="dice-overlay-root"
      className={cn(
        "pointer-events-none fixed inset-y-0 left-0 z-[2147483647]",
        isOpen && mode === "weapon" ? "right-0 md:left-auto md:w-1/2" : ""
      )}
      style={{ background: "transparent", right: isOpen ? (mode === "weapon" ? 0 : "7rem") : 0 }}
    >
      <div className={cn("absolute", mode === "weapon" ? "bottom-6 left-4 right-4 h-[46dvh] md:h-[44dvh]" : "inset-y-0 left-0 right-0") }>
        <div
          id="dice-box"
          className="h-full w-full pointer-events-none"
          style={{ background: "transparent" }}
        />
      </div>
    </div>
  );
}
