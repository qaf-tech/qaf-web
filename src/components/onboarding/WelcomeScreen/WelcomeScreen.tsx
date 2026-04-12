"use client";

import Link from "next/link";
import glass from "@/styles/glass.module.css";
import type { WelcomeScreenProps } from "./WelcomeScreen.model";
import styles from "./WelcomeScreenStyles.module.css";

export function WelcomeScreen({ onCreateWallet }: WelcomeScreenProps) {
  return (
    <main className={styles.container}>
      <div className={`${glass.surface} ${styles.card}`}>
        <h1 className={styles.heading}>Your wallet, your identity</h1>
        <p className={styles.subheading}>
          Create a self-custodial XRPL wallet secured by your device passkey —
          zero-knowledge by design, no seed phrase to write down.
        </p>
        <button
          type="button"
          className={styles.ctaButton}
          aria-label="Create a new QAF wallet"
          onClick={onCreateWallet}
        >
          Create wallet
        </button>
        <Link href="/recover" className={styles.recoveryLink}>
          Recover existing wallet
        </Link>
      </div>
    </main>
  );
}
