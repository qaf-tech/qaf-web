import glass from "@/styles/glass.module.css";
import type { ChatBubbleProps } from "./ChatBubble.model";
import styles from "./ChatBubbleStyles.module.css";

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export function ChatBubble({
  content,
  variant,
  timestamp,
  isError,
  isSuccess,
  onRetry,
}: ChatBubbleProps) {
  const classNames = [styles.bubble];
  if (variant === "user") {
    classNames.push(styles.user);
  } else {
    classNames.push(styles.agent, glass.surface);
  }
  if (isError) classNames.push(styles.error);
  if (isSuccess) classNames.push(styles.success);

  return (
    <div className={classNames.join(" ")}>
      <p>{content}</p>
      <span className={styles.timestamp}>
        {TIME_FORMATTER.format(new Date(timestamp))}
      </span>
      {isError && onRetry ? (
        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
          aria-label="Retry message"
        >
          <svg
            className={styles.retryIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Retry
        </button>
      ) : null}
    </div>
  );
}
