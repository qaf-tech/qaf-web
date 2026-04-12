import type { AppShellProps } from "./AppShell.model";
import styles from "./AppShellStyles.module.css";

export function AppShell({ children }: AppShellProps) {
  return <div className={styles.container}>{children}</div>;
}
