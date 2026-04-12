"use client";

import { useState } from "react";
import glass from "@/styles/glass.module.css";
import type { WalletReadyProps } from "./WalletReady.model";
import styles from "./WalletReadyStyles.module.css";

const COPY_RESET_MS = 2000;

function truncateAddress(addr: string): string {
  if (addr.length <= 14) {
    return addr;
  }
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function CheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Success</title>
      <circle cx="32" cy="32" r="26" />
      <path d="M20 32 L29 41 L44 24" />
    </svg>
  );
}

export function WalletReady({ xrplAddress, onContinue }: WalletReadyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xrplAddress);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, COPY_RESET_MS);
  };

  return (
    <main className={styles.container}>
      <div className={`${glass.surface} ${styles.card}`}>
        <div className={styles.successIcon}>
          <CheckmarkIcon />
        </div>
        <h1 className={styles.heading}>Wallet Ready</h1>

        <div className={styles.addressContainer}>
          <span className={styles.addressText} title={xrplAddress}>
            {truncateAddress(xrplAddress)}
          </span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? "Copied!" : "Copy address"}
          </button>
        </div>

        <button
          type="button"
          className={styles.continueButton}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
