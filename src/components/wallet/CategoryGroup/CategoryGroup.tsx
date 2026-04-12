import { CredentialCard } from "@/components/wallet/CredentialCard";
import type { CategoryGroupProps } from "./CategoryGroup.model";
import styles from "./CategoryGroupStyles.module.css";

export function CategoryGroup({
  label,
  icon,
  assets,
  count,
}: CategoryGroupProps): React.JSX.Element | null {
  if (assets.length === 0) return null;
  return (
    <section className={styles.group}>
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        <h2 className={styles.label}>{label}</h2>
        <span className={styles.count}>{count}</span>
      </header>
      <div className={styles.grid}>
        {assets.map((asset) => (
          <CredentialCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}
