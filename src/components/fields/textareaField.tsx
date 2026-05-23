import { forwardRef, useCallback } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  required?: boolean;
  errorMessage?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, Props>(({
  value,
  onChange,
  containerClassName,
  labelClassName,
  label,
  required,
  errorMessage,
  className,
  rows = 3,
  ...rest
}, ref) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.currentTarget.value);
  }, [onChange]);

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", labelClassName)}>
          {label}
          {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={rest.id || rest.name}
        value={value || ""}
        onChange={handleChange}
        rows={rows}
        className={cn(
          "bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 ring-0 shadow-2xs outline-none focus:border-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 focus:shadow-none hover:border-gray-400 dark:hover:border-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:border-gray-200 dark:disabled:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm resize-none",
          errorMessage && "border-red-500 dark:border-red-400",
          className
        )}
        {...rest}
      />
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
});

TextareaField.displayName = "TextareaField";
