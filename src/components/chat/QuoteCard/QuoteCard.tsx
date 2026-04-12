import glass from "@/styles/glass.module.css";
import type { QuoteCardProps } from "./QuoteCard.model";
import styles from "./QuoteCardStyles.module.css";

const MAX_VISIBLE_FEATURES = 4;
const DROPS_PER_RLUSD = 1_000_000;

function formatPrice(drops: number): string {
  return (drops / DROPS_PER_RLUSD).toFixed(2);
}

export function QuoteCard({ quote, onSelect }: QuoteCardProps) {
  const price = formatPrice(quote.priceDrops);
  const priceLabel = `${price} RLUSD`;
  const visibleFeatures = quote.features.slice(0, MAX_VISIBLE_FEATURES);
  const extraFeatureCount = Math.max(
    0,
    quote.features.length - MAX_VISIBLE_FEATURES,
  );

  return (
    <article
      className={`${glass.surfaceElevated} ${styles.card}`}
      aria-label={`Quote from ${quote.merchantName} for ${priceLabel}`}
    >
      <h3 className={styles.merchantName}>{quote.merchantName}</h3>
      <p className={styles.productName}>{quote.productName}</p>
      <div className={styles.price}>{priceLabel}</div>
      <ul className={styles.features}>
        {visibleFeatures.map((feature) => (
          <li key={feature} className={styles.feature}>
            {feature}
          </li>
        ))}
        {extraFeatureCount > 0 ? (
          <li className={styles.moreFeatures}>+{extraFeatureCount} more</li>
        ) : null}
      </ul>
      <div className={styles.rating}>
        <svg
          className={styles.starIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span>{quote.rating.toFixed(1)}/5.0</span>
      </div>
      <button
        type="button"
        className={styles.selectButton}
        onClick={() => onSelect(quote)}
        aria-label={`Select quote from ${quote.merchantName} for ${priceLabel}`}
      >
        Select
      </button>
    </article>
  );
}
