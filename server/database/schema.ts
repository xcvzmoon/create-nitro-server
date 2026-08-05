import { boolean, index, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidV7 } from 'uuid';

const TIMESTAMP_CONFIG = {
  mode: 'date',
  precision: 3,
  withTimezone: true,
} as const;

const schema = pgSchema('cns');

export const users = schema.table('users', {
  id: uuid('id')
    .$defaultFn(() => uuidV7())
    .primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', TIMESTAMP_CONFIG).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', TIMESTAMP_CONFIG)
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at', TIMESTAMP_CONFIG),
});

export const sessions = schema.table(
  'sessions',
  {
    id: uuid('id')
      .$defaultFn(() => uuidV7())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    expiresAt: text('expires_at').notNull(),
    createdAt: timestamp('created_at', TIMESTAMP_CONFIG).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at', TIMESTAMP_CONFIG),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const accounts = schema.table(
  'accounts',
  {
    id: uuid('id')
      .$defaultFn(() => uuidV7())
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    scope: text('scope'),
    password: text('password'),
    accessTokenExpiresAt: text('access_token_expires_at'),
    refreshTokenExpiresAt: text('refresh_token_expires_at'),
    createdAt: timestamp('created_at', TIMESTAMP_CONFIG).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at', TIMESTAMP_CONFIG),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verifications = schema.table(
  'verifications',
  {
    id: uuid('id')
      .$defaultFn(() => uuidV7())
      .primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: timestamp('created_at', TIMESTAMP_CONFIG).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at', TIMESTAMP_CONFIG),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);
