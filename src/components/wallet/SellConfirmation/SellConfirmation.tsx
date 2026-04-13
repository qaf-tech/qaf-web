"use client";

import type { Category } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import type { SellConfirmationProps } from "./SellConfirmation.model";
import styles from "./SellConfirmationStyles.module.css";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
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

export function SellConfirmation({
  asset,
  estimatedPrice,
  onConfirm,
  onCancel,
}: SellConfirmationProps): React.JSX.Element {
  const formatted = formatter.format(estimatedPrice);
  return (
    <div className={`${glass.surface} ${styles.container}`}>
      <div className={styles.assetInfo}>
        <div className={styles.assetIcon} aria-hidden="true">
          {CATEGORY_ICONS[asset.category]}
        </div>
        <div className={styles.assetText}>
          <p className={styles.assetTitle}>{asset.title}</p>
          <p className={styles.assetIssuer}>{asset.issuer}</p>
        </div>
        <span className={styles.badge}>{CATEGORY_LABELS[asset.category]}</span>
      </div>
      <div className={styles.priceDisplay}>
        <output
          className={styles.price}
          aria-label={`Estimated sell price: ${formatted} RLUSD`}
        >
          {formatted}
        </output>
        <p className={styles.priceLabel}>
          Estimated sell price (~80% of purchase price)
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          aria-label={`Confirm sell for ${formatted} RLUSD`}
        >
          Confirm Sell
        </button>
      </div>
    </div>
  );
}
