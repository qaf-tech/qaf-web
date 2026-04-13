"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { UserLookupResult } from "@/lib/models/dex";
import glass from "@/styles/glass.module.css";
import type { RecipientInputProps } from "./RecipientInput.model";
import styles from "./RecipientInputStyles.module.css";

type Tab = "scan" | "username" | "paste";

const TABS: { id: Tab; label: string; panelId: string }[] = [
  { id: "scan", label: "Scan QR", panelId: "panel-scan" },
  { id: "username", label: "Username", panelId: "panel-username" },
  { id: "paste", label: "Paste Address", panelId: "panel-paste" },
];

const BASE58_PATTERN = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const SEARCH_DEBOUNCE_MS = 300;

function isValidXrplAddress(address: string): boolean {
  return BASE58_PATTERN.test(address);
}

export function RecipientInput({
  onRecipientSelected,
}: RecipientInputProps): React.JSX.Element {
  const { subscribe, send } = useWebSocket();
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [recipientAddress, setRecipientAddress] = useState<string | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserLookupResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tabsRef = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    const unsub = subscribe<{ users?: UserLookupResult[] }>(
      "dex.lookup_user:response",
      (p) => {
        setSearchResults(p.users ?? []);
      },
    );
    return () => unsub();
  }, [subscribe]);

  useEffect(() => {
    if (activeTab !== "username") return;
    const timer = setTimeout(() => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      send("dex.lookup_user", { query: query.trim() });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [activeTab, query, send]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "scan") {
      stopCamera();
      return;
    }
    let cancelled = false;
    setCameraError(null);
    navigator.mediaDevices
      ?.getUserMedia?.({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraError("Camera unavailable. Use Username or Paste instead.");
        setActiveTab("paste");
      });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [activeTab, stopCamera]);

  const handlePaste = useCallback((value: string) => {
    if (value.trim().length === 0) {
      setValidationError(null);
      setRecipientAddress(null);
      return;
    }
    if (isValidXrplAddress(value.trim())) {
      setValidationError(null);
      setRecipientAddress(value.trim());
    } else {
      setValidationError("Invalid XRPL address format");
      setRecipientAddress(null);
    }
  }, []);

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const next = (index + delta + TABS.length) % TABS.length;
      setActiveTab(TABS[next]!.id);
      tabsRef.current[next]?.focus();
    },
    [],
  );

  const canContinue = recipientAddress !== null;

  return (
    <div className={`${glass.surface} ${styles.container}`}>
      <div className={styles.tabList} role="tablist">
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              ref={(el) => {
                if (el) tabsRef.current[i] = el;
              }}
              aria-selected={isActive}
              aria-controls={tab.panelId}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "scan" ? (
        <div
          id="panel-scan"
          role="tabpanel"
          className={styles.tabPanel}
        >
          {cameraError ? (
            <p className={styles.cameraError}>{cameraError}</p>
          ) : (
            <div className={styles.cameraViewport}>
              <video
                ref={videoRef}
                className={styles.cameraVideo}
                autoPlay
                playsInline
                muted
              >
                <track kind="captions" />
              </video>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "username" ? (
        <div
          id="panel-username"
          role="tabpanel"
          className={styles.tabPanel}
        >
          <input
            type="text"
            className={styles.input}
            aria-label="Search by username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
          />
          {searchResults.length > 0 ? (
            <div className={styles.dropdown}>
              {searchResults.map((user) => (
                <button
                  key={user.xrplAddress}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setRecipientAddress(user.xrplAddress);
                    setValidationError(null);
                  }}
                >
                  <p className={styles.username}>{user.username}</p>
                  <p className={styles.address}>{user.xrplAddress}</p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "paste" ? (
        <div
          id="panel-paste"
          role="tabpanel"
          className={styles.tabPanel}
        >
          <input
            type="text"
            className={styles.input}
            aria-label="XRPL address"
            onChange={(e) => handlePaste(e.target.value)}
            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
          {validationError ? (
            <p className={styles.validationError}>{validationError}</p>
          ) : null}
        </div>
      ) : null}

      {recipientAddress ? (
        <output className={styles.recipientDisplay}>{recipientAddress}</output>
      ) : null}

      <button
        type="button"
        className={`${styles.continueButton} ${
          canContinue ? "" : styles.continueButtonDisabled
        }`}
        disabled={!canContinue}
        onClick={() => {
          if (recipientAddress) onRecipientSelected(recipientAddress);
        }}
      >
        Continue
      </button>
    </div>
  );
}
