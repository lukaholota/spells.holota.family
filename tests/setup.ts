import { config } from "dotenv";
import { assertTestDatabaseUrl } from "./helpers/assert-test-database-url";

config({ path: ".env.test", quiet: true });

assertTestDatabaseUrl(process.env.DATABASE_URL);
