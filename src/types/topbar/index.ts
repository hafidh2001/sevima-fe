import { ExportFormat } from "@/components/exportButton";

export type TBreadcrumb = {
  label: string;
  to?: string;
};

export interface ITopbarProps {
  breadcrumbs: TBreadcrumb[];
  onSearch?: (query: string) => void;
  onCreate?: () => void;
  onExport?: (format: ExportFormat) => void;
  onSave?: () => void;
  onDelete?: () => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  exportFormats?: ExportFormat[];
  /** Initial search value to sync with URL search params */
  initialSearchValue?: string;
}
