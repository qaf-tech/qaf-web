"use client";

import { Fragment, useEffect, useRef } from "react";
import { SellConfirmation } from "@/components/wallet/SellConfirmation";
import { TransactionSuccess } from "@/components/wallet/TransactionSuccess";
import { useSellBack } from "@/hooks/useSellBack";
import { config } from "@/lib/config";
import type { SellStep } from "@/lib/models/dex";
import glass from "@/styles/glass.module.css";
import type { SellBackFlowProps } from "./SellBackFlow.model";
import styles from "./SellBackFlowStyles.module.css";

const STEP_LABELS = ["Price", "Auth", "Submit", "Wait", "Done"];
const STEP_ORDER: SellStep[] = [
  "estimate",
  "authenticate",
  "submitting",
  "waiting",
  "success",
];

function stepIndex(step: SellStep): number {
  if (step === "error") return 0;
  const idx = STEP_ORDER.indexOf(step);
  return idx === -1 ? 0 : idx;
}

export function SellBackFlow({
  asset,
  onClose,
}: SellBackFlowProps): React.JSX.Element {
  const {
    step,
    estimatedPrice,
    elapsedTime,
    rlusdReceived,
    txHash,
    error,
    confirmSell,
    cancelOffer,
  } = useSellBack({ asset });

  const current = stepIndex(step);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = contentRef.current?.querySelector<HTMLElement>(
      'button, a, input, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  }, [step]);

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      <div
        className={styles.stepIndicator}
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemax={STEP_LABELS.length}
        aria-valuemin={1}
        aria-label={`Sell step ${current + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[current]}`}
      >
        {STEP_LABELS.map((label, i) => {
          const completed = i < current;
          const isCurrent = i === current;
          const dotClass = `${styles.stepDot} ${
            completed ? styles.stepDotCompleted : ""
          } ${isCurrent ? styles.stepDotCurrent : ""}`;
          const lineClass = `${styles.stepLine} ${
            completed ? styles.stepLineCompleted : ""
          }`;
          return (
            <Fragment key={label}>
              <span className={dotClass} aria-hidden="true" />
              {i < STEP_LABELS.length - 1 ? (
                <span className={lineClass} aria-hidden="true" />
              ) : null}
            </Fragment>
          );
        })}
      </div>

      <output className={styles.announcement} aria-live="polite">
        Current step: {STEP_LABELS[current]}
      </output>

      <div className={styles.content} ref={contentRef}>
        {step === "estimate" ? (
          <SellConfirmation
            asset={asset}
            estimatedPrice={estimatedPrice}
            onConfirm={confirmSell}
            onCancel={onClose}
          />
        ) : null}

        {step === "authenticate" ? (
          <p className={styles.loadingMessage}>Verifying identity...</p>
        ) : null}

        {step === "submitting" ? (
          <p className={styles.loadingMessage}>Creating offer on XRPL...</p>
        ) : null}

        {step === "waiting" ? (
          <>
            <p className={styles.waitingMessage}>Waiting for a buyer...</p>
            <p
              className={styles.elapsedTimer}
              role="status"
              aria-live="polite"
            >
              {elapsedTime.toFixed(1)}s
            </p>
            <button
              type="button"
              className={styles.cancelOfferButton}
              onClick={cancelOffer}
            >
              Cancel Offer
            </button>
          </>
        ) : null}

        {step === "success" && txHash !== null ? (
          <TransactionSuccess
            type="sell"
            amount={rlusdReceived}
            duration={elapsedTime}
            txHash={txHash}
            explorerBaseUrl={config.xrplExplorerUrl}
          />
        ) : null}

        {step === "error" ? (
          <div className={`${glass.surface} ${styles.errorCard}`}>
            <p className={styles.errorMessage}>{error}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={confirmSell}
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
