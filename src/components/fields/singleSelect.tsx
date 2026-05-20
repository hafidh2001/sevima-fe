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
          }),
          control: (base, state) => ({
            ...base,
            borderRadius: "6px",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            borderColor: errorMessage ? "#ef4444" : state.isDisabled ? "#d1d5db" : "#d1d5db",
            border: state.isDisabled ? "1px solid #d1d5db" : "1px solid #d1d5db",
            backgroundColor: state.isDisabled ? "#f3f4f6" : base.backgroundColor,
            color: state.isDisabled ? "#9ca3af" : base.color,
            minHeight: "40px",
            fontSize,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "6px",
            zIndex: popupContainer === "body" ? 10000 : 9999,
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: popupContainer === "body" ? 10000 : 9999,
          }),
          option: (base, state) => ({
            ...base,
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            fontSize,
          }),
          dropdownIndicator: (base, state) => ({
            ...base,
            display: "flex",
            color: state.isDisabled ? "#9ca3af" : "#6b7280",
          }),
          clearIndicator: (base) => ({
            ...base,
            padding: "0px",
          }),
          placeholder: (base) => ({
            ...base,
            fontSize,
          }),
          input: (base) => ({
            ...base,
            fontSize,
          }),
        }}
        {...(rest as any)}
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
});

SingleSelect.displayName = "SingleSelect";
