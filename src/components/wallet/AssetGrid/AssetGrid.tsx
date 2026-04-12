"use client";

import { CategoryGroup } from "@/components/wallet/CategoryGroup";
import type { Asset, Category } from "@/lib/models/asset";
import type { AssetGridProps } from "./AssetGrid.model";
import styles from "./AssetGridStyles.module.css";

interface CategoryConfig {
  key: Category;
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  { key: "tickets", label: "Tickets", icon: "🎫" },
  { key: "insurance", label: "Insurance", icon: "🛡️" },
  { key: "money_rwa", label: "Money & RWA", icon: "💰" },
  { key: "esims", label: "eSIMs", icon: "📶" },
];

function groupByCategory(assets: Asset[]): Map<Category, Asset[]> {
  const map = new Map<Category, Asset[]>();
  for (const asset of assets) {
    const list = map.get(asset.category) ?? [];
    list.push(asset);
    map.set(asset.category, list);
  }
  return map;
}

export function AssetGrid({ assets }: AssetGridProps): React.JSX.Element {
  const grouped = groupByCategory(assets);
  return (
    <div className={styles.container}>
      {CATEGORY_CONFIG.map((cfg) => {
        const list = grouped.get(cfg.key) ?? [];
        if (list.length === 0) return null;
        return (
          <CategoryGroup
            key={cfg.key}
            category={cfg.key}
            label={cfg.label}
            icon={cfg.icon}
            assets={list}
            count={list.length}
          />
        );
      })}
    </div>
  );
}
