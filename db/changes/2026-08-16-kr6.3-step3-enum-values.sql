-- KR6.3 Крок 3 — Нові enum-значення для 2024-сіду. owner apply only.
-- Prepared, NOT applied by the agent. See docs/o6-rules-2024-import/kr6.3-implementation.md.
--
-- Застосовувати ПІСЛЯ 2026-08-16-kr6.3-2024-schema.sql (Крок 2).
-- Ці enum-значення потрібні сідеру 2024-контенту:
--   • Classes: 13 _2024 variant values
--   • Subclasses: 24 нові 2024-підкласи (перейменовані або нові)
--   • Feats: 27 нових (нові 2024-риси: Boon of *, Fighting Style variants, Origin feats)
--   • WeaponCategory: PISTOL (присутній у PHB 2024, відсутній у 2014 enum)
--
-- Порядок: ALTER TYPE ... ADD VALUE є DDL і фіксується одразу (PostgreSQL не підтримує
-- ALTER TYPE всередині транзакції для вже існуючих enum-значень, але ADD VALUE можна
-- застосовувати без ризику rollback — значення просто з'являється, нічого не видаляється).
-- Для безпеки: всі ADD VALUE IF NOT EXISTS.

-- ============================================================================
-- 1) Classes — 13 нових _2024 значень
-- ============================================================================
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'BARBARIAN_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'BARD_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'CLERIC_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'DRUID_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'FIGHTER_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'MONK_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'PALADIN_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'RANGER_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'ROGUE_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'SORCERER_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'WARLOCK_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'WIZARD_2024';
ALTER TYPE public."Classes" ADD VALUE IF NOT EXISTS 'ARTIFICER_2024';

-- ============================================================================
-- 2) Subclasses — 24 нові 2024-підкласи (перейменовані PHB або нові)
-- ============================================================================
-- Barbarian
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'PATH_OF_THE_WILD_HEART';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'PATH_OF_THE_WORLD_TREE';
-- Bard
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'COLLEGE_OF_DANCE';
-- Druid
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'CIRCLE_OF_THE_SEA';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'CIRCLE_OF_THE_STARS';
-- Monk (renamed in 2024: Way of → Warrior of)
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'WARRIOR_OF_MERCY';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'WARRIOR_OF_SHADOW';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'WARRIOR_OF_THE_ELEMENTS';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'WARRIOR_OF_THE_OPEN_HAND';
-- Ranger (renamed in 2024: *_CONCLAVE dropped)
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'BEAST_MASTER';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'GLOOM_STALKER';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'HUNTER';
-- Sorcerer (renamed in 2024: *_SOUL → *_SORCERY, DRACONIC_BLOODLINE → DRACONIC_SORCERY)
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'ABERRANT_SORCERY';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'CLOCKWORK_SORCERY';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'DRACONIC_SORCERY';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'WILD_MAGIC_SORCERY';
-- Warlock (renamed in 2024: plain name → *_PATRON)
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'ARCHFEY_PATRON';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'CELESTIAL_PATRON';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'FIEND_PATRON';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'GREAT_OLD_ONE_PATRON';
-- Wizard (renamed in 2024: SCHOOL_OF_* → plain ABJURER/DIVINER etc.)
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'ABJURER';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'DIVINER';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'EVOKER';
ALTER TYPE public."Subclasses" ADD VALUE IF NOT EXISTS 'ILLUSIONIST';

-- ============================================================================
-- 3) Feats — 27 нових (нові 2024 Origin feats, Fighting Style feats, Epic Boon feats)
-- ============================================================================
-- PHB 2024 ASI feat (replaces the ASI-as-feat mechanic, now a real Feat entry)
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'ABILITY_SCORE_IMPROVEMENT';
-- Fighting Style feats (2024 turns Fighting Styles into feats)
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'ARCHERY';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BLIND_FIGHTING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'DEFENSE';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'DUELING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'GREAT_WEAPON_FIGHTING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'INTERCEPTION';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'PROTECTION';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'THROWN_WEAPON_FIGHTING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'TWO_WEAPON_FIGHTING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'UNARMED_FIGHTING';
-- Epic Boon feats (level 19/20, category = EPIC_BOON)
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_COMBAT_PROWESS';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_DIMENSIONAL_TRAVEL';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_ENERGY_RESISTANCE';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_FATE';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_FORTITUDE';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_IRRESISTIBLE_OFFENSE';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_RECOVERY';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_SKILL';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_SPEED';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_SPELL_RECALL';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_THE_NIGHT_SPIRIT';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'BOON_OF_TRUESIGHT';
-- New PHB 2024 Origin feats (category = ORIGIN)
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'CRAFTER';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'MARTIAL_WEAPON_TRAINING';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'MUSICIAN';
ALTER TYPE public."Feats" ADD VALUE IF NOT EXISTS 'SPEEDY';

-- ============================================================================
-- 4) WeaponCategory — PISTOL (PHB 2024 additional weapon, absent from 2014)
-- ============================================================================
ALTER TYPE public."WeaponCategory" ADD VALUE IF NOT EXISTS 'PISTOL';
