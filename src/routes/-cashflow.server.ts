import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';

import { createDb } from '@/db/index.server';
import { computeLedger } from '@/lib/ledger';
import type { Env } from '@/env';

const getDbFromContext = (context: { env: Env }) => {
  const db = createDb(context.env.expense_db);
  return { db };
};

export type SalaryInput = {
  date: string;
  amount: number;
  note?: string;
};

export type BorrowInput = {
  date: string;
  amount: number;
  source?: string;
  note?: string;
};

export type CashWithdrawalInput = {
  date: string;
  amount: number;
  memo?: string;
};

export const getSalaries = createServerFn({ method: 'GET' }).handler(
  async ({ context }) => {
    const { db } = getDbFromContext(context);
    const { salaries } = await import('@/db/schema');
    return db.select().from(salaries).orderBy(desc(salaries.date), desc(salaries.createdAt));
  },
);

export const createSalary = createServerFn({ method: 'POST' })
  .inputValidator((data: SalaryInput) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { salaries } = await import('@/db/schema');
    await db.insert(salaries).values({
      date: data.date,
      amount: data.amount,
      note: data.note?.trim() || null,
    });
    return { success: true };
  });

export const deleteSalary = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { salaries } = await import('@/db/schema');
    await db.delete(salaries).where(eq(salaries.id, data.id));
    return { success: true };
  });

export const getBorrows = createServerFn({ method: 'GET' }).handler(
  async ({ context }) => {
    const { db } = getDbFromContext(context);
    const { borrows } = await import('@/db/schema');
    return db.select().from(borrows).orderBy(desc(borrows.date), desc(borrows.createdAt));
  },
);

export const createBorrow = createServerFn({ method: 'POST' })
  .inputValidator((data: BorrowInput) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { borrows } = await import('@/db/schema');
    await db.insert(borrows).values({
      date: data.date,
      amount: data.amount,
      source: data.source?.trim() || null,
      note: data.note?.trim() || null,
    });
    return { success: true };
  });

export const setBorrowRepaid = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; repaidAt: string | null }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { borrows } = await import('@/db/schema');
    await db
      .update(borrows)
      .set({ repaidAt: data.repaidAt })
      .where(eq(borrows.id, data.id));
    return { success: true };
  });

export const deleteBorrow = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { borrows } = await import('@/db/schema');
    await db.delete(borrows).where(eq(borrows.id, data.id));
    return { success: true };
  });

export const getCashWithdrawals = createServerFn({ method: 'GET' }).handler(
  async ({ context }) => {
    const { db } = getDbFromContext(context);
    const { cashWithdrawals } = await import('@/db/schema');
    return db
      .select()
      .from(cashWithdrawals)
      .orderBy(desc(cashWithdrawals.date), desc(cashWithdrawals.createdAt));
  },
);

export const createCashWithdrawal = createServerFn({ method: 'POST' })
  .inputValidator((data: CashWithdrawalInput) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { cashWithdrawals } = await import('@/db/schema');
    await db.insert(cashWithdrawals).values({
      date: data.date,
      amount: data.amount,
      memo: data.memo?.trim() || null,
    });
    return { success: true };
  });

export const deleteCashWithdrawal = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { db } = getDbFromContext(context);
    const { cashWithdrawals } = await import('@/db/schema');
    await db.delete(cashWithdrawals).where(eq(cashWithdrawals.id, data.id));
    return { success: true };
  });

export const getCashFlowSummary = createServerFn({ method: 'GET' }).handler(
  async ({ context }) => {
    const { db } = getDbFromContext(context);
    const { salaries, borrows, expenses, cashWithdrawals } = await import(
      '@/db/schema'
    );

    const [salaryRows, borrowRows, expenseRows, withdrawalRows] =
      await Promise.all([
        db.select().from(salaries).orderBy(desc(salaries.date)),
        db.select().from(borrows).orderBy(desc(borrows.date)),
        db
          .select({
            id: expenses.id,
            date: expenses.date,
            total: expenses.total,
          })
          .from(expenses),
        db
          .select()
          .from(cashWithdrawals)
          .orderBy(desc(cashWithdrawals.date), desc(cashWithdrawals.createdAt)),
      ]);

    const summary = computeLedger(
      salaryRows.map((s) => ({ id: s.id, date: s.date, amount: s.amount })),
      borrowRows.map((b) => ({
        id: b.id,
        date: b.date,
        amount: b.amount,
        repaidAt: b.repaidAt,
      })),
      expenseRows.map((e) => ({ id: e.id, date: e.date, amount: e.total })),
    );

    const outstandingBorrows = borrowRows.filter((b) => !b.repaidAt);

    return {
      summary,
      salaries: salaryRows,
      borrows: borrowRows,
      cashWithdrawals: withdrawalRows,
      outstandingBorrowTotal: outstandingBorrows.reduce(
        (sum, b) => sum + b.amount,
        0,
      ),
    };
  },
);
