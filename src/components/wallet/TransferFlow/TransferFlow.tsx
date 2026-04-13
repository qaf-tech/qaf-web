"use client";

import { Fragment, useEffect, useRef } from "react";
import { RecipientInput } from "@/components/wallet/RecipientInput";
import { TransactionSuccess } from "@/components/wallet/TransactionSuccess";
import { useTransfer } from "@/hooks/useTransfer";
import { config } from "@/lib/config";
import type { TransferStep } from "@/lib/models/dex";
import glass from "@/styles/glass.module.css";
import type { TransferFlowProps } from "./TransferFlow.model";
import styles from "./TransferFlowStyles.module.css";

const STEP_LABELS = ["Recipient", "Auth", "Transfer", "Done"];
const STEP_ORDER: TransferStep[] = [
  "recipient",
  "authenticate",
  "submitting",
  "success",
];

function stepIndex(step: TransferStep): number {
  if (step === "error") return 0;
  const idx = STEP_ORDER.indexOf(step);
  return idx === -1 ? 0 : idx;
}

export function TransferFlow({
  asset,
  onClose,
}: TransferFlowProps): React.JSX.Element {
  const {
    step,
    recipientAddress,
    txHash,
    error,
    setRecipient,
    confirmTransfer,
  } = useTransfer({ asset });

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
        aria-label={`Transfer step ${current + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[current]}`}
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
        {step === "recipient" ? (
          <RecipientInput
            onRecipientSelected={(addr) => {
              setRecipient(addr);
              confirmTransfer();
            }}
            onCancel={onClose}
          />
        ) : null}

        {step === "authenticate" ? (
          <p className={styles.loadingMessage}>Verifying identity...</p>
        ) : null}

        {step === "submitting" ? (
          <>
            <p className={styles.submittingMessage}>Transferring on XRPL...</p>
            <p className={styles.submittingSubtext}>
              Re-encrypting credential...
            </p>
          </>
        ) : null}

        {step === "success" && txHash !== null && recipientAddress !== null ? (
          <TransactionSuccess
            type="transfer"
            recipientAddress={recipientAddress}
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
              onClick={confirmTransfer}
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
