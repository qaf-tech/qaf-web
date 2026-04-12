"use client";

import glass from "@/styles/glass.module.css";
import type {
  PasskeyPromptProps,
  PasskeyPromptStatus,
} from "./PasskeyPrompt.model";
import styles from "./PasskeyPromptStyles.module.css";

const STATUS_TEXT: Record<PasskeyPromptStatus, string> = {
  creating_passkey: "Creating your passkey...",
  deriving_wallet: "Deriving your wallet...",
  funding: "Funding your wallet on testnet...",
  error: "Something went wrong",
};

function FingerprintIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Passkey</title>
      <circle cx="32" cy="32" r="10" />
      <circle cx="32" cy="32" r="18" />
      <circle cx="32" cy="32" r="26" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Wallet derivation</title>
      <circle cx="20" cy="32" r="10" />
      <path d="M30 32 L54 32 M46 32 L46 42 M54 32 L54 42" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Funding</title>
      <path d="M32 6 A26 26 0 0 1 58 32" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Error</title>
      <circle cx="32" cy="32" r="26" />
      <path d="M22 22 L42 42 M42 22 L22 42" />
    </svg>
  );
}

export function PasskeyPrompt({
  status,
  message,
  onRetry,
}: PasskeyPromptProps) {
  return (
    <main className={styles.container}>
      <div
        className={`${glass.surface} ${styles.card}`}
        aria-live="polite"
        aria-busy={status !== "error"}
      >
        {status === "creating_passkey" && (
          <>
            <div className={`${styles.iconContainer} ${styles.pulseAnimation}`}>
              <FingerprintIcon />
            </div>
            <p className={styles.statusText}>{STATUS_TEXT.creating_passkey}</p>
          </>
        )}

        {status === "deriving_wallet" && (
          <>
            <div className={`${styles.iconContainer} ${styles.pulseAnimation}`}>
              <KeyIcon />
            </div>
            <p className={styles.statusText}>{STATUS_TEXT.deriving_wallet}</p>
          </>
        )}

        {status === "funding" && (
          <>
            <div className={`${styles.iconContainer} ${styles.spinAnimation}`}>
              <SpinnerIcon />
            </div>
            <p className={styles.statusText}>{STATUS_TEXT.funding}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className={`${styles.iconContainer} ${styles.iconError}`}>
              <ErrorIcon />
            </div>
            <p className={styles.statusText}>{STATUS_TEXT.error}</p>
            {message ? <p className={styles.errorText}>{message}</p> : null}
            {onRetry ? (
              <button
                type="button"
                className={styles.retryButton}
                onClick={onRetry}
              >
                Try again
              </button>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
