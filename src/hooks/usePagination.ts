import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

type UsePaginationParams = {
  defaultPage?: number;
  defaultLimit?: number;
};

type UsePaginationReturn = {
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  searchParams: ReturnType<typeof useSearchParams>[0];
};

/**
 * Simple pagination hook that manages page/limit state with URL sync.
 * URL is the source of truth for page.
 */
const usePagination = (params?: UsePaginationParams): UsePaginationReturn => {
  const { defaultPage = 1, defaultLimit = 10 } = params ?? {};

  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimitState] = useState<number>(
    defaultLimit >= 1 ? defaultLimit : 10
  );

  // Page is always read from URL - this is the source of truth
  const getPageFromUrl = useCallback((): number => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1) {
        return pageNum;
      }
    }
    return defaultPage;
  }, [searchParams, defaultPage]);

  const page = getPageFromUrl();

  const setPage = useCallback(
    (newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
  }, []);

  return {
    page,
    setPage,
    limit,
    setLimit,
    searchParams,
  };
};

export default usePagination;
