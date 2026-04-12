"use client";

import { useEffect, useRef, useState } from "react";
import { PRESENTATION_TTL_SECONDS } from "@/lib/presentation/token";
import type { PresentationTimerProps } from "./PresentationTimer.model";
import styles from "./PresentationTimerStyles.module.css";

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function computeRemaining(expiresAt: number): number {
  return Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
}

function colorClassFor(remaining: number): string {
  if (remaining <= 5) return styles.progressDanger;
  if (remaining <= 10) return styles.progressWarning;
  return styles.progressNormal;
}

export function PresentationTimer({
  expiresAt,
  onExpired,
}: PresentationTimerProps) {
  const [remaining, setRemaining] = useState<number>(() =>
    computeRemaining(expiresAt),
  );
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    setRemaining(computeRemaining(expiresAt));
    const interval = setInterval(() => {
      const next = computeRemaining(expiresAt);
      setRemaining(next);
      if (next === 0) {
        clearInterval(interval);
        onExpiredRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const dashOffset = CIRCUMFERENCE * (1 - remaining / PRESENTATION_TTL_SECONDS);
  const colorClass = colorClassFor(remaining);

  return (
    <div
      className={styles.container}
      role="timer"
      aria-label={`Presentation expires in ${remaining} seconds`}
    >
      <svg className={styles.svg} viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={RADIUS} className={styles.track} />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          className={`${styles.progress} ${colorClass}`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="36" className={styles.seconds} aria-live="polite">
          {remaining}
        </text>
        <text x="40" y="50" className={styles.label}>
          seconds
        </text>
      </svg>
    </div>
  );
}
