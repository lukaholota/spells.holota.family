import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FeatPicker } from "./FeatPicker";

const feats = [
  { featId: 1, name: "ALERT", engName: "Alert", source: "PHB" },
  { featId: 2, name: "HEAVY_ARMOR_MASTER", engName: "Heavy Armor Master", source: "PHB" },
] as never;

describe("FeatPicker", () => {
  it("renders search, selected and unavailable feat states", () => {
    const markup = renderToStaticMarkup(createElement(FeatPicker, {
      feats,
      selectedFeatId: 1,
      search: "alert",
      prerequisiteByFeatId: new Map([[2, { met: false, reason: "Потрібна Сила 13" }]]),
      onSearchChange: vi.fn(),
      onSelectFeat: vi.fn(),
    }));

    expect(markup).toContain('value="alert"');
    expect(markup).toContain("Alert");
    expect(markup).toContain("Потрібна Сила 13");
    expect(markup).toMatch(/glass-card[^\"]*glass-active/);
    expect(markup).toContain("border-rose-500/30");
  });

  it("renders the caller-provided empty state", () => {
    const markup = renderToStaticMarkup(createElement(FeatPicker, {
      feats: [],
      selectedFeatId: undefined,
      search: "missing",
      prerequisiteByFeatId: new Map(),
      onSearchChange: vi.fn(),
      onSelectFeat: vi.fn(),
      emptyState: "Риси не знайдено",
    }));

    expect(markup).toContain("Риси не знайдено");
  });
});
