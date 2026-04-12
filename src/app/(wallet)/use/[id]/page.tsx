"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { CredentialSummary } from "@/components/presentation/CredentialSummary";
import { NFCPulse } from "@/components/presentation/NFCPulse";
import { PresentationTimer } from "@/components/presentation/PresentationTimer";
import { QRPresentation } from "@/components/presentation/QRPresentation";
import { usePresentation } from "@/hooks/usePresentation";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import styles from "./usePageStyles.module.css";

interface WalletAssetResponse {
  asset?: Asset;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UsePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const ws = useWebSocket();
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const unsubscribe = ws.subscribe<WalletAssetResponse>(
      "wallet.get_asset:response",
      (payload) => {
        if (payload.asset && payload.asset.id === id) {
          setAsset(payload.asset);
        }
      },
    );
    ws.send("wallet.get_asset", { asset_id: id });
    return unsubscribe;
  }, [id, ws]);

  const { state, qrDataUrl, token, error, startPresentation } =
    usePresentation(asset);

  const balance =
    asset?.metadata.consumable_balance ?? asset?.metadata.balance ?? null;
  const isConsumable = balance !== null;

  const handleClose = useCallback(() => {
    router.push(`/asset/${id}`);
  }, [id, router]);

  const handleDone = useCallback(() => {
    if (state === "expired" || state === "error") {
      void startPresentation();
      return;
    }
    if (state === "presenting" && isConsumable && token) {
      ws.send("presentation.use_consumable", {
        credential_id: token.credential_id,
        presenter: token.presenter,
        nonce: token.nonce,
      });
    }
    router.push(`/asset/${id}`);
  }, [id, isConsumable, router, startPresentation, state, token, ws]);

  const doneLabel =
    state === "expired"
      ? "Generate New"
      : state === "error"
        ? "Try Again"
        : "Done";

  const doneAriaLabel =
    state === "expired"
      ? "Generate new presentation token"
      : state === "error"
        ? "Try again"
        : "Done presenting credential";

  const handleExpired = useCallback(() => {
    // Expiry is also tracked inside the hook; the timer calls onExpired for component-level reactions.
  }, []);

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close presentation and return to credential"
      >
        <svg
          className={styles.closeIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      </button>

      {asset ? <CredentialSummary asset={asset} balance={balance} /> : null}

      {state === "error" && error ? (
        <p className={styles.errorMessage}>{error}</p>
      ) : null}

      {state === "expired" ? (
        <p className={styles.expiredMessage}>Presentation expired</p>
      ) : null}

      {(state === "authenticating" ||
        state === "generating" ||
        state === "presenting") &&
      asset ? (
        <QRPresentation
          qrDataUrl={qrDataUrl}
          credentialTitle={asset.title}
          fact={token?.fact ?? ""}
        />
      ) : null}

      <NFCPulse isActive={state === "presenting"} />

      {state === "presenting" && token ? (
        <PresentationTimer
          expiresAt={token.expires_at}
          onExpired={handleExpired}
        />
      ) : null}

      <button
        type="button"
        className={`${glass.surface} ${styles.doneButton}`}
        onClick={handleDone}
        aria-label={doneAriaLabel}
      >
        {doneLabel}
      </button>
    </div>
  );
}
