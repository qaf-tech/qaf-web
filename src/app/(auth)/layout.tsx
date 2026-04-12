import type { ReactNode } from "react";
import styles from "./authLayout.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
