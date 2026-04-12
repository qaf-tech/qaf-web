import type { ClaimBadgeProps } from "./ClaimBadge.model";
import styles from "./ClaimBadgeStyles.module.css";

function formatClaim(key: string, value: string | boolean): string {
  switch (key) {
    case "over_18":
      return "Over 18";
    case "over_21":
      return "Over 21";
    case "sanctions_clear":
      return "Sanctions Clear";
    case "country":
      return `Country: ${value}`;
    case "nationality":
      return `Nationality: ${value}`;
    case "document_type":
      return `Document: ${value}`;
    default:
      return `${key}: ${value}`;
  }
}

export function ClaimBadge({ claim, verified }: ClaimBadgeProps) {
  const label = formatClaim(claim.key, claim.value);
  const ariaLabel = verified ? `Verified: ${label}` : label;
  const className = `${styles.badge} ${verified ? styles.verified : styles.unverified}`;
  return (
    <span role="status" aria-label={ariaLabel} className={className}>
      {verified && (
        <svg
          className={styles.verifiedIcon}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          data-testid="claim-verified-icon"
        >
          <path
            d="M3 8.5L6.5 12L13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
