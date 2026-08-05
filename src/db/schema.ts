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

export const salaries = sqliteTable('salaries', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  date: text().notNull(),
  amount: real().notNull(),
  note: text(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const borrows = sqliteTable('borrows', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  date: text().notNull(),
  amount: real().notNull(),
  source: text(),
  note: text(),
  repaidAt: text('repaid_at'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const cashWithdrawals = sqliteTable('cash_withdrawals', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  date: text().notNull(),
  amount: real().notNull(),
  memo: text(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})
