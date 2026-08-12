import { expect, test } from "@playwright/test";

// Scaffolding only — proves Playwright is wired up against a real dev server on a guarded
// test database. NOT the ~10-scenario suite Р7 (docs/DECISIONS.md) calls for: those need a
// step-count oracle from KR2.4 (derived state), which doesn't exist yet. Only unauthenticated,
// read-only routes here — no login flow, no character creation.

test("головна сторінка показує обидва навігаційні пункти", async ({ page }) => {
  await page.goto("/");
  // Scoped by href, not accessible name: the hero card AND a persistent bottom-nav icon both
  // link to /char/home with overlapping accessible names ("ПЕРСОНАЖІ" vs "Персонажі") — a
  // name-based locator is ambiguous by design here, not a bug to assert against.
  await expect(page.locator('a[href="/char/home"]').first()).toBeVisible();
  await expect(page.locator('a[href="/spells"]').first()).toBeVisible();
});

test("сторінка заклинань рендериться без падіння (публічна, без БД — генерований JSON)", async ({ page }) => {
  const response = await page.goto("/spells");
  expect(response?.ok()).toBe(true);
  await expect(page.getByText(/помилка|error/i)).toHaveCount(0);
});
