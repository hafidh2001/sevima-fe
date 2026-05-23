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
        <label className={cn("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={rest.id || rest.name}
        value={value || ""}
        onChange={handleChange}
        rows={rows}
        className={cn(
          "bg-white rounded-md border border-input ring-0 shadow-2xs outline-none focus:border-2 focus:border-primary focus:ring-0 focus:shadow-none hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 px-3 py-2 text-sm resize-none",
          errorMessage && "border-red-500",
          className
        )}
        {...rest}
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
});

TextareaField.displayName = "TextareaField";
