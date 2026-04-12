"use client";

import type { QRPresentationProps } from "./QRPresentation.model";
import styles from "./QRPresentationStyles.module.css";

export function QRPresentation({
  qrDataUrl,
  credentialTitle,
  fact,
}: QRPresentationProps) {
  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Scan this QR code to verify ${fact}`}
    >
      {qrDataUrl === null ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : (
        // biome-ignore lint/performance/noImgElement: QR is a data: URL, not a remote asset next/image can optimize
        <img
          src={qrDataUrl}
          alt={`Presentation QR code for ${credentialTitle}`}
          className={styles.qrImage}
        />
      )}
    </div>
  );
}
