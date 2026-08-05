import { defineConfig } from 'drizzle-kit';
import { Cause, Effect, Redacted } from 'effect';
import { appConfigSchema, getAppConfig, setAppConfig } from './server/utils/config.ts';

const result = Effect.runSyncExit(appConfigSchema);
if (result._tag === 'Failure') throw new Error(Cause.pretty(result.cause));

setAppConfig(result.value);
const { db } = getAppConfig();

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: { ...db, password: Redacted.value(db.password) },
  introspect: { casing: 'camel' },
  out: './server/database/migrations',
  schema: './server/database/schema.ts',
  verbose: true,
  strict: true,
});
