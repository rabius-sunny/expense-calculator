import { createServerFn } from '@tanstack/react-start';
import { desc, eq, like, sql } from 'drizzle-orm';

import { createDb } from '@/db/index.server';
import type { Env } from '@/env';

export type ExpenseItem = {
  name: string;
  cost: number;
};

type ExpenseInput = {
  date: string;
  items: ExpenseItem[];
};

const parseItems = (raw: string): ExpenseItem[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getDbFromContext = (context: { env: Env }) => {
  const db = createDb(context.env.expense_db);
  return { db };
};

export const getExpenses = createServerFn({
  method: 'GET'
})
  .inputValidator((data: { month?: string }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { expenses } = await import('@/db/schema');
    const month = data.month?.trim();
    const where = month ? like(expenses.date, `${month}%`) : undefined;

    const listBase = where
      ? db.select().from(expenses).where(where)
      : db.select().from(expenses);
    const totalBase = where
      ? db
          .select({ total: sql<number>`sum(${expenses.total})` })
          .from(expenses)
          .where(where)
      : db.select({ total: sql<number>`sum(${expenses.total})` }).from(expenses);

    const rows = await listBase.orderBy(
      desc(expenses.date),
      desc(expenses.createdAt)
    );

    const totalRow = await totalBase;
    const monthTotal = totalRow[0]?.total ?? 0;

    return {
      monthTotal,
      items: rows.map((row) => ({
        ...row,
        items: parseItems(row.items)
      }))
    };
  });

export const getExpense = createServerFn({
  method: 'GET'
})
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { expenses } = await import('@/db/schema');

    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, data.id))
      .limit(1);

    const row = rows[0];

    if (!row) return null;

    return {
      ...row,
      items: parseItems(row.items)
    };
  });

export const createExpense = createServerFn({
  method: 'POST'
})
  .inputValidator((data: ExpenseInput) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { expenses } = await import('@/db/schema');
    const total = data.items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );

    await db.insert(expenses).values({
      date: data.date,
      items: JSON.stringify(data.items),
      total
    });

    return { success: true };
  });

export const updateExpense = createServerFn({
  method: 'POST'
})
  .inputValidator((data: { id: number } & ExpenseInput) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { expenses } = await import('@/db/schema');
    const total = data.items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );

    await db
      .update(expenses)
      .set({
        date: data.date,
        items: JSON.stringify(data.items),
        total
      })
      .where(eq(expenses.id, data.id));

    return { success: true };
  });

export const deleteExpense = createServerFn({
  method: 'POST'
})
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { expenses } = await import('@/db/schema');
    await db.delete(expenses).where(eq(expenses.id, data.id));
    return { success: true };
  });
