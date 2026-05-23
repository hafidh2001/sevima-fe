import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950 overflow-auto mt-16 lg:mt-0">
        {children}
      </main>
    </div>
  );
};
