-- KR6.3 Крок 2 — owner apply only. Do not run through Prisma migrate/db push.
-- Prepared, NOT applied by the agent. See docs/o6-rules-2024-import/kr6.3-implementation.md.
--
-- Two independent groups, safe to apply together or split:
--   1) @@unique([name|engName, ruleset]) on 7 enum-identity content tables — without this, no
--      2024 row can share a name/engName with its 2014 counterpart (KR6.1 Р12,
--      docs/o6-rules-2024-import/kr6.1-discovery.md#23-що-з-цього-випливає-для-схеми).
--   2) Seven new columns for 2024-only mechanics — weapon mastery, feat category/repeatability,
--      background ASI/origin-feat/gold-instead, class Epic Boon level. None are JSON.
--
-- Explicitly OUT of this file (deferred, needs separate owner sign-off — see
-- docs/o6-rules-2024-import/kr6.3-implementation.md "Крок 2"):
--   - The 15 existing *_2024-named background rows (SCRIBE_2024, NOBLE_2024, ...): these need a
--     data UPDATE (ability_options/origin_feat_id/ruleset), not a schema change, and it changes
--     game mechanics for 11 live characters in 3 accounts — owner must decide "tell players or
--     stay silent" first. Left as ruleset = RULES_2014 for now.
--   - Consolidating the *_2024-suffixed enum values in BackgroundCategory (15) and Races (10)
--     down to unsuffixed ones now that (name, ruleset) makes the suffix redundant.
--   - New enum values for the ~700 net-new 2024 entities themselves (KR6.3 Крок 3 — seed — decides
--     the exact list from data/2024/normalized/*.json, not this schema step).

-- ============================================================================
-- 1) Composite uniqueness: (name|engName) unique -> (name|engName, ruleset) unique
-- ============================================================================

DROP INDEX public.background_name_key;
ALTER TABLE public.background ADD CONSTRAINT background_name_ruleset_key UNIQUE (name, ruleset);

DROP INDEX public.class_eng_name_key;
ALTER TABLE public.class ADD CONSTRAINT class_eng_name_ruleset_key UNIQUE (eng_name, ruleset);

DROP INDEX public.race_name_key;
ALTER TABLE public.race ADD CONSTRAINT race_name_ruleset_key UNIQUE (name, ruleset);

DROP INDEX public.feat_name_key;
ALTER TABLE public.feat ADD CONSTRAINT feat_name_ruleset_key UNIQUE (name, ruleset);

DROP INDEX public.subrace_name_key;
ALTER TABLE public.subrace ADD CONSTRAINT subrace_name_ruleset_key UNIQUE (name, ruleset);

DROP INDEX public.weapon_name_key;
ALTER TABLE public.weapon ADD CONSTRAINT weapon_name_ruleset_key UNIQUE (name, ruleset);

ALTER TABLE public.spell DROP CONSTRAINT unique_names;
ALTER TABLE public.spell ADD CONSTRAINT spell_name_ruleset_key UNIQUE (name, ruleset);
DROP INDEX public.spell_eng_name_key;
ALTER TABLE public.spell ADD CONSTRAINT spell_eng_name_ruleset_key UNIQUE (eng_name, ruleset);

-- ============================================================================
-- 2) New columns for 2024-only mechanics (docs/o6-rules-2024-import/kr6.1-discovery.md §2.3)
-- ============================================================================

-- Weapon mastery (PHB 2024 p.216) — one property per weapon, unlocked by a class feature.
-- Verbatim property text lives in the translated seed data, not here.
CREATE TYPE public."WeaponMastery" AS ENUM (
  'CLEAVE', 'GRAZE', 'NICK', 'PUSH', 'SAP', 'SLOW', 'TOPPLE', 'VEX'
);
ALTER TABLE public.weapon ADD COLUMN mastery public."WeaponMastery";

-- Feat category (enum already exists from earlier 2024 scaffolding, unused by any column until
-- now) and repeatability ("By whatever means you acquire a feat, you can take it only once
-- unless its description says otherwise").
ALTER TABLE public.feat ADD COLUMN category public."FeatCategory";
ALTER TABLE public.feat ADD COLUMN is_repeatable BOOLEAN NOT NULL DEFAULT false;

-- Background ASI ("Increase one by 2 and another one by 1, or increase all three by 1" over the
-- three named characteristics), origin feat ("gives your character a specified Origin feat" —
-- exactly one), and equipment-as-gold ("a choice between a package of equipment and 50 GP").
-- 2014 rows default to an empty ability_options array and NULL origin_feat_id/grants_gold_instead
-- — the 2014 background rules (Background.gainsFeats, Background.items) are untouched.
ALTER TABLE public.background ADD COLUMN ability_options public."Ability"[] NOT NULL DEFAULT '{}';
ALTER TABLE public.background ADD COLUMN origin_feat_id INTEGER REFERENCES public.feat(feat_id);
ALTER TABLE public.background ADD COLUMN grants_gold_instead INTEGER;

-- Distinguishes "level 19 grants an ASI" (2014, existing abilityScoreUpLevels array) from
-- "level 19 grants an Epic Boon feat" (2024) without changing that array's semantics.
ALTER TABLE public.class ADD COLUMN epic_boon_level INTEGER;
