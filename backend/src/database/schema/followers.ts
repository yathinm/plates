import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const followers = pgTable('followers', {
  followerId:  uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index('idx_followers_following').on(table.followingId),
]);
