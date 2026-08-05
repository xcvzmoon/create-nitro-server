import { drizzle } from 'drizzle-orm/postgres-js';
import { EnhancedQueryLogger } from 'drizzle-query-logger';
import { Redacted } from 'effect';
import postgres from 'postgres';
import { getAppConfig } from '../utils/config.ts';
import { relations } from './relations.ts';

const appConfig = getAppConfig();
const client = postgres({ ...appConfig.db, password: Redacted.value(appConfig.db.password) });
const logger = appConfig.nodeEnv !== 'production' && new EnhancedQueryLogger();
export const db = drizzle({ client, logger, relations });
