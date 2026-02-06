import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type='button'
      onClick={toggleTheme}
      className='fixed bottom-5 right-5 z-50 rounded-full border border-slate-300 dark:border-slate-500 bg-white p-3 text-slate-700 shadow-lg transition-all hover:text-slate-900 hover:shadow-xl dark:bg-gray-900 dark:text-slate-200 dark:hover:text-white'
      aria-label='Toggle theme'
    >
      {mounted && theme === 'dark' ? (
        <Sun
          size={18}
          aria-hidden='true'
        />
      ) : (
        <Moon
          size={18}
          aria-hidden='true'
        />
      )}
    </button>
  );
}
