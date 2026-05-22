import React from 'react';
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  pageSize: number;
  pageOptions?: number[];
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  setPageIndex,
  setPageSize,
  pageSize,
  pageOptions = [10, 20, 30, 40, 50],
  isLoading = false,
}) => {
  const currentPage = pageIndex + 1;
  const totalPages = Math.max(pageCount, 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-2">
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              const newPageSize = Number(value);
              setPageIndex(0);
              setTimeout(() => {
                setPageSize(newPageSize);
              }, 0);
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap sm:hidden">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:block">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPageIndex(0)}
            disabled={!canPreviousPage || isLoading}
            className="h-8 w-8"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={!canPreviousPage || isLoading}
            className="h-8 w-8"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={!canNextPage || isLoading}
            className="h-8 w-8"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={!canNextPage || isLoading}
            className="h-8 w-8"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
