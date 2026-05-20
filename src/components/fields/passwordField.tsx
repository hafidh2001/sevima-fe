import { Input } from "@/components/ui/input";
import { useCallback, forwardRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  required?: boolean;
  errorMessage?: string;
  showToggle?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(({
  value,
  onChange,
  containerClassName,
  labelClassName,
  label,
  required,
  errorMessage,
  showToggle = true,
  startIcon,
  endIcon,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.currentTarget.value);
  }, [onChange]);

  const inputClassName = cn(
    "bg-[#fff] rounded-md ring-0 shadow-2xs active:border-2 outline-none focus:border-2 focus:outline-none focus:border-primary focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none border-[#ccc] hover:border-[#999999]",
    errorMessage && "border-red-500",
    (showToggle || endIcon) && "pr-10",
    startIcon && "pl-10"
  );

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        <Input
          ref={ref}
          id={rest.id || rest.name}
          type={showPassword ? "text" : "password"}
          value={value || ""}
          onChange={handleChange}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className={inputClassName}
          {...rest}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
        {endIcon && !showToggle && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
});

PasswordField.displayName = "PasswordField";
