"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import glass from "@/styles/glass.module.css";
import type { TransactionSuccessProps } from "./TransactionSuccess.model";
import styles from "./TransactionSuccessStyles.module.css";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const COUNT_UP_DURATION_MS = 600;
const PARTICLE_COUNT = 12;

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function useCountUp(target: number | undefined): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === undefined) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
      setValue(target * progress);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);
  return value;
}

export function TransactionSuccess({
  type,
  amount,
  duration,
  recipientAddress,
  txHash,
  explorerBaseUrl,
}: TransactionSuccessProps): React.JSX.Element {
  const router = useRouter();
  const displayedAmount = useCountUp(amount);

  return (
    <div
      className={`${glass.surface} ${styles.container}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={styles.checkmark}
        viewBox="0 0 60 60"
        aria-hidden="true"
      >
        <title>Success</title>
        <circle
          cx="30"
          cy="30"
          r="26"
          className={styles.checkmarkCircle}
        />
        <path
          d="M17 31 L26 40 L44 22"
          className={styles.checkmarkPath}
        />
      </svg>

      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angleDeg = i * (360 / PARTICLE_COUNT);
        const colorClass =
          i % 2 === 0 ? styles.particlePrimary : styles.particleSuccess;
        return (
          <span
            key={`particle-${angleDeg}`}
            className={`${styles.particle} ${colorClass} ${styles[`p${i}`] ?? ""}`}
            aria-hidden="true"
          />
        );
      })}

      {type === "sell" ? (
        <>
          {duration !== undefined ? (
            <p className={styles.message}>Sold in {duration.toFixed(1)}s</p>
          ) : (
            <p className={styles.message}>Sell complete</p>
          )}
          {amount !== undefined ? (
            <p className={styles.amount}>
              {formatter.format(displayedAmount)} RLUSD
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className={styles.message}>
            Sent to {truncateAddress(recipientAddress ?? "")}
          </p>
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.walletButton}
          onClick={() => router.push("/")}
        >
          Back to Wallet
        </button>
        <a
          className={styles.explorerLink}
          href={`${explorerBaseUrl}/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View transaction on XRPL ledger explorer"
        >
          View on Ledger
        </a>
      </div>
    </div>
  );
}
