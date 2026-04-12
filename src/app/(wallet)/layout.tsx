import type { ReactNode } from "react";
import { BottomNav, type NavItem } from "@/components/layout/BottomNav";
import { Navbar } from "@/components/layout/Navbar";
import styles from "./walletLayout.module.css";

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: <span aria-hidden="true">●</span> },
  { href: "/chat", label: "Chat", icon: <span aria-hidden="true">◆</span> },
  { href: "/cards", label: "Cards", icon: <span aria-hidden="true">▤</span> },
  {
    href: "/settings",
    label: "Settings",
    icon: <span aria-hidden="true">⚙</span>,
  },
];

export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar appName="QAF" />
      <main className={styles.main}>{children}</main>
      <BottomNav items={navItems} />
    </>
  );
}
