import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

/** Apply the theme to the document root (data-theme attribute on <html>) */
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Detect system preference on first visit */
function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getSystemTheme(),
      toggleTheme: () =>
        set((state) => {
          const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
          applyTheme(next);
          return { theme: next };
        }),
      setTheme: (t: Theme) => {
        applyTheme(t);
        set({ theme: t });
      },
    }),
    {
      name: 'stetho-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
        else applyTheme(getSystemTheme());
      },
    }
  )
);
