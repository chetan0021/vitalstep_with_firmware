'use client'

import { useTheme } from './ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/15 dark:hover:bg-white/15 border border-black/10 dark:border-white/10"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600 stroke-[2.5]" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/[0.08]"
    >
      <div className="flex items-center gap-2.5">
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600 stroke-[2.5]" />
        )}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </div>
      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-400">
        {theme === 'dark' ? 'Horlicks Light' : 'Midnight'}
      </span>
    </button>
  )
}
