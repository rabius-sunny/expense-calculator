import { useForm } from '@tanstack/react-form';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeft, LogOut } from 'lucide-react';

import { createExpense, type ExpenseItem } from './-index.server';
import { logout } from './-auth.server';
import { requireAuth } from './-auth';

export const Route = createFileRoute('/create')({
  beforeLoad: requireAuth,
  component: CreateExpense
});

type FormItem = {
  name: string;
  cost: string;
};

const createEmptyItem = (): FormItem => ({ name: '', cost: '' });
const getMonthValue = (value: string) => value.slice(0, 7);
const getCurrentMonth = () => getMonthValue(new Date().toISOString());

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

function CreateExpense() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      date: '',
      items: [createEmptyItem()]
    },
    onSubmit: async ({ value }) => {
      if (!value.date) return;
      await createExpense({
        data: {
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
              New entry
            </p>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white md:text-3xl'>
              Create Expense Entry
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={async () => {
                await logout();
                router.navigate({ to: '/login' });
              }}
              className='rounded-lg border px-3 py-2 text-xs text-slate-700 transition-all hover:text-slate-900 dark:text-indigo-100 dark:hover:text-white md:px-4 md:text-sm'
              style={{ borderColor: 'rgba(93, 103, 227, 0.3)' }}
              aria-label='Log out'
            >
              <LogOut
                size={16}
                aria-hidden='true'
              />
            </button>
            <Link
              to='/'
              search={{ month: getCurrentMonth() }}
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
                  required
                  type='date'
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
                      key={`new-${index}`}
                      className='grid gap-2 md:grid-cols-[1fr_120px_auto]'
                    >
                      <form.Field name={`items[${index}].name` as const}>
                        {(field) => (
                          <input
                            type='text'
                            required
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
                            required
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
                  <span className='text-slate-900 dark:text-indigo-100 font-bold'>
                    {totalLabel(total)}
                  </span>
                </div>
              );
            }}
          </form.Subscribe>

          <button
            type='submit'
            className='w-full rounded-lg px-4 py-2 font-semibold shadow-lg transition-all hover:shadow-xl md:py-3'
            style={{
              background: 'linear-gradient(135deg, #5d67e3 0%, #8b5cf6 100%)',
              color: 'white'
            }}
          >
            Save Entry
          </button>
        </form>
      </div>
    </div>
  );
}
