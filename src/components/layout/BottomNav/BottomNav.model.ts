import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export interface BottomNavProps {
  items: NavItem[];
}
