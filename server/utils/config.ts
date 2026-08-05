import { Config } from 'effect';

export type AppConfig = Config.Config.Success<typeof appConfigSchema>;

const dbConfig = Config.nested(
  Config.all({
    host: Config.string('HOST'),
    port: Config.integer('PORT'),
    name: Config.string('NAME'),
    user: Config.string('USER'),
    password: Config.redacted('PASSWORD'),
    ssl: Config.boolean('SSL').pipe(Config.withDefault(false)),
    database: Config.string('DATABASE'),
  }),
  'DB',
);

export const appConfigSchema = Config.all({
  nodeEnv: Config.literal(
    'development',
    'testing',
    'production',
  )('NODE_ENV').pipe(Config.withDefault('development')),
  db: dbConfig,
});

let cachedConfig: AppConfig | undefined = undefined;

export function setAppConfig(config: AppConfig): void {
  cachedConfig = config;
}

export function getAppConfig(): AppConfig {
  if (!cachedConfig) throw new Error('AppConfig accessed before plugin initialization');
  return cachedConfig;
}
