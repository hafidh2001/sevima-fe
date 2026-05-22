import { ROUTES } from "@/utils/routes";
import type { TNavItem } from "@/types/sidebar";
import { LogOutIcon, WorkflowIcon } from "lucide-react";

export const navItems: TNavItem[] = [
  { label: "Workflows", icon: <WorkflowIcon size={18} />, to: ROUTES.workflowList },
  { label: "Logout", icon: <LogOutIcon size={18} />, to: ROUTES.logout },
];
