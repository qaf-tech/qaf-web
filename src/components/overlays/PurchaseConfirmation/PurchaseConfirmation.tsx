"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef } from "react";
import glass from "@/styles/glass.module.css";
import type { PurchaseConfirmationProps } from "./PurchaseConfirmation.model";
import styles from "./PurchaseConfirmationStyles.module.css";

const DROPS_PER_RLUSD = 1_000_000;
const TIMER_TOTAL_SECONDS = 10;
const TIMER_RADIUS = 45;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;
const CANCEL_MIN_WIDTH_PCT = 30;
const CANCEL_MAX_WIDTH_PCT = 100;

function formatPrice(drops: number): string {
  return (drops / DROPS_PER_RLUSD).toFixed(2);
}

function FaceScanIcon() {
  return (
    <svg
      className={styles.faceIdIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7V5a1 1 0 0 1 1-1h2" />
      <path d="M20 7V5a1 1 0 0 0-1-1h-2" />
      <path d="M4 17v2a1 1 0 0 0 1 1h2" />
      <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M9 15c.8.8 2 1 3 1s2.2-.2 3-1" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className={styles.faceIdIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className={styles.faceIdIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function PurchaseConfirmation({
  quote,
  timeRemaining,
  biometricStatus,
  onCancel,
  onBiometricAuth,
}: PurchaseConfirmationProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const faceIdButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  const handleDialogKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const current = document.activeElement;
        if (current === cancelButtonRef.current) {
          faceIdButtonRef.current?.focus();
        } else {
          cancelButtonRef.current?.focus();
        }
      }
    },
    [onCancel],
  );

  const priceLabel = `${formatPrice(quote.priceDrops)} RLUSD`;
  const timerProgress = Math.max(
    0,
    Math.min(1, timeRemaining / TIMER_TOTAL_SECONDS),
  );
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - timerProgress);
  const cancelWidthPct =
    CANCEL_MIN_WIDTH_PCT +
    (CANCEL_MAX_WIDTH_PCT - CANCEL_MIN_WIDTH_PCT) * (1 - timerProgress);

  const faceIdClasses = [styles.faceIdButton];
  if (biometricStatus === "authenticated")
    faceIdClasses.push(styles.faceIdAuthenticated);
  if (biometricStatus === "failed") faceIdClasses.push(styles.faceIdFailed);
  if (biometricStatus === "authenticating")
    faceIdClasses.push(styles.faceIdAuthenticating);

  return (
    <div className={styles.overlay}>
      <div
        className={`${glass.surfaceElevated} ${styles.modal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-confirmation-heading"
        onKeyDown={handleDialogKeyDown}
        tabIndex={-1}
      >
        <h2 id="purchase-confirmation-heading" className={styles.heading}>
          Confirm Purchase
        </h2>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Merchant</span>
            <span className={styles.detailValue}>{quote.merchantName}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Product</span>
            <span className={styles.detailValue}>{quote.productName}</span>
          </div>
          {quote.identityFactsRequired.length > 0 ? (
            <div>
              <span className={styles.detailLabel}>Identity facts shared</span>
              <ul className={styles.factsList}>
                {quote.identityFactsRequired.map((fact) => (
                  <li key={fact} className={styles.fact}>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className={styles.price}>{priceLabel}</div>

        <div className={styles.timerContainer}>
          <svg
            className={styles.timerSvg}
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              className={styles.timerTrack}
              cx="50"
              cy="50"
              r={TIMER_RADIUS}
            />
            <circle
              className={styles.timerProgress}
              cx="50"
              cy="50"
              r={TIMER_RADIUS}
              strokeDasharray={TIMER_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <output className={styles.timerText} aria-live="polite">
            {timeRemaining}
            <span className="sr-only"> seconds remaining</span>
          </output>
        </div>

        <div className={styles.buttons}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            style={{ width: `${cancelWidthPct}%` }}
            aria-label="Cancel purchase"
          >
            Cancel
          </button>
          <button
            ref={faceIdButtonRef}
            type="button"
            className={faceIdClasses.join(" ")}
            onClick={onBiometricAuth}
            aria-label={
              biometricStatus === "authenticated"
                ? "Authenticated"
                : biometricStatus === "failed"
                  ? "Retry biometric authentication"
                  : "Authenticate with biometrics"
            }
          >
            {biometricStatus === "idle" ? <FaceScanIcon /> : null}
            {biometricStatus === "authenticating" ? <SpinnerIcon /> : null}
            {biometricStatus === "authenticated" ? <CheckIcon /> : null}
            {biometricStatus === "failed" ? (
              <span className={styles.tryAgainText}>Try Again</span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
