import { Input } from "@/components/ui/input";
import { useCallback, forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  required?: boolean;
  maxMenuHeight?: number;
  errorMessage?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, Props>(({
  value,
  onChange,
  containerClassName,
  labelClassName,
  label,
  required,
  maxMenuHeight = 40,
  errorMessage,
  startIcon,
  endIcon,
  ...rest
}, ref) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.currentTarget.value);
  }, [onChange]);

  const inputClassName = cn(
    "bg-white rounded-md border border-input ring-0 shadow-2xs outline-none focus:border-2 focus:border-primary focus:ring-0 focus:shadow-none hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 h-10",
    errorMessage && "border-red-500",
    startIcon && "pl-10",
    endIcon && "pr-10"
  );

  const hasIcon = startIcon || endIcon;

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {hasIcon ? (
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {startIcon}
            </div>
          )}
          <Input
            ref={ref}
            id={rest.id || rest.name}
            value={value || ""}
            onChange={handleChange}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            style={{ height: `${maxMenuHeight}px` }}
            className={inputClassName}
            {...rest}
          />
          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {endIcon}
            </div>
          )}
        </div>
      ) : (
        <Input
          ref={ref}
          id={rest.id || rest.name}
          value={value || ""}
          onChange={handleChange}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          style={{ height: `${maxMenuHeight}px` }}
          className={inputClassName}
          {...rest}
        />
      )}
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
});

InputField.displayName = "InputField";
