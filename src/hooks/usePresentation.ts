"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSecurityTier } from "@/hooks/useSecurityTier";
import type { Asset } from "@/lib/models/asset";
import { generateQRDataUrl } from "@/lib/presentation/qr";
import {
  generatePresentationToken,
  getDefaultFact,
  PRESENTATION_TTL_SECONDS,
  serializeToken,
} from "@/lib/presentation/token";
import type { PresentationToken } from "@/lib/presentation/token.model";

export type PresentationState =
  | "idle"
  | "authenticating"
  | "generating"
  | "presenting"
  | "expired"
  | "error";

interface State {
  state: PresentationState;
  qrDataUrl: string | null;
  token: PresentationToken | null;
  error: string | null;
}

type Action =
  | { type: "START_AUTH" }
  | { type: "AUTH_SUCCESS" }
  | {
      type: "GENERATION_SUCCESS";
      token: PresentationToken;
      qrDataUrl: string;
    }
  | { type: "TOKEN_EXPIRED" }
  | { type: "FAILURE"; message: string }
  | { type: "RESET" };

const INITIAL_STATE: State = {
  state: "idle",
  qrDataUrl: null,
  token: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_AUTH":
      return {
        state: "authenticating",
        qrDataUrl: null,
        token: null,
        error: null,
      };
    case "AUTH_SUCCESS":
      return { ...state, state: "generating" };
    case "GENERATION_SUCCESS":
      return {
        state: "presenting",
        qrDataUrl: action.qrDataUrl,
        token: action.token,
        error: null,
      };
    case "TOKEN_EXPIRED":
      return { ...state, state: "expired" };
    case "FAILURE":
      return {
        ...state,
        state: "error",
        error: action.message,
      };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

export function determineTier(asset: Asset): 1 | 2 {
  const raw = asset.metadata.value_eur;
  if (typeof raw !== "string") return 1;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 1;
  return parsed >= 50 ? 2 : 1;
}

interface PresentationKeyProvider {
  presenterAddress: string;
  privateKey: Uint8Array;
}

const ZERO_KEY = new Uint8Array(32);

function defaultKeyProvider(asset: Asset): PresentationKeyProvider {
  const presenter =
    (typeof asset.metadata.presenter_address === "string" &&
      asset.metadata.presenter_address) ||
    (typeof asset.metadata.wallet_address === "string" &&
      asset.metadata.wallet_address) ||
    "rPresenter";
  return { presenterAddress: presenter, privateKey: ZERO_KEY };
}

export interface UsePresentationResult {
  state: PresentationState;
  qrDataUrl: string | null;
  token: PresentationToken | null;
  error: string | null;
  startPresentation: () => Promise<void>;
  reset: () => void;
  serializedToken: string | null;
}

export function usePresentation(asset: Asset | null): UsePresentationResult {
  const { requireTier } = useSecurityTier();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const startedRef = useRef(false);

  const startPresentation = useCallback(async () => {
    if (!asset) return;
    dispatch({ type: "START_AUTH" });
    try {
      await requireTier(determineTier(asset));
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      if (code === "auth_cancelled") {
        dispatch({
          type: "FAILURE",
          message: "Authentication required to present credential",
        });
        return;
      }
      dispatch({
        type: "FAILURE",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }

    dispatch({ type: "AUTH_SUCCESS" });

    try {
      const fact = getDefaultFact(asset);
      const { presenterAddress, privateKey } = defaultKeyProvider(asset);
      const token = await generatePresentationToken(
        asset.id,
        presenterAddress,
        fact,
        privateKey,
      );
      const qrDataUrl = await generateQRDataUrl(serializeToken(token));
      dispatch({ type: "GENERATION_SUCCESS", token, qrDataUrl });
    } catch (error) {
      dispatch({
        type: "FAILURE",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate presentation token",
      });
    }
  }, [asset, requireTier]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    startedRef.current = false;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-start once on mount per asset id
  useEffect(() => {
    if (!asset || startedRef.current) return;
    startedRef.current = true;
    void startPresentation();
  }, [asset?.id]);

  useEffect(() => {
    if (state.state !== "presenting" || !state.token) return;
    const expiresAt = state.token.expires_at;
    const interval = setInterval(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds >= expiresAt) {
        clearInterval(interval);
        dispatch({ type: "TOKEN_EXPIRED" });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state.state, state.token]);

  return {
    state: state.state,
    qrDataUrl: state.qrDataUrl,
    token: state.token,
    error: state.error,
    startPresentation,
    reset,
    serializedToken: state.token ? serializeToken(state.token) : null,
  };
}

// Re-export for convenience
export { PRESENTATION_TTL_SECONDS };
