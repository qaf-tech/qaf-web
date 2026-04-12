"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type {
  BiometricStatus,
  PurchaseCompleteData,
  PurchaseFlowState,
  PurchaseStepData,
  QuoteData,
} from "@/lib/models/chat";

const TIMER_START = 10;
const BIOMETRIC_FALLBACK_MS = 500;

interface IncomingPurchasePayload {
  message_type?: string;
  step?: PurchaseStepData;
  steps?: PurchaseStepData[];
  result?: PurchaseCompleteData;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function runBiometric(): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.credentials &&
    typeof navigator.credentials.get === "function"
  ) {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 30_000,
          userVerification: "required",
        },
      } as CredentialRequestOptions);
      return credential !== null;
    } catch {
      return false;
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), BIOMETRIC_FALLBACK_MS);
  });
}

export function usePurchaseFlow(): {
  purchaseState: PurchaseFlowState;
  selectedQuote: QuoteData | null;
  startPurchase: (quote: QuoteData) => void;
  confirmPurchase: () => void;
  cancelPurchase: () => void;
  biometricStatus: BiometricStatus;
  triggerBiometric: () => void;
  timeRemaining: number;
  steps: PurchaseStepData[];
} {
  const ws = useWebSocket();
  const [purchaseState, setPurchaseState] = useState<PurchaseFlowState>("idle");
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
  const [biometricStatus, setBiometricStatus] =
    useState<BiometricStatus>("idle");
  const [timeRemaining, setTimeRemaining] = useState(TIMER_START);
  const [steps, setSteps] = useState<PurchaseStepData[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPurchase = useCallback(() => {
    clearTimer();
    setPurchaseState("idle");
    setSelectedQuote(null);
    setTimeRemaining(TIMER_START);
    setBiometricStatus("idle");
  }, [clearTimer]);

  const startPurchase = useCallback(
    (quote: QuoteData) => {
      clearTimer();
      setSelectedQuote(quote);
      setPurchaseState("confirming");
      setBiometricStatus("idle");
      setTimeRemaining(TIMER_START);
      setSteps([]);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (purchaseState !== "confirming") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [purchaseState]);

  useEffect(() => {
    if (purchaseState !== "confirming" || timeRemaining > 0) return;
    clearTimer();
    if (biometricStatus === "authenticated" && selectedQuote) {
      setPurchaseState("executing");
      ws.send("agent.execute_purchase", {
        quote_id: selectedQuote.merchantId,
        merchant_id: selectedQuote.merchantId,
        idempotency_key: newId(),
      });
    } else {
      cancelPurchase();
    }
  }, [
    timeRemaining,
    purchaseState,
    biometricStatus,
    selectedQuote,
    cancelPurchase,
    clearTimer,
    ws,
  ]);

  const triggerBiometric = useCallback(() => {
    setBiometricStatus("authenticating");
    void runBiometric().then((ok) => {
      setBiometricStatus(ok ? "authenticated" : "failed");
    });
  }, []);

  const confirmPurchase = useCallback(() => {
    triggerBiometric();
  }, [triggerBiometric]);

  useEffect(() => {
    const unsub = ws.subscribe<IncomingPurchasePayload>(
      "chat:message",
      (payload) => {
        if (payload.message_type === "purchase_status") {
          const incoming =
            payload.steps ?? (payload.step ? [payload.step] : []);
          if (incoming.length === 0) return;
          setSteps((prev) => [...prev, ...incoming]);
          return;
        }
        if (payload.message_type === "purchase_complete") {
          setPurchaseState("complete");
        }
      },
    );
    return () => {
      unsub();
    };
  }, [ws]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    purchaseState,
    selectedQuote,
    startPurchase,
    confirmPurchase,
    cancelPurchase,
    biometricStatus,
    triggerBiometric,
    timeRemaining,
    steps,
  };
}
