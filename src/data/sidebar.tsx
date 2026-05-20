import { ROUTES } from "@/utils/routes";
import type { TNavItem } from "@/types/sidebar";
import { LogOutIcon } from "lucide-react";

export const navItems: TNavItem[] = [
  { label: "Logout", icon: <LogOutIcon size={18} />, to: ROUTES.logout },
];
