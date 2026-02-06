import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useForm } from '@tanstack/react-form';

import {
  deleteExpense,
  getExpense,
  updateExpense,
  type ExpenseItem
} from './-index.server';

type FormItem = {
  name: string;
  cost: string;
};

const createEmptyItem = (): FormItem => ({ name: '', cost: '' });
const getMonthValue = (value: string) => value.slice(0, 7);
const getCurrentMonth = () => getMonthValue(new Date().toISOString());

const toFormItems = (items: ExpenseItem[]): FormItem[] =>
  items.length === 0
    ? [createEmptyItem()]
    : items.map((item) => ({
        name: item.name,
        cost: item.cost ? String(item.cost) : ''
      }));

const toExpenseItems = (items: FormItem[]): ExpenseItem[] =>
  items
    .map((item) => ({
      name: item.name.trim(),
      cost: Number.parseInt(item.cost, 10)
    }))
    .filter((item) => item.name.length > 0);

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

export const Route = createFileRoute('/expenses/$id')({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return await getExpense({ data: { id } });
  },
  component: EditExpense
});

function EditExpense() {
  const router = useRouter();
  const entry = Route.useLoaderData();

  const form = useForm({
    defaultValues: entry
      ? { date: entry.date, items: toFormItems(entry.items) }
      : { date: '', items: [createEmptyItem()] },
    onSubmit: async ({ value }) => {
      if (!entry || !value.date) return;
      await updateExpense({
        data: {
          id: entry.id,
          date: value.date,
          items: toExpenseItems(value.items)
        }
      });
      const month = getMonthValue(value.date);
      router.navigate({
        to: '/',
        search: { month }
      });
    }
  });

  const handleDelete = async () => {
    if (!entry) return;
    const message = `Delete expense entry ${formatDate(entry.date)} (${totalLabel(
      entry.total
    )})?`;
    if (!window.confirm(message)) return;

    try {
      await deleteExpense({ data: { id: entry.id } });
      const month = getMonthValue(entry.date);
      router.navigate({
        to: '/',
        search: { month }
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  if (!entry) {
    return (
    <div className='min-h-screen p-4 text-slate-900 dark:text-white md:p-6'>
      <div className='mx-auto max-w-xl rounded-xl border border-white/10 p-6'>
        <h1 className='text-xl font-semibold md:text-2xl'>
          Expense not found
        </h1>
        <p className='mt-2 text-xs text-slate-600 dark:text-indigo-200/70 md:text-sm'>
          The entry you are trying to edit does not exist.
        </p>
        <Link
          to='/'
          search={{ month: getCurrentMonth() }}
          className='mt-4 inline-flex rounded-lg border px-3 py-2 text-xs text-slate-700 dark:text-indigo-100 md:px-4 md:text-sm'
          style={{ borderColor: 'rgba(93, 103, 227, 0.3)' }}
        >
            <span className='inline-flex items-center gap-2'>
              <ArrowLeft
                size={16}
                aria-hidden='true'
              />
              Back
            </span>
          </Link>
      </div>
    </div>
    );
  }

  return (
    <div
      className='min-h-screen p-3 text-slate-900 dark:text-white md:p-4'
      style={{
        background: 'var(--page-bg)'
      }}
    >
      <div
        className='mx-auto w-full max-w-3xl space-y-5 rounded-xl border border-white/10 p-4 shadow-2xl md:space-y-6 md:p-6'
        style={{
          background: 'var(--panel-bg)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className='flex flex-wrap items-center justify-between gap-3 md:gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-sm'>
              Edit entry
            </p>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white md:text-3xl'>
              Expense #{entry.id}
            </h1>
            <p className='text-xs text-slate-600 dark:text-indigo-200/80 md:text-sm'>
              {formatDate(entry.date)}
            </p>
          </div>
          <Link
            to='/'
            search={{ month: getMonthValue(entry.date) }}
            className='rounded-lg border px-3 py-2 text-xs text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-100 dark:hover:text-white md:px-4 md:text-sm'
            style={{ borderColor: 'rgba(93, 103, 227, 0.3)' }}
          >
            <span className='inline-flex items-center gap-2'>
              <ArrowLeft
                size={16}
                aria-hidden='true'
              />
              Back
            </span>
          </Link>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className='space-y-4 rounded-lg border p-4 md:p-5'
          style={{
            background: 'var(--panel-soft)',
            borderColor: 'rgba(93, 103, 227, 0.2)'
          }}
        >
          <form.Field name='date'>
            {(field) => (
              <div>
                <label className='text-xs text-slate-700 dark:text-indigo-200 md:text-sm'>
                  Date
                </label>
                <input
                  type='date'
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className='mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:px-4 md:py-3 md:text-base'
                  style={{
                    background: 'rgba(93, 103, 227, 0.1)',
                    borderColor: 'rgba(93, 103, 227, 0.3)'
                  }}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='items'>
            {(itemsField) => (
              <>
                <div className='space-y-3'>
                  {itemsField.state.value.map((_, index) => (
                    <div
                      key={`edit-${index}`}
                      className='grid gap-2 md:grid-cols-[1fr_120px_auto]'
                    >
                      <form.Field name={`items[${index}].name` as const}>
                        {(field) => (
                          <input
                            type='text'
                            placeholder='Expense name'
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                        className='rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:text-base'
                            style={{
                              background: 'rgba(93, 103, 227, 0.1)',
                              borderColor: 'rgba(93, 103, 227, 0.3)'
                            }}
                          />
                        )}
                      </form.Field>
                      <form.Field name={`items[${index}].cost` as const}>
                        {(field) => (
                          <input
                            type='number'
                            step='1'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            placeholder='Cost'
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                        className='rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:text-base'
                            style={{
                              background: 'rgba(93, 103, 227, 0.1)',
                              borderColor: 'rgba(93, 103, 227, 0.3)'
                            }}
                          />
                        )}
                      </form.Field>
                      <button
                        type='button'
                        onClick={() => itemsField.removeValue(index)}
                        className='rounded-lg border px-3 py-2 text-xs text-slate-600 transition-all hover:text-slate-900 dark:text-indigo-200/80 dark:hover:text-white md:text-sm'
                        style={{
                          borderColor: 'rgba(93, 103, 227, 0.3)'
                        }}
                        disabled={itemsField.state.value.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type='button'
                  onClick={() => itemsField.pushValue(createEmptyItem())}
                  className='w-full rounded-lg border px-3 py-2 text-xs text-slate-600 transition-all hover:text-slate-900 dark:text-indigo-200/80 dark:hover:text-white md:px-4 md:text-sm'
                  style={{
                    borderColor: 'rgba(93, 103, 227, 0.3)'
                  }}
                >
                  Add another expense
                </button>
              </>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.items}>
            {(items) => {
              const total = items.reduce(
                (sum, item) => sum + (Number(item.cost) || 0),
                0
              );
              return (
                <div className='flex items-center justify-between text-xs text-slate-600 dark:text-indigo-200/80 md:text-sm'>
                  <span>Total</span>
                  <span className='text-slate-900 dark:text-indigo-100'>
                    {totalLabel(total)}
                  </span>
                </div>
              );
            }}
          </form.Subscribe>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <button
              type='submit'
              className='w-full rounded-lg px-4 py-2 font-semibold shadow-lg transition-all hover:shadow-xl md:py-3'
              style={{
                background: 'linear-gradient(135deg, #5d67e3 0%, #8b5cf6 100%)',
                color: 'white'
              }}
            >
              Update Entry
            </button>
            <button
              type='button'
              onClick={handleDelete}
              className='w-full rounded-lg border px-4 py-2 text-xs text-red-600 transition-all hover:text-red-700 dark:text-red-200 dark:hover:text-white md:py-3 md:text-sm'
              style={{
                borderColor: 'rgba(248, 113, 113, 0.6)'
              }}
            >
              Delete Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
