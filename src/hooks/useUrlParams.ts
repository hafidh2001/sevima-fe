import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "./useDebounce";

type UrlParamOptions = {
  /** Default page number (default: 1) */
  defaultPage?: number;
  /** Default page size/limit (default: 10) */
  defaultLimit?: number;
  /** Keys for filter params that should be read from URL */
  filterKeys?: string[];
  /** Debounce delay for search param in ms (default: 500) */
  searchDebounceMs?: number;
};

type UseUrlParamsReturn = {
  // URL SearchParams instance
  searchParams: ReturnType<typeof useSearchParams>[0];
  setSearchParams: ReturnType<typeof useSearchParams>[1];

  // Parsed params
  page: number;
  limit: number;
  search: string;
  /** Debounced search value - use this for API calls */
  debouncedSearch: string;

  // Filter params (key-value object with all filter values from URL)
  filters: Record<string, string | null>;

  // URL setters
  /** Set a single param */
  setParam: (key: string, value: string | number | null | undefined) => void;
  /** Update multiple params at once */
  updateParams: (updates: Record<string, string | number | null | undefined>) => void;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set limit and optionally reset to page 1 */
  setLimit: (limit: number, resetPage?: boolean) => void;
  /** Set search query (resets to page 1) */
  setSearch: (search: string) => void;
  /** Set filter value (resets to page 1) */
  setFilter: (key: string, value: string | number | null | undefined) => void;
  /** Set multiple filters at once (resets to page 1) */
  setFilters: (filters: Record<string, string | number | null | undefined>) => void;
  /** Reset all params to defaults */
  resetParams: (preserveParams?: string[]) => void;

  // Utility
  /** Check if a param exists in URL */
  hasParam: (key: string) => boolean;
  /** Get a raw param value */
  getParam: (key: string) => string | null;
  /** Get parsed number param (returns null if invalid/not found) */
  getNumberParam: (key: string) => number | null;
};

/**
 * Hook for managing URL search params with common patterns.
 * Provides type-safe access to pagination, search, and filter params.
 *
 * @example
 * ```tsx
 * const {
 *   page, limit, search, debouncedSearch,
 *   filters, setPage, setLimit, setSearch, setFilter, resetParams
 * } = useUrlParams({
 *   defaultPage: 1,
 *   defaultLimit: 20,
 *   filterKeys: ['id_ppds', 'id_staff', 'status'],
 * });
 * ```
 */
export const useUrlParams = (options?: UrlParamOptions): UseUrlParamsReturn => {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    filterKeys = [],
    searchDebounceMs = 500,
  } = options ?? {};

  const [searchParams, setSearchParams] = useSearchParams();

  // ========== Parsed Params ==========

  const page = useMemo(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : defaultPage;
  }, [searchParams, defaultPage]);

  const limit = useMemo(() => {
    const l = searchParams.get("limit");
    return l ? parseInt(l, 10) : defaultLimit;
  }, [searchParams, defaultLimit]);

  const search = useMemo(() => {
    return searchParams.get("search") || "";
  }, [searchParams]);

  const debouncedSearch = useDebounce(search, searchDebounceMs);

  const filters = useMemo(() => {
    const result: Record<string, string | null> = {};
    filterKeys.forEach((key) => {
      result[key] = searchParams.get(key);
    });
    return result;
  }, [searchParams, filterKeys]);

  // ========== URL Setters ==========

  /**
   * Set a single param, removing it if value is null/undefined/empty
   */
  const setParam = useCallback(
    (key: string, value: string | number | null | undefined) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (value === null || value === undefined || value === "") {
            newParams.delete(key);
          } else {
            newParams.set(key, String(value));
          }
          return newParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /**
   * Update multiple params at once
   */
  const updateParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
              newParams.delete(key);
            } else {
              newParams.set(key, String(value));
            }
          });
          return newParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /**
   * Set page number
   */
  const setPage = useCallback(
    (newPage: number) => {
      setParam("page", newPage);
    },
    [setParam],
  );

  /**
   * Set limit, optionally resetting to page 1
   */
  const setLimit = useCallback(
    (newLimit: number, resetPage = false) => {
      if (resetPage) {
        updateParams({ limit: newLimit, page: 1 });
      } else {
        setParam("limit", newLimit);
      }
    },
    [setParam, updateParams],
  );

  /**
   * Set search query (always resets to page 1)
   */
  const setSearch = useCallback(
    (newSearch: string) => {
      updateParams({ search: newSearch, page: 1 });
    },
    [updateParams],
  );

  /**
   * Set a single filter (always resets to page 1)
   */
  const setFilter = useCallback(
    (key: string, value: string | number | null | undefined) => {
      updateParams({ [key]: value, page: 1 });
    },
    [updateParams],
  );

  /**
   * Set multiple filters at once (always resets to page 1)
   */
  const setFilters = useCallback(
    (newFilters: Record<string, string | number | null | undefined>) => {
      updateParams({ ...newFilters, page: 1 });
    },
    [updateParams],
  );

  /**
   * Reset all params to defaults, optionally preserving some params
   */
  const resetParams = useCallback(
    (preserveParams: string[] = []) => {
      const preserved: Record<string, string | null> = {};
      preserveParams.forEach((key) => {
        preserved[key] = searchParams.get(key);
      });

      setSearchParams(
        () => {
          const newParams = new URLSearchParams();
          // Restore preserved params
          Object.entries(preserved).forEach(([key, value]) => {
            if (value !== null) {
              newParams.set(key, value);
            }
          });
          // Set defaults
          newParams.set("page", String(defaultPage));
          newParams.set("limit", String(defaultLimit));
          return newParams;
        },
        { replace: true },
      );
    },
    [searchParams, setSearchParams, defaultPage, defaultLimit],
  );

  // ========== Utilities ==========

  const hasParam = useCallback(
    (key: string) => {
      return searchParams.has(key);
    },
    [searchParams],
  );

  const getParam = useCallback(
    (key: string) => {
      return searchParams.get(key);
    },
    [searchParams],
  );

  const getNumberParam = useCallback(
    (key: string) => {
      const val = searchParams.get(key);
      if (!val) return null;
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    },
    [searchParams],
  );

  return {
    searchParams,
    setSearchParams,
    page,
    limit,
    search,
    debouncedSearch,
    filters,
    setParam,
    updateParams,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setFilters,
    resetParams,
    hasParam,
    getParam,
    getNumberParam,
  };
};

export default useUrlParams;
