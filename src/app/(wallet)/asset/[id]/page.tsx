"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AssetDetail } from "@/components/wallet/AssetDetail";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import styles from "./assetDetailPage.module.css";

interface AssetResponse {
  status: "ok" | "error";
  asset?: Asset;
  error?: string;
}

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const { subscribe, send } = useWebSocket();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const unsub = subscribe<AssetResponse>(
      "wallet.get_asset:response",
      (payload) => {
        setIsLoading(false);
        if (payload.status === "ok" && payload.asset) {
          setAsset(payload.asset);
        } else {
          setError(payload.error ?? "Asset not found");
        }
      },
    );
    send("wallet.get_asset", { asset_id: id });
    return () => unsub();
  }, [id, subscribe, send]);

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.back()}
        aria-label="Go back"
      >
        ← Back
      </button>

      {isLoading ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : error ? (
        <div className={`${glass.surface} ${styles.error}`} role="alert">
          {error}
        </div>
      ) : asset ? (
        <AssetDetail asset={asset} />
      ) : null}
    </div>
  );
}
