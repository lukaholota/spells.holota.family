/**
 * Access control for PHB 2024 content and rules.
 * During pre-release, 2024 rules are restricted to the owner / administrator.
 */
export function isRules2024Allowed(user?: { email?: string | null } | null): boolean {
  if (process.env.ENABLE_RULES_2024 === "true") {
    return true;
  }

  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail) {
    return false;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || process.env.ADMIN_EMAILS;
  if (adminEmailsEnv) {
    const allowed = adminEmailsEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(userEmail)) {
      return true;
    }
  }

  // Owner default email pattern (lukagolota1@gmail.com and @holota.family domain)
  if (
    userEmail === "lukagolota1@gmail.com" ||
    userEmail === "luka@holota.family" ||
    userEmail.endsWith("@holota.family")
  ) {
    return true;
  }

  return false;
}
