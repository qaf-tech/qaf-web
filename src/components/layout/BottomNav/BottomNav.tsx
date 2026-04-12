"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BottomNavProps } from "./BottomNav.model";
import styles from "./BottomNavStyles.module.css";

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className={styles.bottomNav}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
