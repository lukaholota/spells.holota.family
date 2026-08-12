import type { PersFormData } from "@/lib/zod/schemas/persCreateSchema";

export interface Build {
  id: string;
  /** Why this build is in the matrix — which branch/axis it holds. Required, not decorative. */
  why: string;
  /** docs/KNOWN-BUGS.md id(s) this build characterizes, if any — carried into the golden file so it survives regeneration. */
  knownBugs?: string[];
  form(): Promise<PersFormData>;
}
