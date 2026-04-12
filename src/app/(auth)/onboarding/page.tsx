"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deriveAddress, deriveKeypair } from "ripple-keypairs";
import { PasskeyPrompt } from "@/components/onboarding/PasskeyPrompt";
import { WalletReady } from "@/components/onboarding/WalletReady";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { useWebSocket } from "@/hooks/useWebSocket";
import { createPasskey } from "@/lib/auth/passkey";
import { PasskeyError } from "@/lib/auth/passkey.model";
import {
  deriveEncryptionKey,
  deriveSeed,
  encryptSeed,
} from "@/lib/auth/seed-derivation";

type OnboardingState =
  | { step: "welcome" }
  | { step: "creating_passkey" }
  | { step: "deriving_wallet" }
  | { step: "funding" }
  | { step: "ready"; xrplAddress: string }
  | { step: "error"; message: string };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function mapPasskeyError(code: string): string {
  switch (code) {
    case "passkey_cancelled":
      return "Biometric confirmation cancelled. Try again when ready.";
    case "webauthn_not_supported":
      return "Your browser does not support passkeys.";
    case "prf_not_supported":
      return "Your browser does not support deterministic wallet derivation.";
    default:
      return "Unable to create wallet. Please try again.";
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { send, subscribe } = useWebSocket();
  const [state, setState] = useState<OnboardingState>({ step: "welcome" });

  async function handleCreateWallet() {
    setState({ step: "creating_passkey" });
    let passkey: Awaited<ReturnType<typeof createPasskey>>;
    try {
      passkey = await createPasskey();
    } catch (err) {
      const message =
        err instanceof PasskeyError
          ? mapPasskeyError(err.code)
          : "Unable to create passkey.";
      setState({ step: "error", message });
      return;
    }

    setState({ step: "deriving_wallet" });
    let xrplAddress: string;
    let encryptedSeedB64: string;
    try {
      const seed = await deriveSeed(passkey.prfOutput);
      const encryptionKey = await deriveEncryptionKey(passkey.prfOutput);
      const encryptedBlob = await encryptSeed(seed, encryptionKey);
      encryptedSeedB64 = bytesToBase64(encryptedBlob);
      const { publicKey } = deriveKeypair(bytesToHex(seed).toUpperCase(), {
        algorithm: "ed25519",
      });
      xrplAddress = deriveAddress(publicKey);
    } catch {
      setState({
        step: "error",
        message: "Failed to derive wallet. Please try again.",
      });
      return;
    }

    setState({ step: "funding" });
    const unsubscribeOk = subscribe<{ xrpl_address?: string }>(
      "auth.onboard" as never,
      (payload) => {
        unsubscribeOk();
        unsubscribeErr();
        setState({
          step: "ready",
          xrplAddress: payload.xrpl_address ?? xrplAddress,
        });
      },
    );
    const unsubscribeErr = subscribe<{ message?: string }>(
      "system:error",
      (payload) => {
        unsubscribeOk();
        unsubscribeErr();
        setState({
          step: "error",
          message: payload.message ?? "Onboarding failed on the server.",
        });
      },
    );

    send("auth.onboard" as never, {
      credential_id: passkey.credentialId,
      encrypted_seed: encryptedSeedB64,
      xrpl_address: xrplAddress,
    });
  }

  function handleContinue() {
    router.push("/");
  }

  function handleRetry() {
    setState({ step: "welcome" });
  }

  switch (state.step) {
    case "welcome":
      return <WelcomeScreen onCreateWallet={handleCreateWallet} />;
    case "creating_passkey":
    case "deriving_wallet":
    case "funding":
      return <PasskeyPrompt status={state.step} />;
    case "error":
      return (
        <PasskeyPrompt
          status="error"
          message={state.message}
          onRetry={handleRetry}
        />
      );
    case "ready":
      return (
        <WalletReady
          xrplAddress={state.xrplAddress}
          onContinue={handleContinue}
        />
      );
  }
}
