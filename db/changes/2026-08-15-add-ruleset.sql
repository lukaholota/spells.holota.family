-- KR5.2 — owner apply only. Do not run through Prisma migrate/db push.
-- Existing rows and omitted INSERT values remain D&D 5e 2014 by default.

CREATE TYPE public."Ruleset" AS ENUM ('RULES_2014', 'RULES_2024');

ALTER TABLE public.background ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.choice_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.choice_option_feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class_choice_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class_feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class_optional_feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class_optional_feature_replaces_feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.class_starting_equipment_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.fighting_style ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.subclass ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.subclass_choice_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.subclass_feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.creature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.feat ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.feat_choice_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.feature ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.armor ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.equipment_pack ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.infusion ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.magic_item ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.weapon ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race_choice_option ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race_choice_option_trait ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race_trait ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race_variant ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.race_variant_trait ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.subrace ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.subrace_trait ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.spell ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.spell_classes ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.spell_races ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
ALTER TABLE public.pers ADD COLUMN ruleset public."Ruleset" NOT NULL DEFAULT 'RULES_2014';
