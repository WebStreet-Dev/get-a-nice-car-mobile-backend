import { useState, useEffect, ReactNode } from 'react';
import { Spin } from 'antd';
import { setApiBaseUrl } from './services/api';

const CONFIG_PATH = `${import.meta.env.BASE_URL}config.json`;

/**
 * Fetches config.json (if present) and sets API base URL at runtime.
 * This allows the admin panel to work when VITE_API_URL is not available at build time (e.g. Dokploy).
 */
export function ConfigLoader({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setReady(true);
    };
    fetch(CONFIG_PATH)
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        if (cancelled || !config) return;
        const url = config.VITE_API_URL;
        if (url && typeof url === 'string') {
          setApiBaseUrl(url);
        }
      })
      .catch(() => {})
      .finally(done);
    const t = setTimeout(done, 3000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
