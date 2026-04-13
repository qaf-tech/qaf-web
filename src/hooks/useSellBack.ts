"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSecurityTier } from "@/hooks/useSecurityTier";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@/lib/models/asset";
import type { AssetType, SellStep } from "@/lib/models/dex";

interface SellBackState {
  step: SellStep;
  estimatedPrice: number;
  elapsedTime: number;
  rlusdReceived: number;
  txHash: string | null;
  pendingOfferIndex: string | null;
  error: string | null;
}

type Action =
  | { type: "SET_ESTIMATE"; price: number }
  | { type: "SET_STEP"; step: SellStep }
  | { type: "OFFER_CREATED"; offerIndex: string; txHash: string }
  | { type: "TICK_ELAPSED" }
  | { type: "OFFER_ACCEPTED"; amount: number; txHash: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET"; estimatedPrice: number };

function reducer(state: SellBackState, action: Action): SellBackState {
  switch (action.type) {
    case "SET_ESTIMATE":
      return { ...state, estimatedPrice: action.price };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "OFFER_CREATED":
      return {
        ...state,
        pendingOfferIndex: action.offerIndex,
        txHash: action.txHash,
        elapsedTime: 0,
      };
    case "TICK_ELAPSED":
      return { ...state, elapsedTime: state.elapsedTime + 0.1 };
    case "OFFER_ACCEPTED":
      return {
        ...state,
        rlusdReceived: action.amount,
        txHash: action.txHash,
      };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return {
        step: "estimate",
        estimatedPrice: action.estimatedPrice,
        elapsedTime: 0,
        rlusdReceived: 0,
        txHash: null,
        pendingOfferIndex: null,
        error: null,
      };
    default:
      return state;
  }
}

function initialEstimate(asset: Asset): number {
  const raw = asset.metadata.purchasePrice;
  if (!raw) return 0;
  const parsed = Number.parseFloat(raw);
  return Number.isNaN(parsed) ? 0 : parsed * 0.8;
}

function deriveAssetType(asset: Asset): AssetType {
  return asset.category === "money_rwa" ? "iou" : "nft";
}

export interface UseSellBackReturn {
  step: SellStep;
  estimatedPrice: number;
  elapsedTime: number;
  rlusdReceived: number;
  txHash: string | null;
  error: string | null;
  confirmSell: () => Promise<void>;
  cancelSell: () => void;
  cancelOffer: () => void;
  goBack: () => void;
}

export function useSellBack({ asset }: { asset: Asset }): UseSellBackReturn {
  const { subscribe, send } = useWebSocket();
  const { requireTier } = useSecurityTier();
  const initial = initialEstimate(asset);
  const [state, dispatch] = useReducer(reducer, {
    step: "estimate",
    estimatedPrice: initial,
    elapsedTime: 0,
    rlusdReceived: 0,
    txHash: null,
    pendingOfferIndex: null,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    pendingRef.current = state.pendingOfferIndex;
  }, [state.pendingOfferIndex]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initial === 0) {
      send("dex.estimate_price", { asset_id: asset.id });
    }
    const unsubEstimate = subscribe<{ estimated_price: number }>(
      "dex.estimate_price:response",
      (p) => dispatch({ type: "SET_ESTIMATE", price: p.estimated_price }),
    );
    const unsubCreate = subscribe<{
      status: "ok" | "error";
      offer_index?: string;
      tx_hash?: string;
      error?: string;
    }>("dex.create_sell_offer:response", (p) => {
      if (p.status === "ok" && p.offer_index && p.tx_hash) {
        dispatch({
          type: "OFFER_CREATED",
          offerIndex: p.offer_index,
          txHash: p.tx_hash,
        });
        dispatch({ type: "SET_STEP", step: "waiting" });
        stopTimer();
        timerRef.current = setInterval(() => {
          dispatch({ type: "TICK_ELAPSED" });
        }, 100);
      } else {
        dispatch({ type: "SET_ERROR", error: p.error ?? "Offer creation failed" });
        dispatch({ type: "SET_STEP", step: "error" });
      }
    });
    const unsubAccepted = subscribe<{
      offer_index: string;
      amount_rlusd: number;
      tx_hash: string;
    }>("dex:offer_accepted", (p) => {
      if (p.offer_index !== pendingRef.current) return;
      stopTimer();
      dispatch({
        type: "OFFER_ACCEPTED",
        amount: p.amount_rlusd,
        txHash: p.tx_hash,
      });
      dispatch({ type: "SET_STEP", step: "success" });
    });
    const unsubCancel = subscribe<{ status: "ok" | "error" }>(
      "dex.cancel_offer:response",
      (p) => {
        if (p.status === "ok") {
          stopTimer();
          dispatch({ type: "RESET", estimatedPrice: initial });
        }
      },
    );
    return () => {
      unsubEstimate();
      unsubCreate();
      unsubAccepted();
      unsubCancel();
      stopTimer();
    };
  }, [asset.id, initial, send, subscribe, stopTimer]);

  const confirmSell = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_STEP", step: "authenticate" });
    try {
      await requireTier(2);
      dispatch({ type: "SET_STEP", step: "submitting" });
      send("dex.create_sell_offer", {
        asset_id: asset.id,
        amount: String(state.estimatedPrice),
        asset_type: deriveAssetType(asset),
      });
    } catch {
      dispatch({ type: "SET_STEP", step: "estimate" });
    }
  }, [asset, requireTier, send, state.estimatedPrice]);

  const cancelOffer = useCallback(() => {
    if (!state.pendingOfferIndex) return;
    send("dex.cancel_offer", { offer_index: state.pendingOfferIndex });
  }, [send, state.pendingOfferIndex]);

  const cancelSell = useCallback(() => {
    if (state.step === "waiting") {
      cancelOffer();
    }
    stopTimer();
    dispatch({ type: "RESET", estimatedPrice: initial });
  }, [cancelOffer, initial, state.step, stopTimer]);

  const goBack = useCallback(() => {
    if (state.step === "authenticate" || state.step === "error") {
      dispatch({ type: "SET_STEP", step: "estimate" });
    }
  }, [state.step]);

  return {
    step: state.step,
    estimatedPrice: state.estimatedPrice,
    elapsedTime: state.elapsedTime,
    rlusdReceived: state.rlusdReceived,
    txHash: state.txHash,
    error: state.error,
    confirmSell,
    cancelSell,
    cancelOffer,
    goBack,
  };
}
