import { cn } from "@/lib/utils";
import { useCallback, useMemo, forwardRef } from "react";
import Select, { type Props as ReactSelectProps } from "react-select";
import { BasicSelectOpt } from "@/types";
import useWindowDimensions from "@/hooks/useWindowDimension";

interface Props extends Omit<ReactSelectProps, "isMulti" | "disabled" | "value" | "onChange"> {
  value?: BasicSelectOpt<string | number> | null;
  onChange?: (value: BasicSelectOpt<string | number> | null) => void;
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

export const SingleSelect = forwardRef<Select, Props>(({
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

  const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");

  const handleChange = useCallback((e: BasicSelectOpt<string | number> | null) => {
    onChange?.(e);
  }, [onChange]);

  const selectProps = useMemo(() => ({
    id: rest.id || rest.name,
    className: cn("w-full", selectClassName),
    isSearchable,
    isClearable,
    isRtl,
    isMulti: false as const,
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

  const controlBorderColor = errorMessage ? "#ef4444" : isDark ? "#4b5563" : "#d1d5db";
  const disabledBg = isDark ? "#374151" : "#f3f4f6";
  const disabledColor = isDark ? "#9ca3af" : "#9ca3af";
  const bgColor = isDark ? "#1f2937" : "#ffffff";
  const textColor = isDark ? "#f3f4f4" : "#111827";
  const menuBg = isDark ? "#1f2937" : "#ffffff";
  const optionHoverBg = isDark ? "#374151" : "#f3f4f6";
  const optionSelectedBg = isDark ? "#3b82f6" : "#3b82f6";
  const placeholderColor = isDark ? "#9ca3af" : "#6b7280";
  const indicatorColor = isDark ? "#9ca3af" : "#6b7280";

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
          singleValue: (base) => ({
            ...base,
            fontSize,
            color: textColor,
          }),
          control: (base, state) => ({
            ...base,
            borderRadius: "6px",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            borderColor: state.isDisabled ? disabledBg : controlBorderColor,
            border: state.isDisabled ? "1px solid" : "1px solid",
            backgroundColor: state.isDisabled ? disabledBg : bgColor,
            color: state.isDisabled ? disabledColor : textColor,
            minHeight: "40px",
            fontSize,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "6px",
            zIndex: popupContainer === "body" ? 10000 : 9999,
            backgroundColor: menuBg,
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: popupContainer === "body" ? 10000 : 9999,
          }),
          option: (base, state) => ({
            ...base,
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            fontSize,
            backgroundColor: state.isSelected ? optionSelectedBg : state.isFocused ? optionHoverBg : "transparent",
            color: textColor,
          }),
          dropdownIndicator: (base, state) => ({
            ...base,
            display: "flex",
            color: state.isDisabled ? disabledColor : indicatorColor,
          }),
          clearIndicator: (base) => ({
            ...base,
            padding: "0px",
          }),
          placeholder: (base) => ({
            ...base,
            fontSize,
            color: placeholderColor,
          }),
          input: (base) => ({
            ...base,
            fontSize,
            color: textColor,
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

SingleSelect.displayName = "SingleSelect";
