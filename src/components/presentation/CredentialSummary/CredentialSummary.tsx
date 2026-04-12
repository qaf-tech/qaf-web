"use client";

import glass from "@/styles/glass.module.css";
import type { CredentialSummaryProps } from "./CredentialSummary.model";
import styles from "./CredentialSummaryStyles.module.css";

const EXPIRY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  return `Expires ${EXPIRY_FORMATTER.format(date)}`;
}

export function CredentialSummary({ asset, balance }: CredentialSummaryProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <header> with aria-label is rejected by the complementary aria-label-on-role rule; explicit role="banner" keeps the landmark semantics while allowing aria-label
    <section
      className={`${glass.surface} ${styles.container}`}
      role="banner"
      aria-label={`Presenting ${asset.title} issued by ${asset.issuer}`}
    >
      <div className={styles.left}>
        <h2 className={styles.title}>{asset.title}</h2>
        <span className={styles.issuer}>{asset.issuer}</span>
      </div>
      <div className={styles.right}>
        {asset.expiresAt !== null ? (
          <span className={styles.expiry}>{formatExpiry(asset.expiresAt)}</span>
        ) : null}
        {balance !== null ? (
          <span className={styles.balance}>{balance}</span>
        ) : null}
      </div>
    </section>
  );
}
