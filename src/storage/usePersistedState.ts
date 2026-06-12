import { useCallback, useEffect, useState } from 'react';
import { load, save } from './store';

/**
 * Like useState but backed by AsyncStorage.
 * Returns [value, setValue, loading].
 * setValue saves immediately — no useEffect watcher needed.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setRaw] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load<T>(key)
      .then((stored) => {
        if (stored !== null) {
          setRaw(stored);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`[usePersistedState] key="${key}" load error:`, err);
        setLoading(false);
      });
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setRaw((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        save(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setValue, loading];
}
