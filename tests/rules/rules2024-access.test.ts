import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isRules2024Allowed } from "@/rules/access";

describe("PHB 2024 Access Control (isRules2024Allowed)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_RULES_2024;
    delete process.env.ADMIN_EMAIL;
    delete process.env.OWNER_EMAIL;
    delete process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows owner email lukagolota1@gmail.com by default", () => {
    expect(isRules2024Allowed({ email: "lukagolota1@gmail.com" })).toBe(true);
    expect(isRules2024Allowed({ email: "LUKAGOLOTA1@GMAIL.COM" })).toBe(true);
    expect(isRules2024Allowed({ email: "luka@holota.family" })).toBe(true);
    expect(isRules2024Allowed({ email: "admin@holota.family" })).toBe(true);
  });

  it("denies access to regular users by default", () => {
    expect(isRules2024Allowed({ email: "player@gmail.com" })).toBe(false);
    expect(isRules2024Allowed(null)).toBe(false);
    expect(isRules2024Allowed(undefined)).toBe(false);
    expect(isRules2024Allowed({ email: null })).toBe(false);
  });

  it("allows access if ENABLE_RULES_2024 is true", () => {
    process.env.ENABLE_RULES_2024 = "true";
    expect(isRules2024Allowed({ email: "player@gmail.com" })).toBe(true);
    expect(isRules2024Allowed(null)).toBe(true);
  });

  it("allows access for custom ADMIN_EMAIL in env", () => {
    process.env.ADMIN_EMAIL = "custom-admin@example.com";
    expect(isRules2024Allowed({ email: "custom-admin@example.com" })).toBe(true);
    expect(isRules2024Allowed({ email: "other@example.com" })).toBe(false);
  });

  it("supports comma-separated list of ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "alpha@example.com, beta@example.com";
    expect(isRules2024Allowed({ email: "alpha@example.com" })).toBe(true);
    expect(isRules2024Allowed({ email: "beta@example.com" })).toBe(true);
    expect(isRules2024Allowed({ email: "gamma@example.com" })).toBe(false);
  });
});
