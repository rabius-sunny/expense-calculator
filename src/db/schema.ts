import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const expenses = sqliteTable('expenses', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  date: text().notNull(),
  items: text().notNull(),
  total: real().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})
