// Singleton service for @3d-dice/dice-box
// Manages DiceBox instance and provides roll API

import type DiceBox from "@3d-dice/dice-box";

type RollResult = {
  notation: string;
  total: number;
  rolls: Array<{ sides: number; value: number; rollId?: number | string }>;
};

type RollCallback = (result: RollResult) => void;

class DiceService {
  private box: DiceBox | null = null;
  private initPromise: Promise<void> | null = null;
  private onRollCompleteCallback: RollCallback | null = null;

  async init(containerSelector: string): Promise<void> {
    // Prevent multiple initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInit(containerSelector);
    return this.initPromise;
  }

  private async _doInit(containerSelector: string): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const { default: DiceBox } = await import("@3d-dice/dice-box");

      // dice-box@1.1.x API: (DOM selector, config)
      this.box = new DiceBox(containerSelector, {
        assetPath: "/assets/dice-box/",
        gravity: 2,
        mass: 1,
        friction: 0.8,
        restitution: 0.5,
        angularDamping: 0.4,
        linearDamping: 0.4,
        spinForce: 6,
        throwForce: 5,
        startingHeight: 8,
        settleTimeout: 5000,
        offscreen: true,
        delay: 10,
        lightIntensity: 1,
        enableShadows: true,
        shadowTransparency: 0.8,
        theme: "default",
        scale: 6,
      });

      await this.box.init();

      // Set up roll complete handler
      this.box.onRollComplete = (results: unknown) => {
        if (this.onRollCompleteCallback && Array.isArray(results)) {
          // Parse results from dice-box format
          let total = 0;
          const rolls: Array<{ sides: number; value: number; rollId?: number | string }> = [];

          for (const group of results) {
            if (group && typeof group === "object" && "rolls" in group) {
              const groupRolls = (group as { rolls: Array<{ sides: number; value: number; rollId?: number | string }> }).rolls;
              for (const roll of groupRolls) {
                total += roll.value;
                rolls.push({ sides: roll.sides, value: roll.value, rollId: roll.rollId });
              }
            }
          }

          this.onRollCompleteCallback({
            notation: "",
            total,
            rolls,
          });
        }
      };

      console.log("DiceBox initialized successfully");
    } catch (error) {
      console.error("Failed to initialize DiceBox:", error);
      this.initPromise = null;
      throw error;
    }
  }

  async roll(count: number, sides: number, options?: { append?: boolean }): Promise<void> {
    if (!this.box) {
      console.warn("DiceBox not initialized");
      return;
    }

    const notation = `${count}d${sides}`;
    try {
      // Use newStartPoint: true to get random spawn points along box edges
      if (options?.append) {
        await (this.box as any).add(notation, { newStartPoint: true });
      } else {
        await this.box.roll(notation, { newStartPoint: true });
      }
    } catch (error) {
      console.error("Roll failed:", error);
    }
  }

  async rollMany(notations: string[]): Promise<void> {
    if (!this.box) {
      console.warn("DiceBox not initialized");
      return;
    }

    const clean = notations
      .map((n) => String(n || "").trim())
      .filter((n) => /^\d+d\d+$/i.test(n));

    if (!clean.length) return;

    try {
      await this.box.roll(clean as any, { newStartPoint: true });
    } catch (error) {
      console.error("Roll many failed:", error);
    }
  }

  setVisualPreset(preset: "general" | "weapon"): void {
    if (!this.box) return;

    const scale = preset === "weapon" ? 8 : 6;

    try {
      (this.box as any).updateConfig?.({ scale });
    } catch (error) {
      console.warn("Failed to update dice visual preset:", error);
    }
  }

  async removeByRollId(rollId: number | string): Promise<void> {
    if (!this.box) return;

    try {
      await (this.box as any).remove([{ rollId }], { hide: false });
    } catch (error) {
      console.error("Remove die failed:", error);
    }
  }

  onRollComplete(callback: RollCallback): void {
    this.onRollCompleteCallback = callback;
  }

  clear(): void {
    if (this.box) {
      this.box.clear();
    }
  }

  isInitialized(): boolean {
    return this.box !== null;
  }
}

// Export singleton instance
export const diceService = new DiceService();
