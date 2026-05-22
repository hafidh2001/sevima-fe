import { cn } from "@/utils/utils";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  textClassName?: string;
}

const sizeClasses = {
  sm: {
    container: "h-9 px-3",
    icon: "w-4 h-4",
    text: "text-sm",
  },
  md: {
    container: "h-10 px-3",
    icon: "w-5 h-5",
    text: "text-base",
  },
  lg: {
    container: "h-12 px-4",
    icon: "w-6 h-6",
    text: "text-lg",
  },
  xl: {
    container: "h-16 px-4",
    icon: "w-8 h-8",
    text: "text-2xl",
  },
};

export const Logo = ({
  size = "lg",
  className,
  textClassName,
}: LogoProps) => {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg",
        sizes.container,
        className
      )}
    >
      <svg
        className={cn("text-white flex-shrink-0", sizes.icon)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span
        className={cn(
          "font-bold text-white tracking-tight uppercase whitespace-nowrap",
          sizes.text,
          textClassName
        )}
      >
        FLOWFORGE
      </span>
    </div>
  );
};
