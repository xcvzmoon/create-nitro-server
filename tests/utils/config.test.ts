import type { AppConfig } from '~/server/utils/config.ts';
import { Effect, ConfigProvider, Redacted } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfigSchema } from '~/server/utils/config.ts';

function buildEnv(overrides: Record<string, string | undefined> = {}): Map<string, string> {
  const base: Record<string, string> = {
    NODE_ENV: 'testing',
    APP_NAME: 'create-nitro-server',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_NAME: 'app',
    DB_USER: 'postgres',
    DB_PASSWORD: 'db-secret',
    DB_DATABASE: 'app',
    BETTER_AUTH_SECRET: 'auth-secret',
    BETTER_AUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'smtp-user',
    SMTP_PASSWORD: 'smtp-secret',
    SMTP_FROM: 'noreply@example.com',
    DYMO_API_KEY: 'dymo-key',
  };

  const merged = new Map<string, string>();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== undefined) merged.set(key, value);
  }
  return merged;
}

function loadConfig(env: Map<string, string>): AppConfig {
  return Effect.runSync(
    Effect.withConfigProvider(appConfigSchema, ConfigProvider.fromMap(env, { pathDelim: '_' })),
  );
}

describe('appConfigSchema', () => {
  it('parses a fully specified environment into a typed AppConfig', () => {
    const config = loadConfig(buildEnv());

    expect(config.nodeEnv).toBe('testing');
    expect(config.appName).toBe('create-nitro-server');
    expect(config.db).toMatchObject({
      host: 'localhost',
      port: 5432,
      name: 'app',
      user: 'postgres',
      ssl: false,
      database: 'app',
    });
    expect(Redacted.value(config.db.password)).toBe('db-secret');
    expect(Redacted.value(config.auth.secret)).toBe('auth-secret');
    expect(config.auth.url.toString()).toBe('http://localhost:3000/');
    expect(config.google.clientId).toBe('google-client-id');
    expect(Redacted.value(config.google.clientSecret)).toBe('google-client-secret');
    expect(config.mail.from).toBe('noreply@example.com');
    expect(Redacted.value(config.dymo.apiKey)).toBe('dymo-key');
  });

  it('defaults nodeEnv to development when NODE_ENV is unset', () => {
    const config = loadConfig(buildEnv({ NODE_ENV: undefined }));

    expect(config.nodeEnv).toBe('development');
  });

  it('defaults db.ssl and mail.secure to false when unset', () => {
    const config = loadConfig(buildEnv({ DB_SSL: undefined, SMTP_SECURE: undefined }));

    expect(config.db.ssl).toBe(false);
    expect(config.mail.secure).toBe(false);
  });

  it('honors an explicit true value for boolean flags', () => {
    const config = loadConfig(buildEnv({ DB_SSL: 'true', SMTP_SECURE: 'true' }));

    expect(config.db.ssl).toBe(true);
    expect(config.mail.secure).toBe(true);
  });

  it('fails when a required variable is missing', () => {
    const exit = Effect.runSyncExit(
      Effect.withConfigProvider(
        appConfigSchema,
        ConfigProvider.fromMap(buildEnv({ APP_NAME: undefined })),
      ),
    );

    expect(exit._tag).toBe('Failure');
  });

  it('fails when NODE_ENV is not one of the allowed literals', () => {
    const exit = Effect.runSyncExit(
      Effect.withConfigProvider(
        appConfigSchema,
        ConfigProvider.fromMap(buildEnv({ NODE_ENV: 'staging' })),
      ),
    );

    expect(exit._tag).toBe('Failure');
  });

  it('fails when a numeric variable is not a valid integer', () => {
    const exit = Effect.runSyncExit(
      Effect.withConfigProvider(
        appConfigSchema,
        ConfigProvider.fromMap(buildEnv({ DB_PORT: 'not-a-number' })),
      ),
    );

    expect(exit._tag).toBe('Failure');
  });
});

describe('setAppConfig / getAppConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws a descriptive error when accessed before the plugin initializes', async () => {
    const { getAppConfig } = await import('~/server/utils/config.ts');

    expect(() => getAppConfig()).toThrow('AppConfig accessed before plugin initialization');
  });

  it('returns the same config instance that was cached by setAppConfig', async () => {
    const configModule = await import('~/server/utils/config.ts');
    const config = Effect.runSync(
      Effect.withConfigProvider(
        configModule.appConfigSchema,
        ConfigProvider.fromMap(buildEnv(), { pathDelim: '_' }),
      ),
    );

    configModule.setAppConfig(config);

    expect(configModule.getAppConfig()).toBe(config);
  });
});
