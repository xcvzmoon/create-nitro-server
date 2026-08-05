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

const authConfig = Config.nested(
  Config.all({
    secret: Config.redacted('SECRET'),
    url: Config.url('URL'),
  }),
  'BETTER_AUTH',
);

const googleConfig = Config.nested(
  Config.all({
    clientId: Config.string('CLIENT_ID'),
    clientSecret: Config.redacted('CLIENT_SECRET'),
  }),
  'GOOGLE',
);

const mailConfig = Config.nested(
  Config.all({
    host: Config.string('HOST'),
    port: Config.integer('PORT'),
    secure: Config.boolean('SECURE').pipe(Config.withDefault(false)),
    user: Config.string('USER'),
    password: Config.redacted('PASSWORD'),
    from: Config.string('FROM'),
  }),
  'SMTP',
);

const dymoConfig = Config.nested(
  Config.all({
    apiKey: Config.redacted('API_KEY'),
  }),
  'DYMO',
);

export const appConfigSchema = Config.all({
  nodeEnv: Config.literal(
    'development',
    'testing',
    'production',
  )('NODE_ENV').pipe(Config.withDefault('development')),
  appName: Config.string('APP_NAME'),
  db: dbConfig,
  auth: authConfig,
  google: googleConfig,
  mail: mailConfig,
  dymo: dymoConfig,
});

let cachedConfig: AppConfig | undefined = undefined;

export function setAppConfig(config: AppConfig): void {
  cachedConfig = config;
}

export function getAppConfig(): AppConfig {
  if (!cachedConfig) throw new Error('AppConfig accessed before plugin initialization');
  return cachedConfig;
}
