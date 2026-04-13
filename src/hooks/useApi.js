import { useState, useEffect, useCallback } from 'react';

/**
 * useApi — universal data fetching hook
 * Returns { data, loading, error, refetch }
 *
 * Options:
 *   silent: true — swallows errors silently (for non-critical widgets
 *                  where a backend 500/400 should not break the page)
 */
export function useApi(apiFn, params = null, deps = [], options = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(params);
      setData(res.data?.data ?? res.data);
    } catch (e) {
      const status = e.response?.status;
      const msg    = e.response?.data?.message || e.message || 'Something went wrong';

      // 500 = backend error (endpoint not ready yet)
      // 400 with "not linked" = pharmacy not approved/linked yet
      // In both cases set data to null and only store error if not silent
      if (!options.silent) {
        setError(msg);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * useApiAction — for mutations (POST, PATCH, DELETE)
 * Does NOT run on mount — only runs when you call execute()
 */
export function useApiAction(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res    = await apiFn(...args);
      const result = res.data?.data ?? res.data;
      setData(result);
      return result;
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Action failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, loading, error, data };
}