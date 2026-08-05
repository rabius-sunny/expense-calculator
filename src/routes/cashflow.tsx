import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useState } from 'react';

import {
  createBorrow,
  createCashWithdrawal,
  createSalary,
  deleteBorrow,
  deleteCashWithdrawal,
  deleteSalary,
  getCashFlowSummary,
  setBorrowRepaid,
} from './-cashflow.server';
import { logout } from './-auth.server';
import { requireAuth } from './-auth';
import type { LedgerBucket, LedgerSummary } from '@/lib/ledger';

export const Route = createFileRoute('/cashflow')({
  beforeLoad: requireAuth,
  component: CashFlowPage,
  loader: async () => await getCashFlowSummary(),
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const totalLabel = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }).format(parsed);
};

const daysBetween = (from: string, to: string) => {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
};

const panelStyle = {
  background: 'var(--panel-soft)',
  borderColor: 'rgba(93, 103, 227, 0.2)',
};

const borderStyle = { borderColor: 'rgba(93, 103, 227, 0.3)' };

const inputClass =
  'rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:text-base';

const ghostButtonClass =
  'rounded-lg border px-3 py-2 text-xs text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-100 dark:hover:text-white md:px-4 md:text-sm';

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #5d67e3 0%, #8b5cf6 100%)',
  color: 'white',
};

function CashFlowPage() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const { summary } = data;

  const bucketMap = new Map<string, LedgerBucket>();
  for (const bucket of summary.buckets) {
    bucketMap.set(`${bucket.sourceType}-${bucket.sourceId}`, bucket);
  }
  const activeKey = summary.activeBucket
    ? `${summary.activeBucket.sourceType}-${summary.activeBucket.sourceId}`
    : null;

  const bucketStatus = (sourceType: 'salary' | 'borrow', id: number) => {
    const bucket = bucketMap.get(`${sourceType}-${id}`);
    if (!bucket) return { label: '—', remaining: 0 };
    if (bucket.remaining <= 0) {
      return {
        label: `Exhausted ${formatDate(bucket.exhaustedOn)}`,
        remaining: 0,
      };
    }
    const key = `${sourceType}-${id}`;
    if (key === activeKey) {
      return { label: 'Currently spending from this', remaining: bucket.remaining };
    }
    return { label: 'Queued (not touched yet)', remaining: bucket.remaining };
  };

  const refresh = () => router.invalidate();

  return (
    <div
      className='min-h-screen p-3 text-slate-900 dark:text-white md:p-4'
      style={{ background: 'var(--page-bg)' }}
    >
      <div
        className='mx-auto w-full max-w-5xl space-y-5 rounded-xl border border-white/10 p-4 shadow-2xl md:space-y-8 md:p-6'
        style={{ background: 'var(--panel-bg)', backdropFilter: 'blur(10px)' }}
      >
        <div className='flex flex-wrap items-center justify-between gap-3 md:gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-sm'>
              Cash flow
            </p>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white md:text-3xl'>
              Salary & Cash Tracking
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={async () => {
                await logout();
                router.navigate({ to: '/login' });
              }}
              className={ghostButtonClass}
              style={borderStyle}
              aria-label='Log out'
            >
              <LogOut size={16} aria-hidden='true' />
            </button>
            <Link to='/' search={{ month: todayIso().slice(0, 7) }} className={ghostButtonClass} style={borderStyle}>
              <span className='inline-flex items-center gap-2'>
                <ArrowLeft size={16} aria-hidden='true' />
                Back
              </span>
            </Link>
          </div>
        </div>

        <StatusCard summary={summary} outstandingBorrowTotal={data.outstandingBorrowTotal} />

        <SalarySection
          salaries={data.salaries}
          bucketStatus={bucketStatus}
          onChanged={refresh}
        />

        <BorrowSection
          borrows={data.borrows}
          bucketStatus={bucketStatus}
          onChanged={refresh}
        />

        <CashWithdrawalSection
          withdrawals={data.cashWithdrawals}
          onChanged={refresh}
        />
      </div>
    </div>
  );
}

