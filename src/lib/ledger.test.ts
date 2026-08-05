import { describe, expect, it } from 'vitest'

import { computeLedger } from './ledger'

describe('computeLedger', () => {
  it('tracks remaining balance against a single active salary', () => {
    const result = computeLedger(
      [{ id: 1, date: '2026-01-01', amount: 1000 }],
      [],
      [
        { id: 1, date: '2026-01-02', amount: 200 },
        { id: 2, date: '2026-01-05', amount: 300 },
        { id: 3, date: '2026-01-10', amount: 200 },
      ],
    )

    expect(result.activeBucket?.sourceId).toBe(1)
    expect(result.savings).toBe(300)
    expect(result.deficit).toBe(0)
    expect(result.previousSalaryEndedOn).toBeNull()
  })

  it('rolls over to the next salary once the previous one is exhausted', () => {
    const result = computeLedger(
      [
        { id: 1, date: '2026-01-01', amount: 1000 },
        { id: 2, date: '2026-01-20', amount: 1000 },
      ],
      [],
      [{ id: 1, date: '2026-01-15', amount: 1000 }],
    )

    expect(result.activeBucket?.sourceType).toBe('salary')
    expect(result.activeBucket?.sourceId).toBe(2)
    expect(result.previousSalaryEndedOn).toBe('2026-01-15')
    expect(result.savings).toBe(1000)
  })

  it('bridges a gap with a borrow and settles it against the new salary', () => {
    const result = computeLedger(
      [
        { id: 1, date: '2026-01-01', amount: 500 },
        { id: 2, date: '2026-01-16', amount: 1000 },
      ],
      [{ id: 1, date: '2026-01-12', amount: 200, repaidAt: '2026-01-16' }],
      [
        { id: 1, date: '2026-01-10', amount: 500 },
        { id: 2, date: '2026-01-13', amount: 150 },
      ],
    )

    // salary #1 fully spent by 01-10, borrow bridges 01-12 - 01-16
    expect(result.previousSalaryEndedOn).toBe('2026-01-10')
    expect(result.activeBucket?.sourceType).toBe('salary')
    expect(result.activeBucket?.sourceId).toBe(2)
    // 200 borrowed, 150 spent from it, 50 left over consumed by repayment,
    // remaining 150 of the repayment eats into the new salary
    expect(result.savings).toBe(1000 - 150)
    expect(result.deficit).toBe(0)
  })

  it('reports a deficit when expenses outrun every logged salary and borrow', () => {
    const result = computeLedger(
      [{ id: 1, date: '2026-01-01', amount: 500 }],
      [],
      [{ id: 1, date: '2026-01-05', amount: 700 }],
    )

    expect(result.activeBucket).toBeNull()
    expect(result.savings).toBe(0)
    expect(result.deficit).toBe(200)
    expect(result.previousSalaryEndedOn).toBe('2026-01-05')
  })

  it('lets a same-day salary cover a same-day expense', () => {
    const result = computeLedger(
      [{ id: 1, date: '2026-02-01', amount: 300 }],
      [],
      [{ id: 1, date: '2026-02-01', amount: 100 }],
    )

    expect(result.deficit).toBe(0)
    expect(result.activeBucket?.remaining).toBe(200)
  })
})
