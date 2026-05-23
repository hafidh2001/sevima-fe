import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useCallback, forwardRef } from "react";

interface Props extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox>, "checked" | "onCheckedChange"> {
  checked?: boolean;
  onCheckedChange?: (value: CheckboxPrimitive.CheckedState) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  message?: string;
  required?: boolean;
}

export const CheckboxLabel = forwardRef<HTMLDivElement, Props>(({
  checked,
  onCheckedChange,
  containerClassName,
  labelClassName,
  label,
  message,
  required,
  ...rest
}, ref) => {
  const handleCheckedChange = useCallback((e: CheckboxPrimitive.CheckedState) => {
    onCheckedChange?.(e);
  }, [onCheckedChange]);

  return (
    <div ref={ref} className={cn("flex items-center space-x-2", containerClassName)}>
      <Checkbox
        id={rest.id || rest.name}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        {...rest}
      />
      <label
        htmlFor={rest.id || rest.name}
        className={cn(
          "text-sm font-normal leading-none text-gray-700 dark:text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          labelClassName,
          { "text-red-600 dark:text-red-400": !!message }
        )}
      >
        {label}
        {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
      </label>
      {message && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{message}</p>
      )}
    </div>
  );
});

CheckboxLabel.displayName = "CheckboxLabel";