function StatusCard({
  summary,
  outstandingBorrowTotal,
}: {
  summary: LedgerSummary;
  outstandingBorrowTotal: number;
}) {
  const active = summary.activeBucket;
  return (
    <div
      className='space-y-3 rounded-lg border p-4 md:p-5'
      style={panelStyle}
    >
      <h2 className='text-lg font-bold text-slate-800 dark:text-indigo-200 md:text-xl'>
        Current Status
      </h2>
      <div className='grid gap-3 md:grid-cols-2'>
        <div
          className='rounded-lg border p-3'
          style={borderStyle}
        >
          <p className='text-xs text-slate-600 dark:text-indigo-200/70'>
            Currently spending from
          </p>
          {active ? (
            <p className='mt-1 text-sm font-bold text-slate-900 dark:text-indigo-100 md:text-base'>
              {active.sourceType === 'salary' ? 'Salary' : 'Borrowed cash'} received{' '}
              {formatDate(active.date)} — {totalLabel(active.remaining)} left of{' '}
              {totalLabel(active.amount)}
            </p>
          ) : (
            <p className='mt-1 text-sm font-bold text-red-600 dark:text-red-300'>
              Nothing left — you are in deficit
            </p>
          )}
        </div>
        <div className='rounded-lg border p-3' style={borderStyle}>
          <p className='text-xs text-slate-600 dark:text-indigo-200/70'>
            Previous salary ended
          </p>
          <p className='mt-1 text-sm font-bold text-slate-900 dark:text-indigo-100 md:text-base'>
            {summary.previousSalaryEndedOn ? formatDate(summary.previousSalaryEndedOn) : 'N/A'}
          </p>
        </div>
        <div className='rounded-lg border p-3' style={borderStyle}>
          <p className='text-xs text-slate-600 dark:text-indigo-200/70'>
            If you got salary today, savings carried over would be
          </p>
          <p className='mt-1 text-sm font-bold text-slate-900 dark:text-indigo-100 md:text-base'>
            {totalLabel(summary.savings)}
          </p>
        </div>
        <div className='rounded-lg border p-3' style={borderStyle}>
          <p className='text-xs text-slate-600 dark:text-indigo-200/70'>
            Outstanding borrowed amount
          </p>
          <p className='mt-1 text-sm font-bold text-slate-900 dark:text-indigo-100 md:text-base'>
            {totalLabel(outstandingBorrowTotal)}
          </p>
        </div>
      </div>
      {summary.deficit > 0 && (
        <div
          className='rounded-lg border p-3 text-sm font-semibold text-red-700 dark:text-red-200'
          style={{ borderColor: 'rgba(248, 113, 113, 0.6)', background: 'rgba(248, 113, 113, 0.08)' }}
        >
          Unaccounted shortfall: {totalLabel(summary.deficit)}. Your logged expenses
          outrun every salary and borrow entry — consider adding a borrow record for
          the gap.
        </div>
      )}
    </div>
  );
}

type BucketStatusFn = (
  sourceType: 'salary' | 'borrow',
  id: number,
) => { label: string; remaining: number };

