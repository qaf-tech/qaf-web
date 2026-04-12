import type { PurchaseStepData } from "@/lib/models/chat";
import glass from "@/styles/glass.module.css";
import type { PurchaseStatusProps } from "./PurchaseStatus.model";
import styles from "./PurchaseStatusStyles.module.css";

function StepIcon({ status }: { status: PurchaseStepData["status"] }) {
  if (status === "pending") {
    return (
      <svg
        className={`${styles.icon} ${styles.iconPending}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  if (status === "in_progress") {
    return (
      <svg
        className={`${styles.icon} ${styles.iconInProgress}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.22-8.56" />
      </svg>
    );
  }
  if (status === "completed") {
    return (
      <svg
        className={`${styles.icon} ${styles.iconCompleted}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    );
  }
  return (
    <svg
      className={`${styles.icon} ${styles.iconFailed}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6" />
      <path d="M9 9l6 6" />
    </svg>
  );
}

export function PurchaseStatus({ steps }: PurchaseStatusProps) {
  return (
    <output
      className={`${glass.surface} ${styles.container}`}
      aria-live="polite"
    >
      {steps.map((step) => (
        <div key={step.id} className={styles.step}>
          <StepIcon status={step.status} />
          <span className={styles.label}>{step.label}</span>
          {step.detail ? (
            <span className={styles.detail}>{step.detail}</span>
          ) : null}
        </div>
      ))}
    </output>
  );
}
