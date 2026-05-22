import { useEffect, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SearchIcon, PlusIcon } from "lucide-react";
import { BaseTable } from "@/components/basetable/BaseTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SingleSelect } from "@/components/fields/singleSelect";
import { InputField } from "@/components/fields/inputField";
import { useWorkflowStore } from "@/store/workflowStore";
import { useMasterStore } from "@/store/masterStore";
import { useUrlParams } from "@/hooks/useUrlParams";
import { showToast } from "@/utils/toast";
import { DEFAULT_PAGE_SIZE } from "@/constants/table";
import type { WorkflowStatusOption } from "@/types/master/store";
import { BasicSelectOpt } from "@/types";
import { WorkflowResponse } from "@/types/workflow";

export const WorkflowListPage = () => {
  const { workflowData, isLoading, loadWorkflowList } = useWorkflowStore();

  const {
    workflowStatusOptions,
    isLoadingWorkflowStatusOptions,
    fetchWorkflowStatusOptions,
  } = useMasterStore();

  useEffect(() => {
    fetchWorkflowStatusOptions();
  }, [fetchWorkflowStatusOptions]);

  const {
    page,
    limit,
    search,
    debouncedSearch,
    filters,
    setSearch,
    setFilter,
    setPage,
    setLimit,
  } = useUrlParams({
    defaultPage: 1,
    defaultLimit: DEFAULT_PAGE_SIZE,
    filterKeys: ["status"],
    searchDebounceMs: 500,
  });

  const statusFilter = (filters.status as WorkflowStatusOption) || "all";

  const fetchWorkflows = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page,
        limit,
      };

      if (debouncedSearch) {
        params.name = debouncedSearch;
      }

      if (statusFilter !== "all") {
        // Backend accepts uppercase values: ACTIVE, DRAFT, ARCHIVED
        params.status = statusFilter.toUpperCase();
      }

      await loadWorkflowList(params);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat workflow";
      showToast(message, "error");
    }
  }, [page, limit, debouncedSearch, statusFilter, loadWorkflowList]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
    },
    [setSearch],
  );

  const handleStatusChange = useCallback(
    (option: BasicSelectOpt<string | number> | null) => {
      const value = option?.value as string;
      setFilter("status", value === "all" ? null : value);
    },
    [setFilter],
  );

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setLimit(pageSize, pageIndex !== page - 1);
      if (pageIndex !== page - 1) {
        setPage(pageIndex + 1);
      }
    },
    [page, setLimit, setPage],
  );

  const statusSelectValue = useMemo(() => {
    return (
      workflowStatusOptions.find((opt) => opt.value === statusFilter) || null
    );
  }, [workflowStatusOptions, statusFilter]);

  const columns: ColumnDef<WorkflowResponse>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama Workflow",
        size: 250,
        cell: ({ row }) => (
          <div className="text-left">
            <p className="font-medium text-gray-900">{row.original.name}</p>
            {row.original.description && (
              <p className="text-sm text-gray-500 truncate max-w-xs">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const { status } = row.original;
          let className = "bg-gray-100 text-gray-800 hover:bg-gray-100";

          if (status === "ARCHIVED") {
            className = "bg-orange-100 text-orange-800 hover:bg-orange-100";
          } else if (status === "ACTIVE") {
            className = "bg-green-100 text-green-800 hover:bg-green-100";
          }

          return (
            <Badge variant="secondary" className={className}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "latestVersion",
        header: "Versi",
        size: 80,
        cell: ({ row }) => (
          <span className="text-center block">
            v{row.original.latestVersion?.version || "-"}
          </span>
        ),
      },
      {
        accessorKey: "_count.runs",
        header: "Total Run",
        size: 100,
        cell: ({ row }) => (
          <span className="text-center block">{row.original._count.runs}</span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Dibuat Oleh",
        size: 180,
        cell: ({ row }) => (
          <span className="text-left block">{row.original.createdBy.name}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal Dibuat",
        size: 150,
        cell: ({ row }) => (
          <span className="text-left block">
            {new Date(row.original.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Buat Workflow
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <InputField
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari workflow..."
          startIcon={<SearchIcon className="h-4 w-4 text-gray-400" />}
          containerClassName="flex-1 max-w-md"
        />
        <SingleSelect
          value={statusSelectValue}
          onChange={handleStatusChange}
          options={workflowStatusOptions}
          isLoading={isLoadingWorkflowStatusOptions}
          placeholder="Status"
          isSearchable={true}
          isClearable={true}
          selectClassName="w-full sm:w-[180px]"
        />
      </div>

      <div className="h-[calc(100vh-280px)]">
        <BaseTable
          data={workflowData.list}
          columns={columns}
          isShowNumbering
          isLoading={isLoading}
          pagination={{
            enabled: true,
            mode: "server",
            initialPageIndex: page - 1,
            initialPageSize: limit,
            pageCount: workflowData.pagination.pageCount,
          }}
          onPaginationChange={handlePaginationChange}
          meta={{
            page: workflowData.pagination.page,
            offset: workflowData.pagination.limit,
            pageCount: workflowData.pagination.pageCount,
          }}
          noDataText="Tidak ada workflow yang ditemukan"
        />
      </div>
    </div>
  );
};

export default WorkflowListPage;
