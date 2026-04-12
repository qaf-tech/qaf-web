"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deriveAddress, deriveKeypair } from "ripple-keypairs";
import { PasskeyPrompt } from "@/components/onboarding/PasskeyPrompt";
import { WalletReady } from "@/components/onboarding/WalletReady";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getPasskey } from "@/lib/auth/passkey";
import { PasskeyError } from "@/lib/auth/passkey.model";
import { deriveSeed } from "@/lib/auth/seed-derivation";
import glass from "@/styles/glass.module.css";
import styles from "./RecoverStyles.module.css";

type RecoveryState =
  | { step: "idle" }
  | { step: "authenticating" }
  | { step: "verifying" }
  | { step: "ready"; xrplAddress: string }
  | { step: "error"; message: string; notFound?: boolean };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function mapPasskeyError(code: string): string {
  switch (code) {
    case "passkey_cancelled":
      return "Authentication cancelled. Try again when ready.";
    case "webauthn_not_supported":
      return "Your browser does not support passkeys.";
    case "prf_not_supported":
      return "Your browser does not support deterministic wallet derivation.";
    case "passkey_not_found":
      return "No passkey found on this device.";
    default:
      return "Unable to authenticate. Please try again.";
  }
}

export default function RecoverPage() {
  const router = useRouter();
  const { send, subscribe } = useWebSocket();
  const [state, setState] = useState<RecoveryState>({ step: "idle" });

  async function handleRecover() {
    setState({ step: "authenticating" });
    let passkey: Awaited<ReturnType<typeof getPasskey>>;
    try {
      passkey = await getPasskey();
    } catch (err) {
      const message =
        err instanceof PasskeyError
          ? mapPasskeyError(err.code)
          : "Unable to authenticate.";
      setState({ step: "error", message });
      return;
    }

    setState({ step: "verifying" });
    let derivedAddress: string;
    try {
      const seed = await deriveSeed(passkey.prfOutput);
      const { publicKey } = deriveKeypair(bytesToHex(seed).toUpperCase(), {
        algorithm: "ed25519",
      });
      derivedAddress = deriveAddress(publicKey);
    } catch {
      setState({
        step: "error",
        message: "Failed to derive wallet from passkey.",
      });
      return;
    }

    const unsubscribeOk = subscribe<{
      xrpl_address?: string;
      wallets?: { xrpl_address?: string }[];
    }>("auth.recover" as never, (payload) => {
      unsubscribeOk();
      unsubscribeErr();
      const serverAddress =
        payload.xrpl_address ?? payload.wallets?.[0]?.xrpl_address;
      if (!serverAddress) {
        setState({
          step: "error",
          message:
            "No wallet found for this passkey. Please create a new wallet.",
          notFound: true,
        });
        return;
      }
      if (serverAddress !== derivedAddress) {
        setState({
          step: "error",
          message: "Key mismatch — derived address does not match server.",
        });
        return;
      }
      setState({ step: "ready", xrplAddress: serverAddress });
    });
    const unsubscribeErr = subscribe<{ code?: string; message?: string }>(
      "system:error",
      (payload) => {
        unsubscribeOk();
        unsubscribeErr();
        const notFound = payload.code === "user_not_found";
        setState({
          step: "error",
          message: notFound
            ? "No wallet found for this passkey. Please create a new wallet."
            : (payload.message ?? "Recovery failed on the server."),
          notFound,
        });
      },
    );

    send("auth.recover" as never, {
      credential_id: passkey.credentialId,
    });
  }

  if (state.step === "ready") {
    return (
      <WalletReady
        xrplAddress={state.xrplAddress}
        onContinue={() => router.push("/")}
      />
    );
  }

  if (state.step === "authenticating" || state.step === "verifying") {
    return (
      <PasskeyPrompt
        status={
          state.step === "authenticating"
            ? "creating_passkey"
            : "deriving_wallet"
        }
      />
    );
  }

  if (state.step === "error") {
    return (
      <main className={styles.container}>
        <div className={`${glass.surface} ${styles.card}`}>
          <h1 className={styles.heading}>Recovery failed</h1>
          <p className={styles.subheading}>{state.message}</p>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleRecover}
          >
            Try again
          </button>
          {state.notFound ? (
            <Link href="/onboarding" className={styles.secondaryLink}>
              Create a new wallet
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={`${glass.surface} ${styles.card}`}>
        <h1 className={styles.heading}>Recover your wallet</h1>
        <p className={styles.subheading}>
          Authenticate with your synced passkey to restore access on this
          device.
        </p>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleRecover}
          aria-label="Recover existing QAF wallet"
        >
          Recover wallet
        </button>
        <Link href="/onboarding" className={styles.secondaryLink}>
          Create a new wallet
        </Link>
      </div>
    </main>
  );
}
