import glass from "@/styles/glass.module.css";
import type { TypingIndicatorProps } from "./TypingIndicator.model";
import styles from "./TypingIndicatorStyles.module.css";

export function TypingIndicator({ statusText }: TypingIndicatorProps) {
  return (
    <output
      className={`${glass.surface} ${styles.container}`}
      aria-label={statusText}
    >
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.statusText}>{statusText}</span>
    </output>
  );
}
