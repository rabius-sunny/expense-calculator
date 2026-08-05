export type LedgerSalaryInput = { id: number; date: string; amount: number }
export type LedgerBorrowInput = {
  id: number
  date: string
  amount: number
  repaidAt: string | null
}
export type LedgerExpenseInput = { id: number; date: string; amount: number }

export type LedgerBucket = {
  sourceType: 'salary' | 'borrow'
  sourceId: number
  date: string
  amount: number
  remaining: number
  exhaustedOn: string | null
}

export type LedgerSummary = {
  buckets: LedgerBucket[]
  activeBucket: LedgerBucket | null
  savings: number
  deficit: number
  previousSalaryEndedOn: string | null
}

type CreditEvent = {
  kind: 'credit'
  sourceType: 'salary' | 'borrow'
  sourceId: number
  date: string
  amount: number
  seq: number
}

type DebitEvent = {
  kind: 'debit'
  date: string
  amount: number
  seq: number
}

/**
 * Walks salaries, borrows, expenses, and borrow repayments in chronological
 * order and consumes each debit against the oldest still-open credit bucket
 * (FIFO). Recomputed from source rows every time, so editing or deleting a
 * past expense/salary/borrow self-heals the whole picture instead of relying
 * on a stored running balance.
 */
export function computeLedger(
  salaries: LedgerSalaryInput[],
  borrows: LedgerBorrowInput[],
  expenses: LedgerExpenseInput[],
): LedgerSummary {
  const credits: CreditEvent[] = [
    ...salaries.map(
      (s, i): CreditEvent => ({
        kind: 'credit',
        sourceType: 'salary',
        sourceId: s.id,
        date: s.date,
        amount: s.amount,
        seq: i,
      }),
    ),
    ...borrows.map(
      (b, i): CreditEvent => ({
        kind: 'credit',
        sourceType: 'borrow',
        sourceId: b.id,
        date: b.date,
        amount: b.amount,
        seq: salaries.length + i,
      }),
    ),
  ]

  const debits: DebitEvent[] = [
    ...expenses.map(
      (e, i): DebitEvent => ({
        kind: 'debit',
        date: e.date,
        amount: e.amount,
        seq: i,
      }),
    ),
    ...borrows
      .filter((b) => Boolean(b.repaidAt))
      .map(
        (b, i): DebitEvent => ({
          kind: 'debit',
          date: b.repaidAt as string,
          amount: b.amount,
          seq: expenses.length + i,
        }),
      ),
  ]

  const events = [
    ...credits.map((c) => ({ ...c, order: 0 as const })),
    ...debits.map((d) => ({ ...d, order: 1 as const })),
  ].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (a.order !== b.order) return a.order - b.order
    return a.seq - b.seq
  })

  const buckets: LedgerBucket[] = []
  const queue: LedgerBucket[] = []
  let deficit = 0

  for (const event of events) {
    if (event.kind === 'credit') {
      const bucket: LedgerBucket = {
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        date: event.date,
        amount: event.amount,
        remaining: event.amount,
        exhaustedOn: null,
      }
      buckets.push(bucket)
      queue.push(bucket)
      continue
    }

    let toConsume = event.amount
    while (toConsume > 0 && queue.length > 0) {
      const bucket = queue[0]
      const take = Math.min(bucket.remaining, toConsume)
      bucket.remaining -= take
      toConsume -= take
      if (bucket.remaining <= 0) {
        bucket.remaining = 0
        bucket.exhaustedOn = event.date
        queue.shift()
      }
    }
    if (toConsume > 0) deficit += toConsume
  }

  const activeBucket = queue[0] ?? null
  const savings = buckets.reduce((sum, b) => sum + b.remaining, 0)

  const activeIndex = activeBucket
    ? buckets.findIndex(
        (b) =>
          b.sourceType === activeBucket.sourceType &&
          b.sourceId === activeBucket.sourceId,
      )
    : buckets.length

  let previousSalaryEndedOn: string | null = null
  for (let i = activeIndex - 1; i >= 0; i--) {
    if (buckets[i].sourceType === 'salary') {
      previousSalaryEndedOn = buckets[i].exhaustedOn
      break
    }
  }

  return { buckets, activeBucket, savings, deficit, previousSalaryEndedOn }
}
