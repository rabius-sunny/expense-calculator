import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';

import appCss from '../styles.css?url';
import ThemeToggle from '@/components/ThemeToggle';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'My Expense Calculator'
      }
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss
      }
    ]
  }),

  notFoundComponent: () => (
    <div className='min-h-screen bg-background text-foreground flex items-center justify-center p-6'>
      <div className='max-w-md text-center space-y-3'>
        <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm'>
          404
        </p>
        <h1 className='text-xl font-semibold md:text-2xl'>Page not found</h1>
        <p className='text-xs text-muted-foreground md:text-sm'>
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  ),

  shellComponent: RootDocument
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false}>
          {children}
          <ThemeToggle />
        </ThemeProvider>

        <Scripts />
      </body>
    </html>
  );
}
