import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { accounts, sessions, users, verifications } from '~/server/database/schema.ts';

function findColumn(table: PgTable, name: string): PgColumn {
  const column = getTableConfig(table).columns.find((candidate) => candidate.name === name);
  if (!column) throw new Error(`Column "${name}" was not found on the table`);
  return column;
}

describe('users table', () => {
  it('lives in the cns schema', () => {
    expect(getTableConfig(users).name).toBe('users');
    expect(getTableConfig(users).schema).toBe('cns');
  });

  it('defines an auto-generated uuid primary key', () => {
    const id = findColumn(users, 'id');

    expect(id.getSQLType()).toBe('uuid');
    expect(id.primary).toBe(true);
    expect(id.hasDefault).toBe(true);
  });

  it('requires a name and a unique email', () => {
    const name = findColumn(users, 'name');
    const email = findColumn(users, 'email');

    expect(name.notNull).toBe(true);
    expect(email.notNull).toBe(true);
    expect(email.isUnique).toBe(true);
  });

  it('defaults emailVerified to false and allows a nullable image', () => {
    const emailVerified = findColumn(users, 'email_verified');
    const image = findColumn(users, 'image');

    expect(emailVerified.notNull).toBe(true);
    expect(emailVerified.default).toBe(false);
    expect(image.notNull).toBe(false);
  });

  it('tracks createdAt/updatedAt with timezone-aware timestamps and a nullable deletedAt', () => {
    const createdAt = findColumn(users, 'created_at');
    const updatedAt = findColumn(users, 'updated_at');
    const deletedAt = findColumn(users, 'deleted_at');

    expect(createdAt.getSQLType()).toBe('timestamp (3) with time zone');
    expect(createdAt.notNull).toBe(true);
    expect(createdAt.hasDefault).toBe(true);
    expect(updatedAt.getSQLType()).toBe('timestamp (3) with time zone');
    expect(updatedAt.notNull).toBe(true);
    expect(deletedAt.notNull).toBe(false);
  });
});

describe('sessions table', () => {
  it('indexes userId and cascades on user deletion', () => {
    const config = getTableConfig(sessions);
    const userId = findColumn(sessions, 'user_id');

    expect(config.schema).toBe('cns');
    expect(userId.notNull).toBe(true);

    expect(config.foreignKeys).toHaveLength(1);
    const [foreignKey] = config.foreignKeys;
    expect(foreignKey.onDelete).toBe('cascade');
    expect(foreignKey.reference().foreignTable).toBe(users);
    expect(foreignKey.reference().foreignColumns.map((column) => column.name)).toEqual(['id']);

    expect(config.indexes).toHaveLength(1);
    expect(config.indexes[0].config.name).toBe('session_userId_idx');
  });

  it('requires a unique session token', () => {
    const token = findColumn(sessions, 'token');

    expect(token.notNull).toBe(true);
    expect(token.isUnique).toBe(true);
  });
});

describe('accounts table', () => {
  it('indexes userId and cascades on user deletion', () => {
    const config = getTableConfig(accounts);
    const userId = findColumn(accounts, 'user_id');

    expect(userId.getSQLType()).toBe('uuid');
    expect(userId.notNull).toBe(true);

    expect(config.foreignKeys).toHaveLength(1);
    expect(config.foreignKeys[0].onDelete).toBe('cascade');
    expect(config.foreignKeys[0].reference().foreignTable).toBe(users);

    expect(config.indexes).toHaveLength(1);
    expect(config.indexes[0].config.name).toBe('account_userId_idx');
  });

  it('allows optional OAuth token fields', () => {
    for (const columnName of ['access_token', 'refresh_token', 'id_token', 'password']) {
      expect(findColumn(accounts, columnName).notNull).toBe(false);
    }
  });
});

describe('verifications table', () => {
  it('indexes the identifier column', () => {
    const config = getTableConfig(verifications);

    expect(config.indexes).toHaveLength(1);
    expect(config.indexes[0].config.name).toBe('verification_identifier_idx');
    expect(findColumn(verifications, 'identifier').notNull).toBe(true);
    expect(findColumn(verifications, 'value').notNull).toBe(true);
  });
});
