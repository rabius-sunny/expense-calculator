import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Plus } from 'lucide-react';
import { deleteExpense, getExpenses } from './-index.server';

export const Route = createFileRoute('/')({
  validateSearch: (search) => {
    const month =
      typeof search.month === 'string' && search.month
        ? search.month
        : getMonthValue(new Date());
    return {
      month
    };
  },
  loaderDeps: ({ search }) => search,
  component: ExpenseCalculator,
  loader: async ({ deps }) => await getExpenses({ data: deps })
});

const getMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const parseMonth = (value: string) => new Date(`${value}-01T00:00:00`);
const buildMonthOptions = (selected: string) => {
  const now = new Date();
  const options = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return getMonthValue(date);
  }).reverse();
  if (!options.includes(selected)) {
    options.push(selected);
  }
  return options;
};

function ExpenseCalculator() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const [filterMonth, setFilterMonth] = useState(search.month);

  useEffect(() => {
    setFilterMonth(search.month);
  }, [search.month]);

  const handleDelete = async (entry: {
    id: number;
    date: string;
    total: number;
  }) => {
    const message = `Delete expense entry ${formatDate(entry.date)} (${totalLabel(
      entry.total
    )})?`;
    if (!window.confirm(message)) return;

    try {
      await deleteExpense({ data: { id: entry.id } });
      router.invalidate();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const expenses = data.items;
  const hasSearch = Boolean(search.month);
  const emptyStateMessage = hasSearch
    ? 'No expenses match that month yet.'
    : 'No expenses yet. Create your first entry.';
  const showEmpty = expenses.length === 0;

  const totalLabel = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).format(parsed);
  };

  const monthDate = parseMonth(search.month);
  const formatMonth = (value: string) => {
    const parsed = parseMonth(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: '2-digit'
    }).format(parsed);
  };
  const pageInfo = `${formatMonth(search.month)}`;
  const monthTotalLabel = totalLabel(data.monthTotal);
  const prevMonth = getMonthValue(
    new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
  );
  const nextMonth = getMonthValue(
    new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
  );
  const monthOptions = buildMonthOptions(search.month);

  return (
    <div
      className='min-h-screen p-3 text-slate-900 dark:text-white md:p-4'
      style={{
        background: 'var(--page-bg)'
      }}
    >
      <div
        className='mx-auto w-full max-w-5xl space-y-5 rounded-xl border border-white/10 p-4 shadow-2xl md:space-y-8 md:p-6'
        style={{
          background: 'var(--panel-bg)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div
          className='sticky top-3 z-20 flex items-center justify-between rounded-lg p-3 md:top-4 md:p-4'
          style={{
            background: 'var(--header-bg)',
            border: '1px solid rgba(93, 103, 227, 0.2)'
          }}
        >
          <div>
            <h1 className='text-lg font-bold text-slate-900 dark:text-white md:text-xl'>
              Expense Entries
            </h1>
            <p className='flex gap-1 text-xs text-slate-600 dark:text-indigo-200/70 md:text-sm'>
              <span>{pageInfo}</span> |
              <span className='text-slate-900 dark:text-indigo-100 font-bold'>
                {monthTotalLabel}
              </span>
            </p>
          </div>
          <Link
            to='/create'
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg transition-all hover:shadow-xl md:px-4 md:text-sm'
            style={{
              background: 'linear-gradient(135deg, #5d67e3 0%, #8b5cf6 100%)',
              color: 'white'
            }}
          >
            New <Plus size={16} />
          </Link>
        </div>

        <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-3'>
          <div>
            <label className='text-xs text-slate-700 dark:text-indigo-200 md:text-sm'>
              Month
            </label>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      month: prevMonth
                    })
                  })
                }
                className='rounded-lg border p-2 text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-200 dark:hover:text-white'
                style={{
                  borderColor: 'rgba(93, 103, 227, 0.3)'
                }}
                aria-label='Previous month'
              >
                <svg
                  aria-hidden='true'
                  viewBox='0 0 24 24'
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M15 18l-6-6 6-6' />
                </svg>
              </button>
              <select
                value={filterMonth}
                onChange={(event) => {
                  setFilterMonth(event.target.value);
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      month: event.target.value
                    })
                  });
                }}
                className='rounded-lg border px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 dark:text-white'
                style={{
                  background: 'rgba(93, 103, 227, 0.1)',
                  borderColor: 'rgba(93, 103, 227, 0.3)'
                }}
              >
                {monthOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {formatMonth(option)}
                  </option>
                ))}
              </select>
              <button
                type='button'
                onClick={() =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      month: nextMonth
                    })
                  })
                }
                className='rounded-lg border p-2 text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-200 dark:hover:text-white'
                style={{
                  borderColor: 'rgba(93, 103, 227, 0.3)'
                }}
                aria-label='Next month'
              >
                <svg
                  aria-hidden='true'
                  viewBox='0 0 24 24'
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M9 18l6-6-6-6' />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-slate-800 dark:text-indigo-200 md:text-2xl'>
              Entries
            </h2>
          </div>

          <div
            className='overflow-hidden rounded-lg border'
            style={{
              background: 'var(--table-bg)',
              borderColor: 'rgba(93, 103, 227, 0.2)'
            }}
          >
            <table className='w-full text-left text-xs text-slate-700 dark:text-indigo-100/80 md:text-sm'>
              <thead className='text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-xs'>
                <tr>
                  <th className='px-3 py-2 font-medium md:px-4 md:py-3'>
                    Date
                  </th>
                  <th className='px-3 py-2 font-medium md:px-4 md:py-3'>
                    Total
                  </th>
                  <th className='px-3 py-2 text-right font-medium md:px-4 md:py-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((entry) => (
                  <tr
                    key={entry.id}
                    className='border-t'
                    style={{ borderColor: 'rgba(93, 103, 227, 0.1)' }}
                  >
                    <td className='px-3 py-2 text-slate-900 dark:text-indigo-100 font-bold md:px-4 md:py-3'>
                      {formatDate(entry.date)}
                    </td>
                    <td className='px-3 py-2 text-slate-900 dark:text-indigo-100 font-black md:px-4 md:py-3'>
                      {totalLabel(entry.total)}
                    </td>
                    <td className='px-3 py-2 text-right md:px-4 md:py-3'>
                      <div className='inline-flex items-center gap-2'>
                        <Link
                          to='/expenses/$id'
                          params={{ id: String(entry.id) }}
                          className='rounded-md border px-2 py-1 text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-100 dark:hover:text-white'
                          style={{
                            borderColor: 'rgba(93, 103, 227, 0.35)'
                          }}
                          aria-label={`Edit entry ${formatDate(entry.date)}`}
                        >
                          <svg
                            aria-hidden='true'
                            viewBox='0 0 24 24'
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M12 20h9' />
                            <path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' />
                          </svg>
                        </Link>
                        <button
                          type='button'
                          className='rounded-md border px-2 py-1 text-red-600 transition-all hover:text-red-700 dark:text-red-200 dark:hover:text-white'
                          style={{
                            borderColor: 'rgba(248, 113, 113, 0.6)'
                          }}
                          onClick={() => handleDelete(entry)}
                          aria-label={`Delete entry ${formatDate(entry.date)}`}
                        >
                          <svg
                            aria-hidden='true'
                            viewBox='0 0 24 24'
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M3 6h18' />
                            <path d='M8 6V4h8v2' />
                            <path d='M10 11v6' />
                            <path d='M14 11v6' />
                            <path d='M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {showEmpty && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-4 py-8 text-center text-slate-500 dark:text-indigo-200/70 md:py-10'
                    >
                      {emptyStateMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
