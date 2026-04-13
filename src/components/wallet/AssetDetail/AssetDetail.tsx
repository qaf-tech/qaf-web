"use client";

import Link from "next/link";
import type { Asset, Category } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import type { AssetDetailProps } from "./AssetDetail.model";
import styles from "./AssetDetailStyles.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CATEGORY_LABELS: Record<Category, string> = {
  tickets: "Ticket",
  insurance: "Insurance",
  money_rwa: "Money",
  esims: "eSIM",
};

const CATEGORY_ICONS: Record<Category, string> = {
  tickets: "🎫",
  insurance: "🛡️",
  money_rwa: "💰",
  esims: "📶",
};

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function MetadataList({ metadata }: { metadata: Asset["metadata"] }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return null;
  return (
    <dl className={styles.metadataList}>
      {entries.map(([key, value]) => (
        <div key={key} className={styles.metadataItem}>
          <dt className={styles.metadataKey}>{key}</dt>
          <dd className={styles.metadataValue}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AssetDetail({
  asset,
  onSell,
  onTransfer,
}: AssetDetailProps): React.JSX.Element {
  return (
    <article className={`${glass.surface} ${styles.container}`}>
      <header className={styles.header}>
        <div className={styles.icon} aria-hidden="true">
          {CATEGORY_ICONS[asset.category]}
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{asset.title}</h1>
          <p className={styles.issuer}>{asset.issuer}</p>
          <span className={styles.badge}>
            {CATEGORY_LABELS[asset.category]}
          </span>
        </div>
      </header>

      <p className={styles.description}>{asset.description}</p>

      {asset.expiresAt ? (
        <p className={styles.sectionLabel}>
          Expires {formatDate(asset.expiresAt)}
        </p>
      ) : null}
      <p className={styles.sectionLabel}>Issued {formatDate(asset.issuedAt)}</p>
      <p className={styles.sectionLabel}>Token ID: {asset.tokenId}</p>

      <MetadataList metadata={asset.metadata} />

      <div className={styles.actions}>
        <Link
          href={`/use/${asset.id}`}
          className={styles.actionButton}
          aria-label={`Use ${asset.title}`}
        >
          Use
        </Link>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={`Share ${asset.title}`}
        >
          Share
        </button>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={`Revoke ${asset.title}`}
        >
          Revoke
        </button>
        {onSell ? (
          <button
            type="button"
            className={`${styles.actionButton} ${styles.sellButton}`}
            onClick={onSell}
            aria-label="Sell this asset"
          >
            Sell
          </button>
        ) : null}
        {onTransfer ? (
          <button
            type="button"
            className={`${styles.actionButton} ${styles.transferButton}`}
            onClick={onTransfer}
            aria-label="Send this asset to a friend"
          >
            Send to friend
          </button>
        ) : null}
      </div>
    </article>
  );
}
