"use client";

import Link from "next/link";
import type { Asset, Category } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import type { CredentialCardProps } from "./CredentialCard.model";
import styles from "./CredentialCardStyles.module.css";

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

const CATEGORY_FALLBACK: Record<Category, string> = {
  tickets: "🎫",
  insurance: "🛡️",
  money_rwa: "💰",
  esims: "📶",
};

function formatExpiry(iso: string): string {
  return `Expires ${dateFormatter.format(new Date(iso))}`;
}

function buildAriaLabel(asset: Asset): string {
  const base = `${asset.title} from ${asset.issuer}`;
  return asset.expiresAt ? `${base}, ${formatExpiry(asset.expiresAt)}` : base;
}

export function CredentialCard({
  asset,
}: CredentialCardProps): React.JSX.Element {
  return (
    // biome-ignore lint/a11y/useSemanticElements: spec requires role="article" on the Link wrapper (Next Link renders an <a>; nesting inside <article> would break keyboard activation)
    <Link
      href={`/asset/${asset.id}`}
      role="article"
      aria-label={buildAriaLabel(asset)}
      className={`${glass.surface} ${styles.card}`}
    >
      <div className={styles.iconFallback} aria-hidden="true">
        {CATEGORY_FALLBACK[asset.category]}
      </div>
      <p className={styles.title}>{asset.title}</p>
      <p className={styles.issuer}>{asset.issuer}</p>
      {asset.expiresAt ? (
        <p className={styles.expiry}>{formatExpiry(asset.expiresAt)}</p>
      ) : null}
      <span className={styles.badge}>{CATEGORY_LABELS[asset.category]}</span>
    </Link>
  );
}
