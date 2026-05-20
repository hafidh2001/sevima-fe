import { LoaderIcon } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loading = ({ className = "", size = "md" }: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoaderIcon
        className={`${sizeClasses[size]} animate-spin text-blue-600`}
      />
    </div>
  );
};

interface LoadingPageProps {
  text?: string;
}

export const LoadingPage = ({ text = "Memuat data..." }: LoadingPageProps) => {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loading size="lg" className="mb-4" />
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  );
};
