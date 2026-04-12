"use client";

import type { NFCPulseProps } from "./NFCPulse.model";
import styles from "./NFCPulseStyles.module.css";

export function NFCPulse({ isActive }: NFCPulseProps) {
  const iconClass = isActive ? styles.iconActive : styles.iconInactive;
  return (
    <output
      className={styles.container}
      aria-label="NFC tap-to-present available"
    >
      <svg
        viewBox="0 0 48 48"
        className={iconClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <path d="M16 16a11 11 0 0 1 16 0" />
        <path d="M12 12a17 17 0 0 1 24 0" />
        <path d="M8 8a23 23 0 0 1 32 0" />
      </svg>
      <span className={styles.label}>Hold near reader</span>
    </output>
  );
}
