import { describe, expect, it } from 'vitest';
import { relations } from '~/server/database/relations.ts';
import { accounts, sessions, users, verifications } from '~/server/database/schema.ts';

describe('relations config', () => {
  it('registers every schema table under its own name', () => {
    expect(relations.users.table).toBe(users);
    expect(relations.sessions.table).toBe(sessions);
    expect(relations.accounts.table).toBe(accounts);
    expect(relations.verifications.table).toBe(verifications);
  });

  it('defines no relations yet, matching the empty relations builder', () => {
    for (const tableConfig of Object.values(relations)) {
      expect(tableConfig.relations).toEqual({});
    }
  });
});
