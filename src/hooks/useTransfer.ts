"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useSecurityTier } from "@/hooks/useSecurityTier";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@/lib/models/asset";
import type { AssetType, TransferStep } from "@/lib/models/dex";

interface TransferState {
  step: TransferStep;
  recipientAddress: string | null;
  txHash: string | null;
  error: string | null;
}

type Action =
  | { type: "SET_RECIPIENT"; address: string }
  | { type: "SET_STEP"; step: TransferStep }
  | { type: "TRANSFER_COMPLETE"; txHash: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };

function reducer(state: TransferState, action: Action): TransferState {
  switch (action.type) {
    case "SET_RECIPIENT":
      return { ...state, recipientAddress: action.address, error: null };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "TRANSFER_COMPLETE":
      return { ...state, txHash: action.txHash };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return {
        step: "recipient",
        recipientAddress: null,
        txHash: null,
        error: null,
      };
    default:
      return state;
  }
}

const BASE58_PATTERN = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function isValidXrplAddress(address: string): boolean {
  return BASE58_PATTERN.test(address);
}

function deriveAssetType(asset: Asset): AssetType {
  return asset.category === "money_rwa" ? "iou" : "nft";
}

export interface UseTransferReturn {
  step: TransferStep;
  recipientAddress: string | null;
  txHash: string | null;
  error: string | null;
  setRecipient: (address: string) => void;
  confirmTransfer: () => Promise<void>;
  cancelTransfer: () => void;
  goBack: () => void;
}

export function useTransfer({ asset }: { asset: Asset }): UseTransferReturn {
  const { subscribe, send } = useWebSocket();
  const { requireTier } = useSecurityTier();
  const [state, dispatch] = useReducer(reducer, {
    step: "recipient",
    recipientAddress: null,
    txHash: null,
    error: null,
  });

  useEffect(() => {
    const unsub = subscribe<{
      status: "ok" | "error";
      tx_hash?: string;
      error?: string;
    }>("dex.transfer_asset:response", (p) => {
      if (p.status === "ok" && p.tx_hash) {
        dispatch({ type: "TRANSFER_COMPLETE", txHash: p.tx_hash });
        dispatch({ type: "SET_STEP", step: "success" });
      } else {
        dispatch({ type: "SET_ERROR", error: p.error ?? "Transfer failed" });
        dispatch({ type: "SET_STEP", step: "error" });
      }
    });
    const unsubEvent = subscribe<{ tx_hash: string }>(
      "dex:transfer_complete",
      () => {
        dispatch({ type: "SET_STEP", step: "success" });
      },
    );
    return () => {
      unsub();
      unsubEvent();
    };
  }, [subscribe]);

  const setRecipient = useCallback((address: string) => {
    if (!isValidXrplAddress(address)) {
      dispatch({ type: "SET_ERROR", error: "Invalid XRPL address format" });
      return;
    }
    dispatch({ type: "SET_RECIPIENT", address });
  }, []);

  const confirmTransfer = useCallback(async (): Promise<void> => {
    if (!state.recipientAddress) {
      dispatch({ type: "SET_ERROR", error: "Recipient address is required" });
      return;
    }
    dispatch({ type: "SET_STEP", step: "authenticate" });
    try {
      await requireTier(2);
      dispatch({ type: "SET_STEP", step: "submitting" });
      send("dex.transfer_asset", {
        asset_id: asset.id,
        recipient_address: state.recipientAddress,
        asset_type: deriveAssetType(asset),
        encrypted_payload: "",
      });
    } catch {
      dispatch({ type: "SET_STEP", step: "recipient" });
    }
  }, [asset, requireTier, send, state.recipientAddress]);

  const cancelTransfer = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const goBack = useCallback(() => {
    if (state.step === "authenticate" || state.step === "error") {
      dispatch({ type: "SET_STEP", step: "recipient" });
    }
  }, [state.step]);

  return {
    step: state.step,
    recipientAddress: state.recipientAddress,
    txHash: state.txHash,
    error: state.error,
    setRecipient,
    confirmTransfer,
    cancelTransfer,
    goBack,
  };
}
