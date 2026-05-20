export type TNavItem = {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: { label: string; to: string }[];
};
