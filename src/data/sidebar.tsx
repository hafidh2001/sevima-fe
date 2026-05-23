import { ROUTES } from "@/utils/routes";
import type { TNavItem } from "@/types/sidebar";
import { RoleEnum } from "@/types";
import { LogOutIcon, WorkflowIcon, LayoutDashboardIcon, Wand2 } from "lucide-react";

export const navItems: TNavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboardIcon size={18} />, to: ROUTES.base },
  { label: "Workflows", icon: <WorkflowIcon size={18} />, to: ROUTES.workflowList },
  { label: "AI Builder", icon: <Wand2 size={18} />, to: ROUTES.aiBuilder, roles: [RoleEnum.ADMIN, RoleEnum.EDITOR] },
  { label: "Logout", icon: <LogOutIcon size={18} />, to: ROUTES.logout },
];
