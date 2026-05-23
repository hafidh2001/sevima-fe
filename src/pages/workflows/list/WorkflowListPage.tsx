import { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { SearchIcon, PlusIcon, Eye, Pencil, Trash } from "lucide-react";
import { BaseTable } from "@/components/basetable/BaseTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SingleSelect } from "@/components/fields/singleSelect";
import { InputField } from "@/components/fields/inputField";
import { CalendarSelect } from "@/components/fields/calendarSelect";
import { ConfirmationModal } from "@/components/confirmationModal";
import { useWorkflowStore } from "@/store/workflowStore";
import { useMasterStore } from "@/store/masterStore";
import { useAuthStore } from "@/store/authStore";
import { useUrlParams } from "@/hooks/useUrlParams";
import { showToast } from "@/utils/toast";
import { DEFAULT_PAGE_SIZE } from "@/constants/table";
import { ROUTES } from "@/utils/routes";
import { BasicSelectOpt, RoleEnum } from "@/types";
import { WorkflowResponse } from "@/types/workflow";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const WorkflowListPage = () => {
  const navigate = useNavigate();
  const {
    workflowData,
    isLoading,
    loadWorkflowList,
    deleteWorkflow,
    success,
    error,
  } = useWorkflowStore();

  const { user } = useAuthStore();
  const canEdit = user?.role === RoleEnum.ADMIN || user?.role === RoleEnum.EDITOR;

  const {
    workflowStatusOptions,
    fetchWorkflowStatusOptions,
  } = useMasterStore();

  // Delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    filterKeys: ["status", "from", "to"],
    searchDebounceMs: 500,
  });

  const fromDate = filters.from ? new Date(filters.from as string) : undefined;
  const toDate = filters.to ? new Date(filters.to as string) : undefined;

  const fetchWorkflows = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page,
        limit,
        name: debouncedSearch ?? undefined,
        status: filters.status ?? undefined,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
      };

      await loadWorkflowList(params);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat workflow";
      showToast(message, "error");
    }
  }, [
    page,
    limit,
    debouncedSearch,
    filters.status,
    filters.from,
    filters.to,
    loadWorkflowList,
  ]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Handle delete success/error
  useEffect(() => {
    if (success && deleteId !== null) {
      showToast(success, "success");
      setDeleteId(null);
      setIsDeleting(false);
      fetchWorkflows();
    }
    if (error && deleteId !== null) {
      showToast(error, "error");
      setDeleteId(null);
      setIsDeleting(false);
    }
  }, [success, error, deleteId, fetchWorkflows]);

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

  const handleFromDateChange = useCallback(
    (date: Date | undefined) => {
      setFilter("from", date ? dayjs(date).format("YYYY-MM-DD") : null);
    },
    [setFilter],
  );

  const handleToDateChange = useCallback(
    (date: Date | undefined) => {
      setFilter("to", date ? dayjs(date).format("YYYY-MM-DD") : null);
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

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    await deleteWorkflow(deleteId);
  }, [deleteId, deleteWorkflow]);

  const selectedWorkflowStatus = useMemo(() => {
    return (
      workflowStatusOptions.find((opt) => opt.value === filters.status) || null
    );
  }, [workflowStatusOptions, filters.status]);

  const columns: ColumnDef<WorkflowResponse>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama Workflow",
        size: 250,
        cell: ({ row }) => (
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</p>
            {row.original.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
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
          let className = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600";

          if (status === "ARCHIVED") {
            className = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40";
          } else if (status === "ACTIVE") {
            className = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40";
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
          <span className="text-center block text-gray-900 dark:text-gray-100">
            v{row.original.latestVersion?.version || "-"}
          </span>
        ),
      },
      {
        accessorKey: "_count.runs",
        header: "Total Run",
        size: 100,
        cell: ({ row }) => (
          <span className="text-center block text-gray-900 dark:text-gray-100">{row.original._count.runs}</span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Dibuat Oleh",
        size: 180,
        cell: ({ row }) => (
          <span className="text-left block text-gray-900 dark:text-gray-100">{row.original.createdBy.name}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal Dibuat",
        size: 150,
        cell: ({ row }) => (
          <span className="text-left block text-gray-900 dark:text-gray-100">
            {dayjs(row.original.createdAt).utc().format("DD MMM YYYY")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        size: 140,
        cell: ({ row: { original } }) => {
          const handleView = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigate(ROUTES.workflowDetail.replace(":id", String(original.id)));
          };

          const handleEdit = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigate(ROUTES.workflowEdit.replace(":id", String(original.id)));
          };

          const handleDeleteClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setDeleteId(original.id);
          };

          return (
            <div className="flex items-center justify-center gap-1 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleView}
                className="h-8 w-8 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    className="h-8 w-8 bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    className="h-8 w-8 bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, canEdit],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
        </div>
        {canEdit && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(ROUTES.workflowCreate)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Buat Workflow
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <InputField
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari workflow..."
          startIcon={<SearchIcon className="h-4 w-4 text-gray-400" />}
          containerClassName="flex-1 max-w-md"
        />
        <SingleSelect
          value={selectedWorkflowStatus}
          onChange={handleStatusChange}
          options={workflowStatusOptions}
          placeholder="Status"
          isSearchable={true}
          isClearable={true}
          selectClassName="w-full lg:w-[180px]"
        />
        <div className="flex items-center gap-2">
          <CalendarSelect
            value={fromDate}
            onChange={handleFromDateChange}
            placeholder="Dari Tanggal"
            containerClassName="w-full lg:w-[160px]"
          />
          <span className="text-gray-400">-</span>
          <CalendarSelect
            value={toDate}
            onChange={handleToDateChange}
            placeholder="Sampai Tanggal"
            containerClassName="w-full lg:w-[160px]"
            disabledCalendar={{ before: fromDate || new Date("2020-01-01") }}
          />
        </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isShown={deleteId !== null}
        toggle={(open) => {
          if (open === false) setDeleteId(null);
        }}
        title="Hapus Workflow"
        description="Apakah Anda yakin ingin menghapus workflow ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={handleDelete}
        confirmText="Hapus"
        cancelText="Batal"
        confirmVariant="destructive"
        cancelVariant="outline"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WorkflowListPage;
