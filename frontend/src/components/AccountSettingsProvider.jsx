import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultSettings } from '../../../shared/settingsDefaults.js';
import { apiRequest } from '../services/authApi.js';
import { useAuth } from './AuthProvider.jsx';

const Context = createContext(null);
const initialSettings = () => {
  const settings = structuredClone(defaultSettings);
  try { const cached = localStorage.getItem('dsa-theme'); if (['dark', 'light', 'system'].includes(cached)) settings.appearance.theme = cached; } catch { /* Storage may be blocked; server preferences still work. */ }
  return settings;
};

export function AccountSettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const owner = useRef(user?.id);
  owner.current = user?.id;
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let current = true;
    if (!user) { setSettings(initialSettings()); setLoading(false); setError(''); return undefined; }
    setSettings(initialSettings()); setLoading(true); setError('');
    apiRequest('/api/settings').then((data) => { if (current) setSettings(data.settings); }).catch((reason) => { if (current) setError(reason.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [user?.id, reload]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const applyTheme = () => { document.documentElement.dataset.theme = settings.appearance.theme === 'system' ? (media.matches ? 'light' : 'dark') : settings.appearance.theme; };
    applyTheme(); media.addEventListener('change', applyTheme);
    try { localStorage.setItem('dsa-theme', settings.appearance.theme); } catch { /* Cosmetic cache only, not authentication. */ }
    const root = document.documentElement;
    root.dataset.readingSize = settings.accessibility.fontSize;
    root.dataset.readingWidth = settings.accessibility.readingWidth;
    root.dataset.readingSpacing = settings.accessibility.lineSpacing;
    root.dataset.reducedMotion = String(settings.accessibility.reducedMotion);
    root.dataset.enhancedContrast = String(settings.accessibility.enhancedContrast);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings]);

  const value = useMemo(() => ({ settings, loading: loading || authLoading, error, reloadSettings: () => setReload((value) => value + 1), saveSettings: async (patch) => {
    const savingOwner = owner.current;
    const result = await apiRequest('/api/settings', { method: 'PATCH', body: JSON.stringify(patch) });
    if (owner.current === savingOwner) { setSettings(result.settings); setError(''); }
    return result.settings;
  } }), [settings, loading, authLoading, error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAccountSettings() {
  const value = useContext(Context);
  if (!value) throw new Error('Account settings provider is required.');
  return value;
}
