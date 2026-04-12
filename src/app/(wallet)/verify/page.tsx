"use client";

import { useCallback, useEffect, useState } from "react";
import { ClaimBadge } from "@/components/identity/ClaimBadge";
import { IDUpload } from "@/components/identity/IDUpload";
import { SelfieCapture } from "@/components/identity/SelfieCapture";
import {
  type Claim,
  type VerificationStep,
  VerificationStatus,
} from "@/components/identity/VerificationStatus";
import { getPasskey } from "@/lib/auth/passkey";
import { deriveEncryptionKey } from "@/lib/auth/seed-derivation";
import { commitmentToHex, generateCommitment } from "@/lib/crypto/commitment";
import { encryptClaims } from "@/lib/crypto/encryption";
import type { ClaimsPayload } from "@/lib/crypto/encryption.model";
import { useWebSocket } from "@/hooks/useWebSocket";

type VerifyState =
  | { step: "upload_front" }
  | { step: "upload_back" }
  | { step: "selfie" }
  | { step: "verifying" }
  | { step: "encrypting"; claims: ClaimsPayload }
  | { step: "minting"; commitmentHex: string }
  | { step: "complete"; claims: ClaimsPayload; nftTokenId: string }
  | { step: "error"; message: string };

interface VerifyResponse {
  verified: boolean;
  verification_id: string;
  claims: ClaimsPayload;
}

interface MintResponse {
  nft_token_id: string;
  transaction_hash: string;
}

const STEP_LABELS: Array<{ id: string; label: string }> = [
  { id: "upload_front", label: "Upload front of ID" },
  { id: "upload_back", label: "Upload back of ID" },
  { id: "selfie", label: "Take selfie" },
  { id: "verifying", label: "Verifying identity" },
  { id: "encrypting", label: "Encrypting claims" },
  { id: "minting", label: "Minting credential" },
];

function buildSteps(currentStep: VerifyState["step"]): VerificationStep[] {
  const order = STEP_LABELS.map((s) => s.id);
  const currentIdx =
    currentStep === "complete" ? order.length : order.indexOf(currentStep);
  return STEP_LABELS.map((s, i) => {
    let status: VerificationStep["status"];
    if (currentStep === "error") {
      status = i < currentIdx ? "complete" : "error";
    } else if (currentStep === "complete") {
      status = "complete";
    } else if (i < currentIdx) {
      status = "complete";
    } else if (i === currentIdx) {
      status = "in_progress";
    } else {
      status = "pending";
    }
    return { id: s.id, label: s.label, status };
  });
}

function claimsToArray(claims: ClaimsPayload): Claim[] {
  return Object.entries(claims).map(([key, value]) => ({ key, value }));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export default function VerifyPage() {
  const [state, setState] = useState<VerifyState>({ step: "upload_front" });
  const { send, subscribe } = useWebSocket();

  const handleError = useCallback((error: Error) => {
    setState({ step: "error", message: error.message });
  }, []);

  const runEncryptionPipeline = useCallback(
    async (claims: ClaimsPayload) => {
      try {
        const passkey = await getPasskey();
        const encryptionKey = await deriveEncryptionKey(passkey.prfOutput);
        const encryptedBlob = await encryptClaims(claims, encryptionKey);
        const hash = await generateCommitment(encryptedBlob);
        const commitmentHex = commitmentToHex(hash);
        setState({ step: "minting", commitmentHex });
        send("identity.mint_credential", {
          commitment_hash: commitmentHex,
          encrypted_blob: bytesToBase64(encryptedBlob),
        });
      } catch (err) {
        handleError(err instanceof Error ? err : new Error("Encryption failed"));
      }
    },
    [send, handleError],
  );

  useEffect(() => {
    const unsubVerify = subscribe<VerifyResponse>(
      "identity.verify:response",
      (payload) => {
        if (!payload.verified) {
          handleError(new Error("Verification was not approved."));
          return;
        }
        setState({ step: "encrypting", claims: payload.claims });
        void runEncryptionPipeline(payload.claims);
      },
    );
    const unsubMint = subscribe<MintResponse>(
      "identity.mint_credential:response",
      (payload) => {
        setState((prev) => {
          if (prev.step !== "minting") return prev;
          return {
            step: "complete",
            claims: {},
            nftTokenId: payload.nft_token_id,
          };
        });
      },
    );
    return () => {
      unsubVerify();
      unsubMint();
    };
  }, [subscribe, handleError, runEncryptionPipeline]);

  const [completedClaims, setCompletedClaims] = useState<ClaimsPayload | null>(
    null,
  );
  useEffect(() => {
    if (state.step === "encrypting") setCompletedClaims(state.claims);
  }, [state]);

  const handleFrontCapture = (_blob: Blob) => {
    setState({ step: "upload_back" });
  };

  const handleBackCapture = (_blob: Blob) => {
    setState({ step: "selfie" });
  };

  const handleSelfieCapture = async (_blob: Blob) => {
    try {
      const passkey = await getPasskey();
      setState({ step: "verifying" });
      send("identity.verify", { user_id: passkey.credentialId });
    } catch (err) {
      handleError(err instanceof Error ? err : new Error("Verification failed"));
    }
  };

  const handleRetry = () => {
    setCompletedClaims(null);
    setState({ step: "upload_front" });
  };

  if (state.step === "upload_front") {
    return (
      <IDUpload
        side="front"
        onCapture={handleFrontCapture}
        onError={handleError}
      />
    );
  }
  if (state.step === "upload_back") {
    return (
      <IDUpload
        side="back"
        onCapture={handleBackCapture}
        onError={handleError}
      />
    );
  }
  if (state.step === "selfie") {
    return (
      <SelfieCapture
        onCapture={handleSelfieCapture}
        onError={handleError}
      />
    );
  }
  if (state.step === "complete") {
    const displayClaims = completedClaims ?? state.claims;
    return (
      <VerificationStatus
        steps={buildSteps("complete")}
        claims={claimsToArray(displayClaims)}
      />
    );
  }
  if (state.step === "error") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.6rem",
          padding: "2.4rem",
        }}
        role="alert"
      >
        <VerificationStatus steps={buildSteps("error")} />
        <p>{state.message}</p>
        <button
          type="button"
          onClick={handleRetry}
          style={{
            padding: "1.2rem 2.4rem",
            borderRadius: "1.6rem",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {completedClaims !== null && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
            {claimsToArray(completedClaims).map((c) => (
              <ClaimBadge key={c.key} claim={c} verified={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <VerificationStatus steps={buildSteps(state.step)} />;
}
