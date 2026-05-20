import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileArchiveIcon,
  FileDownIcon,
  FileStackIcon,
  FileTextIcon,
} from "lucide-react";
import { DialogTrigger } from "@radix-ui/react-dialog";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
  disabled?: boolean;
  formats?: ExportFormat[];
}

export const ExportButton = ({
  onExport,
  loading = false,
  disabled = false,
  formats = ["csv", "excel"],
}: ExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || loading}>
          <FileDownIcon size={16} />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Pilih format file untuk export data
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          {formats.includes("csv") && (
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              className="flex-1"
            >
              <FileTextIcon size={16} />
              CSV
            </Button>
          )}
          {formats.includes("excel") && (
            <Button
              variant="outline"
              onClick={() => handleExport("excel")}
              className="flex-1"
            >
              <FileStackIcon size={16} />
              Excel
            </Button>
          )}
          {formats.includes("pdf") && (
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              className="flex-1"
            >
              <FileArchiveIcon size={16} />
              PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
