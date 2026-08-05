import { Redacted } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PostgresOptions = {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  database: string;
};

type DrizzleOptions = {
  client: unknown;
  logger: unknown;
  relations: unknown;
};

const { postgresMock, drizzleMock, enhancedQueryLoggerMock, getAppConfigMock } = vi.hoisted(() => ({
  postgresMock: vi.fn<(options: PostgresOptions) => { __client: true }>(() => ({ __client: true })),
  drizzleMock: vi.fn<(options: DrizzleOptions) => { __db: true }>(() => ({ __db: true })),
  enhancedQueryLoggerMock: vi.fn<new () => object>(),
  getAppConfigMock: vi.fn<() => FakeAppConfig>(),
}));

vi.mock('postgres', () => ({ default: postgresMock }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: drizzleMock }));
vi.mock('drizzle-query-logger', () => ({ EnhancedQueryLogger: enhancedQueryLoggerMock }));
vi.mock('~/server/utils/config.ts', () => ({ getAppConfig: getAppConfigMock }));

type FakeAppConfig = {
  nodeEnv: 'development' | 'production';
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: Redacted.Redacted<string>;
    ssl: boolean;
    database: string;
  };
};

function buildFakeConfig(nodeEnv: FakeAppConfig['nodeEnv']): FakeAppConfig {
  return {
    nodeEnv,
    db: {
      host: 'localhost',
      port: 5432,
      name: 'app',
      user: 'postgres',
      password: Redacted.make('db-secret'),
      ssl: false,
      database: 'app',
    },
  };
}

beforeEach(() => {
  vi.resetModules();
  postgresMock.mockClear();
  drizzleMock.mockClear();
  enhancedQueryLoggerMock.mockClear();
  getAppConfigMock.mockReset();
});

describe('database client', () => {
  it('creates the postgres client with the password unwrapped from Redacted', async () => {
    getAppConfigMock.mockReturnValue(buildFakeConfig('development'));

    await import('~/server/database/index.ts');

    expect(postgresMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 5432,
      name: 'app',
      user: 'postgres',
      password: 'db-secret',
      ssl: false,
      database: 'app',
    });
  });

  it('enables the query logger outside of production', async () => {
    getAppConfigMock.mockReturnValue(buildFakeConfig('development'));

    await import('~/server/database/index.ts');

    expect(enhancedQueryLoggerMock).toHaveBeenCalledTimes(1);
    expect(drizzleMock).toHaveBeenCalledTimes(1);
    expect(drizzleMock.mock.calls[0][0].logger).toBe(enhancedQueryLoggerMock.mock.instances[0]);
  });

  it('disables the query logger in production', async () => {
    getAppConfigMock.mockReturnValue(buildFakeConfig('production'));

    await import('~/server/database/index.ts');

    expect(enhancedQueryLoggerMock).not.toHaveBeenCalled();
    expect(drizzleMock).toHaveBeenCalledWith(expect.objectContaining({ logger: false }));
  });
});
