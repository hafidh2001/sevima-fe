import { useEffect, useState, useCallback, useMemo, forwardRef } from "react";
import Select from "react-select";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarDays, X } from "lucide-react";
import dayjs from "dayjs";
import { getMonth } from "@/functions/getMonth";

interface Props {
  name?: string;
  value?: Date | undefined;
  onChange?: (value: Date | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  errorMessage?: string;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  required?: boolean;
}

interface MonthOption {
  value: number;
  label: string;
}

interface YearOption {
  value: number;
  label: string;
}

export const MonthYearSelect = forwardRef<HTMLDivElement, Props>(({
  name,
  value,
  onChange,
  placeholder = "Pilih bulan tahun...",
  isDisabled,
  errorMessage,
  containerClassName,
  labelClassName,
  label,
  required,
}, ref) => {
  const [openPopover, setOpenPopover] = useState(false);

  // Generate month options
  const monthOpts: MonthOption[] = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: getMonth(i + 1),
    })),
    []
  );

  // Generate year options (current year - 5 to current year + 5)
  const yearOpts: YearOption[] = useMemo(() => {
    const currentYear = dayjs().year();
    return Array.from({ length: 11 }, (_, i) => ({
      value: currentYear - 5 + i,
      label: String(currentYear - 5 + i),
    }));
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<MonthOption | undefined>();
  const [selectedYear, setSelectedYear] = useState<YearOption | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    if (value) {
      const month = monthOpts.find((opt) => opt.value === value.getMonth() + 1);
      const year = yearOpts.find((opt) => opt.value === value.getFullYear());
      setSelectedMonth(month);
      setSelectedYear(year);
      setSelectedDate(value);
    } else if (!value) {
      setSelectedMonth(undefined);
      setSelectedYear(undefined);
      setSelectedDate(undefined);
    }
  }, [value, monthOpts, yearOpts]);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const newDate = dayjs().year(selectedYear.value).month(selectedMonth.value - 1).date(1).toDate();
      setSelectedDate(newDate);
      // Only call onChange if the date actually changed
      if (!selectedDate || selectedDate.getTime() !== newDate.getTime()) {
        onChange?.(newDate);
      }
    } else if (!selectedMonth || !selectedYear) {
      if (selectedDate !== undefined) {
        setSelectedDate(undefined);
        onChange?.(undefined);
      }
    }
  }, [selectedMonth, selectedYear, onChange, selectedDate]);

  const handleClearable = useCallback(() => {
    setSelectedMonth(undefined);
    setSelectedYear(undefined);
    setOpenPopover(false);
    onChange?.(undefined);
  }, [onChange]);

  const handleOpenChange = useCallback((e: boolean) => {
    if (!isDisabled) {
      setOpenPopover(e);
    }
  }, [isDisabled]);

  const handleInputClick = useCallback(() => {
    if (!isDisabled) {
      setOpenPopover(true);
    }
  }, [isDisabled]);

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleClearable();
  }, [handleClearable]);

  const handleMonthChange = useCallback((option: MonthOption | null) => {
    setSelectedMonth(option || undefined);
    if (option && selectedYear) {
      setOpenPopover(false);
    }
  }, [selectedYear]);

  const handleYearChange = useCallback((option: YearOption | null) => {
    setSelectedYear(option || undefined);
    if (option && selectedMonth) {
      setOpenPopover(false);
    }
  }, [selectedMonth]);

  const displayValue = useMemo(() =>
    selectedDate ? `${getMonth(selectedDate.getMonth() + 1)}, ${selectedDate.getFullYear()}` : "",
    [selectedDate]
  );

  const inputClassName = useMemo(() => cn(
    "pr-10 rounded-md h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-2 focus:border-blue-500 dark:focus:border-blue-400 outline-none hover:border-gray-400 dark:hover:border-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:border-gray-200 dark:disabled:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
    openPopover && !isDisabled && "border-2 border-blue-500 dark:border-blue-400",
    errorMessage && "border-red-500 dark:border-red-400"
  ), [openPopover, isDisabled, errorMessage]);

  const clearIconClassName = useMemo(() => cn(
    "h-[15px] w-[15px] text-gray-400 dark:text-gray-500 cursor-pointer",
    !selectedDate && "hidden"
  ), [selectedDate]);

  const monthSelectProps = useMemo(() => ({
    className: "w-[140px]",
    options: monthOpts,
    placeholder: "Bulan",
    onChange: handleMonthChange,
    value: selectedMonth
  }), [monthOpts, handleMonthChange, selectedMonth]);

  const yearSelectProps = useMemo(() => ({
    className: "w-[100px]",
    options: yearOpts,
    placeholder: "Tahun",
    onChange: handleYearChange,
    value: selectedYear
  }), [yearOpts, handleYearChange, selectedYear]);

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)} ref={ref}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", labelClassName)}>
          {label}
          {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <Popover
        open={openPopover}
        onOpenChange={handleOpenChange}
      >
        <PopoverTrigger asChild>
          <div className="flex w-full relative">
            <Input
              id={name}
              spellCheck={false}
              value={displayValue}
              onClick={handleInputClick}
              className={inputClassName}
              readOnly
              disabled={isDisabled}
              placeholder={placeholder}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <X
                className={clearIconClassName}
                onClick={handleClearClick}
              />
              <CalendarDays className="h-[18px] w-[18px] text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
        <PopoverContent
          className="w-auto p-3 bg-white dark:bg-gray-800 flex items-center gap-2 border border-gray-200 dark:border-gray-700"
          align="start"
        >
          <Select {...monthSelectProps} />
          <Select {...yearSelectProps} />
        </PopoverContent>
      </Popover>
    </div>
  );
});

MonthYearSelect.displayName = "MonthYearSelect";
