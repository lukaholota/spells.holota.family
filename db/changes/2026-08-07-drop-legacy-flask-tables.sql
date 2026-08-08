-- Видалення таблиць, що лишилися від попереднього сайту (Python/Flask).
--
-- Той сайт був бібліотекою заклинань: «персонаж» був просто текстовим полем з іменем, до нього
-- чіплялися заклинання, і була книга заклять. На цей сайт функціонал не переносився — його роль
-- виконують pers, pers_spell і UI «Книга заклять», який працює з pers.
--
--   character, character_spells   — персонаж-текстове-поле
--   spellbook, spellbook_spells   — книга заклять
--
-- Перевірено 2026-08-07 на проді:
--   усі чотири таблиці — 0 рядків
--   у src/ звернень немає (SpellbookDropdown у spells-client.tsx ходить у pers, не сюди)
--   ззовні на них не вказує жоден зовнішній ключ
--
-- ПЕРЕД застосуванням прибрати з src/lib/types/model-types.ts у типі SpellPrisma рядок
--   spellbookSpells: true;
-- інакше Prisma Client після db pull перестане компілюватись. Це правка суто типу:
-- SpellPrisma ніде в src/ не використовується, а SpellGetPayload<> живе лише на рівні типів
-- і жодного запиту не виконує. Ніякого join у рантаймі тут не було.
--
-- ПІСЛЯ застосування: bun run db:pull
-- Зворотні поля Spell.characterSpells і Spell.spellbookSpells зникнуть зі схеми самі.

BEGIN;

DO $$
DECLARE
  t text;
  n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY['character', 'character_spells', 'spellbook', 'spellbook_spells'] LOOP
    EXECUTE format('SELECT count(*) FROM %I', t) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Таблиця % не порожня (% рядків) — зупинено. Перевір дані перед видаленням.', t, n;
    END IF;
  END LOOP;
END $$;

DROP TABLE IF EXISTS character_spells;
DROP TABLE IF EXISTS character;
DROP TABLE IF EXISTS spellbook_spells;
DROP TABLE IF EXISTS spellbook;

COMMIT;