function SalarySection({
  salaries,
  bucketStatus,
  onChanged,
}: {
  salaries: Array<{ id: number; date: string; amount: number; note: string | null }>;
  bucketStatus: BucketStatusFn;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      await createSalary({ data: { date, amount: parsedAmount, note } });
      setAmount('');
      setNote('');
      onChanged();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this salary entry?')) return;
    await deleteSalary({ data: { id } });
    onChanged();
  };

  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-bold text-slate-800 dark:text-indigo-200 md:text-2xl'>
        Salary
      </h2>
      <form
        onSubmit={handleSubmit}
        className='grid gap-2 rounded-lg border p-4 md:grid-cols-[160px_140px_1fr_auto] md:items-end'
        style={panelStyle}
      >
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Date received</label>
          <input
            type='date'
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Amount</label>
          <input
            type='number'
            required
            step='1'
            min='0'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Note (optional)</label>
          <input
            type='text'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-60'
          style={primaryButtonStyle}
        >
          Add Salary
        </button>
      </form>

      <div className='overflow-hidden rounded-lg border' style={{ background: 'var(--table-bg)', ...borderStyle }}>
        <table className='w-full text-left text-xs text-slate-700 dark:text-indigo-100/80 md:text-sm'>
          <thead className='text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-xs'>
            <tr>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Date</th>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Amount</th>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Status</th>
              <th className='px-3 py-2 text-right font-medium md:px-4 md:py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => {
              const status = bucketStatus('salary', s.id);
              return (
                <tr key={s.id} className='border-t' style={{ borderColor: 'rgba(93, 103, 227, 0.1)' }}>
                  <td className='px-3 py-2 font-bold text-slate-900 dark:text-indigo-100 md:px-4 md:py-3'>
                    {formatDate(s.date)}
                  </td>
                  <td className='px-3 py-2 font-black text-slate-900 dark:text-indigo-100 md:px-4 md:py-3'>
                    {totalLabel(s.amount)}
                  </td>
                  <td className='px-3 py-2 md:px-4 md:py-3'>{status.label}</td>
                  <td className='px-3 py-2 text-right md:px-4 md:py-3'>
                    <button
                      type='button'
                      className='rounded-md border px-2 py-1 text-red-600 transition-all hover:text-red-700 dark:text-red-200 dark:hover:text-white'
                      style={{ borderColor: 'rgba(248, 113, 113, 0.6)' }}
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {salaries.length === 0 && (
              <tr>
                <td colSpan={4} className='px-4 py-8 text-center text-slate-500 dark:text-indigo-200/70'>
                  No salary entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BorrowSection({
  borrows,
  bucketStatus,
  onChanged,
}: {
  borrows: Array<{
    id: number;
    date: string;
    amount: number;
    source: string | null;
    note: string | null;
    repaidAt: string | null;
  }>;
  bucketStatus: BucketStatusFn;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      await createBorrow({ data: { date, amount: parsedAmount, source } });
      setAmount('');
      setSource('');
      onChanged();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this borrow entry?')) return;
    await deleteBorrow({ data: { id } });
    onChanged();
  };

  const toggleRepaid = async (id: number, currentlyRepaid: boolean) => {
    await setBorrowRepaid({
      data: { id, repaidAt: currentlyRepaid ? null : todayIso() },
    });
    onChanged();
  };

  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-bold text-slate-800 dark:text-indigo-200 md:text-2xl'>
        Borrowed (waiting on late salary)
      </h2>
      <form
        onSubmit={handleSubmit}
        className='grid gap-2 rounded-lg border p-4 md:grid-cols-[160px_140px_1fr_auto] md:items-end'
        style={panelStyle}
      >
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Date borrowed</label>
          <input
            type='date'
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Amount</label>
          <input
            type='number'
            required
            step='1'
            min='0'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>From (optional)</label>
          <input
            type='text'
            placeholder='e.g. brother, friend'
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-60'
          style={primaryButtonStyle}
        >
          Add Borrow
        </button>
      </form>

      <div className='overflow-hidden rounded-lg border' style={{ background: 'var(--table-bg)', ...borderStyle }}>
        <table className='w-full text-left text-xs text-slate-700 dark:text-indigo-100/80 md:text-sm'>
          <thead className='text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-xs'>
            <tr>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Date</th>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Amount</th>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>From</th>
              <th className='px-3 py-2 font-medium md:px-4 md:py-3'>Status</th>
              <th className='px-3 py-2 text-right font-medium md:px-4 md:py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((b) => {
              const repaid = Boolean(b.repaidAt);
              const days = daysBetween(b.date, b.repaidAt ?? todayIso());
              const status = bucketStatus('borrow', b.id);
              return (
                <tr key={b.id} className='border-t' style={{ borderColor: 'rgba(93, 103, 227, 0.1)' }}>
                  <td className='px-3 py-2 font-bold text-slate-900 dark:text-indigo-100 md:px-4 md:py-3'>
                    {formatDate(b.date)}
                  </td>
                  <td className='px-3 py-2 font-black text-slate-900 dark:text-indigo-100 md:px-4 md:py-3'>
                    {totalLabel(b.amount)}
                  </td>
                  <td className='px-3 py-2 md:px-4 md:py-3'>{b.source ?? '-'}</td>
                  <td className='px-3 py-2 md:px-4 md:py-3'>
                    {repaid ? (
                      <span className='text-emerald-600 dark:text-emerald-300'>
                        Repaid {formatDate(b.repaidAt)}
                      </span>
                    ) : (
                      <span className='text-red-600 dark:text-red-300'>
                        Outstanding {days !== null ? `(${days}d)` : ''}
                      </span>
                    )}
                    <div className='text-[0.65rem] text-slate-500 dark:text-indigo-200/60'>
                      {status.label}
                    </div>
                  </td>
                  <td className='px-3 py-2 text-right md:px-4 md:py-3'>
                    <div className='inline-flex items-center gap-2'>
                      <button
                        type='button'
                        className='rounded-md border px-2 py-1 transition-all'
                        style={borderStyle}
                        onClick={() => toggleRepaid(b.id, repaid)}
                      >
                        {repaid ? 'Mark unpaid' : 'Mark repaid'}
                      </button>
                      <button
                        type='button'
                        className='rounded-md border px-2 py-1 text-red-600 transition-all hover:text-red-700 dark:text-red-200 dark:hover:text-white'
                        style={{ borderColor: 'rgba(248, 113, 113, 0.6)' }}
                        onClick={() => handleDelete(b.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {borrows.length === 0 && (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-slate-500 dark:text-indigo-200/70'>
                  No borrow entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashWithdrawalSection({
  withdrawals,
  onChanged,
}: {
  withdrawals: Array<{ id: number; date: string; amount: number; memo: string | null }>;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      await createCashWithdrawal({ data: { date, amount: parsedAmount, memo } });
      setAmount('');
      setMemo('');
      onChanged();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this cash withdrawal memo?')) return;
    await deleteCashWithdrawal({ data: { id } });
    onChanged();
  };

  const grouped = new Map<string, typeof withdrawals>();
  for (const w of withdrawals) {
    const list = grouped.get(w.date) ?? [];
    list.push(w);
    grouped.set(w.date, list);
  }

  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-bold text-slate-800 dark:text-indigo-200 md:text-2xl'>
        Cash Withdrawal Memos
      </h2>
      <form
        onSubmit={handleSubmit}
        className='grid gap-2 rounded-lg border p-4 md:grid-cols-[160px_140px_1fr_auto] md:items-end'
        style={panelStyle}
      >
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Date</label>
          <input
            type='date'
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Amount</label>
          <input
            type='number'
            required
            step='1'
            min='0'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <div>
          <label className='text-xs text-slate-700 dark:text-indigo-200'>Memo (optional)</label>
          <input
            type='text'
            placeholder='e.g. ATM slip #1234'
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
            style={{ background: 'rgba(93, 103, 227, 0.1)', ...borderStyle }}
          />
        </div>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-60'
          style={primaryButtonStyle}
        >
          Add Withdrawal
        </button>
      </form>

      <div className='space-y-3'>
        {[...grouped.entries()].map(([groupDate, entries]) => (
          <div key={groupDate} className='overflow-hidden rounded-lg border' style={{ background: 'var(--table-bg)', ...borderStyle }}>
            <div className='px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:px-4'>
              {formatDate(groupDate)} · {totalLabel(entries.reduce((s, e) => s + e.amount, 0))}
            </div>
            <table className='w-full text-left text-xs text-slate-700 dark:text-indigo-100/80 md:text-sm'>
              <tbody>
                {entries.map((w) => (
                  <tr key={w.id} className='border-t' style={{ borderColor: 'rgba(93, 103, 227, 0.1)' }}>
                    <td className='px-3 py-2 font-black text-slate-900 dark:text-indigo-100 md:px-4 md:py-3'>
                      {totalLabel(w.amount)}
                    </td>
                    <td className='px-3 py-2 md:px-4 md:py-3'>{w.memo ?? '-'}</td>
                    <td className='px-3 py-2 text-right md:px-4 md:py-3'>
                      <button
                        type='button'
                        className='rounded-md border px-2 py-1 text-red-600 transition-all hover:text-red-700 dark:text-red-200 dark:hover:text-white'
                        style={{ borderColor: 'rgba(248, 113, 113, 0.6)' }}
                        onClick={() => handleDelete(w.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {withdrawals.length === 0 && (
          <div className='rounded-lg border px-4 py-8 text-center text-slate-500 dark:text-indigo-200/70' style={borderStyle}>
            No cash withdrawal memos yet.
          </div>
        )}
      </div>
    </div>
  );
}
