import { cn } from "@/lib/utils";
import { useCallback, useMemo, forwardRef } from "react";
import Select, { type Props as ReactSelectProps } from "react-select";
import { BasicSelectOpt } from "@/types";
import useWindowDimensions from "@/hooks/useWindowDimension";
import { useThemeStore } from "@/store/themeStore";

interface Props extends Omit<ReactSelectProps, "isMulti" | "disabled" | "value" | "onChange"> {
  value?: BasicSelectOpt<string | number>[];
  onChange?: (value: BasicSelectOpt<string | number>[]) => void;
  required?: boolean;
  selectClassName?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  disabled?: boolean;
  isRtl?: boolean;
  closeMenuOnSelect?: boolean;
  maxMenuHeight?: number;
  popupContainer?: "body" | "parent";
  errorMessage?: string;
}

export const MultipleSelect = forwardRef<Select, Props>(({
  value,
  onChange,
  required,
  selectClassName,
  isSearchable = true,
  isClearable = true,
  isRtl = false,
  closeMenuOnSelect = true,
  maxMenuHeight = 240,
  popupContainer = "parent",
  errorMessage,
  disabled,
  ...rest
}, ref) => {
  const { width } = useWindowDimensions();
  const md = width >= 768;
  const fontSize = md ? "14px" : "16px";
  const isDark = useThemeStore((state) => state.isDark);

  const handleChange = useCallback((e: BasicSelectOpt<string | number>[]) => {
    onChange?.(e);
  }, [onChange]);

  const selectProps = useMemo(() => ({
    id: rest.id || rest.name,
    className: cn("w-full", selectClassName),
    isSearchable,
    isClearable,
    isRtl,
    isMulti: true as const,
    closeMenuOnSelect,
    required,
    maxMenuHeight,
    menuPosition: "fixed" as const,
    menuPortalTarget: popupContainer === "body" ? document.body : null,
    value,
    onChange: handleChange,
    ...rest
  }), [
    rest.id,
    rest.name,
    selectClassName,
    isSearchable,
    isClearable,
    isRtl,
    closeMenuOnSelect,
    required,
    maxMenuHeight,
    popupContainer,
    value,
    handleChange,
    rest
  ]);

  return (
    <div className="flex flex-col gap-1">
      <Select
        ref={ref}
        {...selectProps}
        isDisabled={disabled}
        styles={{
          indicatorSeparator: (base) => ({
            ...base,
            display: "none",
          }),
          multiValue: (base) => ({
            ...base,
            borderRadius: "6px",
            backgroundColor: isDark ? "#374151" : "#e5e7eb",
          }),
          multiValueLabel: (base) => ({
            ...base,
            fontSize,
            color: isDark ? "#f3f4f6" : "#374151",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: isDark ? "#9ca3af" : "#6b7280",
            "&:hover": {
              backgroundColor: isDark ? "#4b5563" : "#d1d5db",
              color: isDark ? "#f3f4f6" : "#374151",
            },
          }),
          control: (base, state) => ({
            ...base,
            borderRadius: "6px",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            borderColor: errorMessage ? "#ef4444" : state.isDisabled ? (isDark ? "#4b5563" : "#d1d5db") : (isDark ? "#4b5563" : "#d1d5db"),
            border: state.isDisabled ? "1px solid" : "1px solid",
            backgroundColor: state.isDisabled ? (isDark ? "#1f2937" : "#f3f4f6") : (isDark ? "#1f2937" : base.backgroundColor),
            color: state.isDisabled ? (isDark ? "#6b7280" : "#9ca3af") : (isDark ? "#f3f4f6" : base.color),
            minHeight: "40px",
            fontSize,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "6px",
            zIndex: popupContainer === "body" ? 10000 : 9999,
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: popupContainer === "body" ? 10000 : 9999,
          }),
          option: (base, state) => ({
            ...base,
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            fontSize,
            backgroundColor: state.isSelected ? (isDark ? "#3b82f6" : "#3b82f6") : (state.isFocused ? (isDark ? "#374151" : "#f3f4f6") : "transparent"),
            color: state.isSelected ? "#ffffff" : (isDark ? "#f3f4f6" : "#374151"),
            "&:hover": {
              backgroundColor: state.isSelected ? (isDark ? "#3b82f6" : "#3b82f6") : (isDark ? "#374151" : "#e5e7eb"),
            },
          }),
          dropdownIndicator: (base, state) => ({
            ...base,
            display: isClearable && value && value.length > 0 ? "none" : "flex",
            color: state.isDisabled ? (isDark ? "#6b7280" : "#9ca3af") : (isDark ? "#9ca3af" : "#6b7280"),
          }),
          clearIndicator: (base) => ({
            ...base,
            padding: "8px",
            color: isDark ? "#9ca3af" : "#6b7280",
          }),
          placeholder: (base) => ({
            ...base,
            fontSize,
            color: isDark ? "#6b7280" : "#9ca3af",
          }),
          input: (base) => ({
            ...base,
            fontSize,
            color: isDark ? "#f3f4f6" : base.color,
          }),
          singleValue: (base) => ({
            ...base,
            color: isDark ? "#f3f4f6" : base.color,
          }),
        }}
        {...(rest as any)}
      />
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
});

MultipleSelect.displayName = "MultipleSelect";
