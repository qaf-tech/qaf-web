"use client";

import glass from "@/styles/glass.module.css";
import type { BalanceHeaderProps } from "./BalanceHeader.model";
import styles from "./BalanceHeaderStyles.module.css";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function BalanceHeader({
  balance,
  isLoading,
}: BalanceHeaderProps): React.JSX.Element {
  const formatted = formatter.format(balance);
  return (
    <section className={`${glass.surface} ${styles.container}`}>
      {isLoading ? (
        <output
          className={styles.skeleton}
          aria-label="Loading balance"
          aria-busy="true"
        />
      ) : (
        <output
          className={styles.balance}
          aria-label={`Total RLUSD balance: ${formatted}`}
        >
          {formatted}
        </output>
      )}
      <p className={styles.label}>Total RLUSD Balance</p>
    </section>
  );
}
