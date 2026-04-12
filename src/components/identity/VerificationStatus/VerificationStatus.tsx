"use client";

import { Fragment } from "react";
import { ClaimBadge } from "@/components/identity/ClaimBadge";
import type {
  VerificationStatusProps,
  VerificationStep,
  VerificationStepStatus,
} from "./VerificationStatus.model";
import styles from "./VerificationStatusStyles.module.css";

const ICON_CLASS: Record<VerificationStepStatus, string> = {
  pending: styles.iconPending,
  in_progress: styles.iconInProgress,
  complete: styles.iconComplete,
  error: styles.iconError,
};

function StepIcon({ status }: { status: VerificationStepStatus }) {
  const className = `${styles.stepIcon} ${ICON_CLASS[status]}`;
  if (status === "complete") {
    return (
      <div className={className}>
        <svg
          className={styles.iconSvg}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 8.5L6.5 12L13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className={className}>
        <svg
          className={styles.iconSvg}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  return <div className={className} aria-hidden="true" />;
}

function allComplete(steps: VerificationStep[]): boolean {
  return steps.length > 0 && steps.every((s) => s.status === "complete");
}

export function VerificationStatus({
  steps,
  claims,
}: VerificationStatusProps) {
  const complete = allComplete(steps);
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ol role="list" className={styles.stepList}>
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <li role="listitem" className={styles.step}>
                <StepIcon status={step.status} />
                <span className={styles.stepLabel}>{step.label}</span>
              </li>
              {index < steps.length - 1 && (
                <div className={styles.connector} aria-hidden="true" />
              )}
            </Fragment>
          ))}
        </ol>
        {complete && claims && claims.length > 0 && (
          <div className={styles.claimsContainer}>
            {claims.map((claim) => (
              <ClaimBadge key={claim.key} claim={claim} verified />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
