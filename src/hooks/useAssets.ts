"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@/lib/models/asset";

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; assets: Asset[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "BALANCE_UPDATE"; balance: number }
  | { type: "TRANSACTION_UPDATE"; asset: Asset };

interface State {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { assets: action.assets, isLoading: false, error: null };
    case "FETCH_ERROR":
      return { assets: [], isLoading: false, error: action.error };
    case "BALANCE_UPDATE": {
      const next = state.assets.map((a) => {
        if (a.category !== "money_rwa") return a;
        if (!a.title.includes("RLUSD")) return a;
        return {
          ...a,
          metadata: { ...a.metadata, balance: String(action.balance) },
        };
      });
      return { ...state, assets: next };
    }
    case "TRANSACTION_UPDATE":
      return { ...state, assets: [action.asset, ...state.assets] };
    default:
      return state;
  }
}

export interface UseAssetsReturn {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAssets(): UseAssetsReturn {
  const { subscribe, send } = useWebSocket();
  const [state, dispatch] = useReducer(reducer, {
    assets: [],
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(() => {
    dispatch({ type: "FETCH_START" });
    send("wallet.list_assets", {});
  }, [send]);

  useEffect(() => {
    const unsubResponse = subscribe<{
      status: "ok" | "error";
      assets?: Asset[];
      error?: string;
    }>("wallet.list_assets:response", (payload) => {
      if (payload.status === "ok" && payload.assets) {
        dispatch({ type: "FETCH_SUCCESS", assets: payload.assets });
      } else {
        dispatch({
          type: "FETCH_ERROR",
          error: payload.error ?? "Unknown error",
        });
      }
    });
    const unsubBalance = subscribe<{ balance: number }>(
      "wallet:balance_update",
      (p) => dispatch({ type: "BALANCE_UPDATE", balance: p.balance }),
    );
    const unsubTx = subscribe<{ asset: Asset }>("wallet:transaction", (p) =>
      dispatch({ type: "TRANSACTION_UPDATE", asset: p.asset }),
    );
    send("wallet.list_assets", {});
    return () => {
      unsubResponse();
      unsubBalance();
      unsubTx();
    };
  }, [subscribe, send]);

  return {
    assets: state.assets,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
