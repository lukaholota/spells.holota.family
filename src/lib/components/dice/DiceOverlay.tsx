"use client";

import { useEffect, useRef } from "react";
import { diceService } from "./diceService";
import { useDiceUIStore } from "@/lib/stores/diceUIStore";

export function DiceOverlay() {
  const initRef = useRef(false);
  const { isOpen } = useDiceUIStore();

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
      window.dispatchEvent(new Event("resize"));
    }
  }, [isOpen]);

  return (
    <div
      id="dice-overlay-root"
      className="pointer-events-none fixed inset-y-0 left-0 z-[2147483647]"
      style={{ background: "transparent", right: isOpen ? "5rem" : 0 }}
    >
      <div
        id="dice-box"
        className="h-full w-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
