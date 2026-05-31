'use client';

import { useState, useEffect } from 'react';

export interface SapConfig {
  baseUrl: string;
  username: string;
  password: string;
}

const KEY = 'ps-pm-sap-config';

export function useSapConfig() {
  const [config, setConfig] = useState<SapConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setConfig(JSON.parse(stored));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  function saveConfig(c: SapConfig) {
    localStorage.setItem(KEY, JSON.stringify(c));
    setConfig(c);
  }

  function clearConfig() {
    localStorage.removeItem(KEY);
    setConfig(null);
  }

  return {
    config,
    isConfigured: !!config?.baseUrl,
    loaded,
    saveConfig,
    clearConfig,
  };
}
