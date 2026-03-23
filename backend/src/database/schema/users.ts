import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  username:     varchar('username', { length: 30 }).unique().notNull(),
  email:        varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName:  varchar('display_name', { length: 60 }),
  avatarUrl:    text('avatar_url'),
  bio:          text('bio'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_users_username').on(table.username),
  index('idx_users_email').on(table.email),
]);
