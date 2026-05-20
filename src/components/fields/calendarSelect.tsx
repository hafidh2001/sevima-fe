import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { CalendarDays, X } from "lucide-react";
import { useState, useCallback, useMemo, forwardRef } from "react";

interface Props {
  name?: string;
  value?: Date | undefined;
  onChange?: (value: Date | undefined) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  disabledCalendar?:
    | { before: Date }
    | { after: Date }
    | ((date: Date) => boolean);
  defaultMonth?: Date;
}

export const CalendarSelect = forwardRef<HTMLInputElement, Props>(({
  name,
  value,
  onChange,
  containerClassName,
  labelClassName,
  label,
  placeholder = "Pilih tanggal...",
  required,
  errorMessage,
  isDisabled,
  disabledCalendar,
  defaultMonth,
}, ref) => {
  const [openPopover, setOpenPopover] = useState(false);

  const handleDaySelect = useCallback((date: Date | undefined) => {
    onChange?.(date);
    setOpenPopover(false);
  }, [onChange]);

  const handleClearable = useCallback(() => {
    onChange?.(undefined);
    setOpenPopover(false);
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

  const displayValue = useMemo(() =>
    value ? dayjs(value).format("YYYY-MM-DD") : "",
    [value]
  );

  const inputClassName = useMemo(() => cn(
    "pr-10 rounded-md h-10 bg-white border-input focus:border-2 focus:border-primary outline-none hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200",
    openPopover && !isDisabled && "border-2 border-primary",
    errorMessage && "border-red-500"
  ), [openPopover, isDisabled, errorMessage]);

  const clearIconClassName = useMemo(() => cn(
    "h-[15px] w-[15px] text-gray-400 cursor-pointer",
    !value && "hidden"
  ), [value]);

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <Popover
        open={openPopover}
        onOpenChange={handleOpenChange}
      >
        <PopoverTrigger asChild>
          <div className="flex w-full relative">
            <Input
              ref={ref}
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
              <CalendarDays className="h-[18px] w-[18px] text-gray-600" />
            </div>
          </div>
        </PopoverTrigger>
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            className="rounded-md border shadow"
            selected={value}
            onSelect={handleDaySelect}
            disabled={disabledCalendar}
            defaultMonth={defaultMonth || value || undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});

CalendarSelect.displayName = "CalendarSelect";

export const PopoverCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(dayjs().toDate());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border shadow"
    />
  );
};
