import { config } from "dotenv";

config({ path: ".env.test", quiet: true });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL не заданий. Тести читають його з .env.test — цей файл у git не зберігається.\n" +
      "Підняти базу і взяти URL: ./scripts/db-clone.sh spells_test",
  );
}

const databaseName = new URL(url).pathname.replace(/^\//, "");

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Тести вимагають БД з суфіксом _test у назві. Отримано "${databaseName}". Зупинено.\n` +
      "Тести роблять TRUNCATE таблиць користувача — проти прода це знищить персонажів усіх користувачів.",
  );
}
