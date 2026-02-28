import { create } from "zustand";

export type DiceMode = "general" | "weapon";

export interface WeaponDiceContext {
  persWeaponId: number;
  weaponName: string;
  attackBonus: number;
  damageBonus: number;
  damageDice: string;
}

interface DiceUIState {
  isOpen: boolean;
  mode: DiceMode;
  weaponContext: WeaponDiceContext | null;
  toggle: () => void;
  open: () => void;
  openWeapon: (context: WeaponDiceContext) => void;
  close: () => void;
}

export const useDiceUIStore = create<DiceUIState>((set) => ({
  isOpen: false,
  mode: "general",
  weaponContext: null,
  toggle: () =>
    set((state) =>
      state.isOpen
        ? { isOpen: false, mode: "general", weaponContext: null }
        : { isOpen: true, mode: "general", weaponContext: null }
    ),
  open: () => set({ isOpen: true, mode: "general", weaponContext: null }),
  openWeapon: (context) => set({ isOpen: true, mode: "weapon", weaponContext: context }),
  close: () => set({ isOpen: false, mode: "general", weaponContext: null }),
}));
