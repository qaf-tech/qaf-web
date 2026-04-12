"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavbarProps } from "./Navbar.model";
import styles from "./NavbarStyles.module.css";

const DESKTOP_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/cards", label: "Cards" },
  { href: "/settings", label: "Settings" },
];

export function Navbar({ appName = "QAF" }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <span className={styles.appTitle}>{appName}</span>
      <nav className={styles.navLinks} aria-label="Primary navigation">
        {DESKTOP_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
