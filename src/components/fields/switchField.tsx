import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCallback, forwardRef } from "react";

interface Props {
  checked?: boolean;
  onChange?: (value: boolean) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  required?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export const SwitchField = forwardRef<HTMLButtonElement, Props>(({
  checked,
  onChange,
  containerClassName,
  labelClassName,
  label,
  required,
  errorMessage,
  disabled,
  ...rest
}, ref) => {
  const handleCheckedChange = useCallback((e: boolean) => {
    onChange?.(e);
  }, [onChange]);

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", labelClassName)}>
          {label}
          {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-3">
        <Switch
          ref={ref}
          id={rest.id || rest.name}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          {...rest}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {checked ? "Ya" : "Tidak"}
        </span>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
});

SwitchField.displayName = "SwitchField";
