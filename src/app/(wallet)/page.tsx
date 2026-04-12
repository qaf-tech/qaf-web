"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { AssetGrid } from "@/components/wallet/AssetGrid";
import { BalanceHeader } from "@/components/wallet/BalanceHeader";
import { useAssets } from "@/hooks/useAssets";
import { useNotifications } from "@/hooks/useNotifications";
import type { Asset } from "@/lib/models/asset";
import glass from "@/styles/glass.module.css";
import styles from "./walletHome.module.css";

function computeRlusdBalance(assets: Asset[]): number {
  for (const asset of assets) {
    if (asset.category !== "money_rwa") continue;
    if (!asset.title.includes("RLUSD")) continue;
    const raw = asset.metadata.balance;
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function SkeletonGrid(): React.JSX.Element {
  return (
    <div className={styles.skeletonGrid}>
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className={styles.skeletonCard} aria-hidden="true" />
      ))}
    </div>
  );
}

export default function WalletHomePage(): React.JSX.Element {
  const { assets, isLoading, error, refetch } = useAssets();
  const { latestToast } = useNotifications();
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);

  const balance = useMemo(() => computeRlusdBalance(assets), [assets]);
  const showToast = latestToast !== null && latestToast.id !== dismissedToastId;

  return (
    <div className={styles.page}>
      <BalanceHeader balance={balance} isLoading={isLoading} />

      {isLoading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className={`${glass.surface} ${styles.errorState}`} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={refetch}
          >
            Retry
          </button>
        </div>
      ) : assets.length === 0 ? (
        <div className={`${glass.surface} ${styles.emptyState}`}>
          <span className={styles.emptyIcon} aria-hidden="true">
            💼
          </span>
          <p className={styles.emptyText}>
            Your wallet is empty. Add your first credential to get started.
          </p>
          <Link href="/chat" className={styles.emptyCta}>
            Add credential
          </Link>
        </div>
      ) : (
        <AssetGrid assets={assets} />
      )}

      <Link href="/chat" className={styles.fab} aria-label="Add new credential">
        +
      </Link>

      <Link href="/chat" className={`${glass.surface} ${styles.chatBar}`}>
        <span className={styles.chatPlaceholder}>Ask QAF anything...</span>
      </Link>

      {showToast && latestToast ? (
        <NotificationToast
          notification={latestToast}
          onDismiss={() => setDismissedToastId(latestToast.id)}
          index={0}
        />
      ) : null}
    </div>
  );
}
