import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

function getDocumentMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(getDocumentMode());

  useEffect(() => {
    const el = document.documentElement;

    const update = () => setMode(getDocumentMode());

    // Observe class/data-theme changes made by the navbar toggle
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // Also react to storage changes (multi-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tf-theme') update();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mo.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return mode;
}
