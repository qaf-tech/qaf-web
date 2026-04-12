"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import glass from "@/styles/glass.module.css";
import type { ChatInputProps } from "./ChatInput.model";
import styles from "./ChatInputStyles.module.css";

const PX_PER_REM = 10;

export function ChatInput({ onSend, isDisabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure textarea height whenever value changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight / PX_PER_REM}rem`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

  const isSendDisabled = !value.trim() || Boolean(isDisabled);

  const containerClasses = [glass.surface, styles.container];
  if (isDisabled) containerClasses.push(styles.disabled);

  const sendButtonClasses = [styles.sendButton];
  if (isSendDisabled) sendButtonClasses.push(styles.sendButtonDisabled);

  return (
    <div className={containerClasses.join(" ")}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        rows={1}
        placeholder="Type a message..."
        aria-label="Type a message"
        disabled={isDisabled}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className={sendButtonClasses.join(" ")}
        aria-label="Send message"
        aria-disabled={isSendDisabled}
        onClick={handleSend}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
    </div>
  );
}
