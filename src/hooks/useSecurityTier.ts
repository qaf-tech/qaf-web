"use client";

import { useCallback, useMemo } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getPasskey } from "@/lib/auth/passkey";

export type SecurityTier = 0 | 1 | 2 | 3;

export type SecurityTierErrorCode =
  | "auth_cancelled"
  | "pin_invalid"
  | "pin_not_configured"
  | "cooldown_active";

export class SecurityTierError extends Error {
  public readonly code: SecurityTierErrorCode;
  constructor(code: SecurityTierErrorCode, message: string) {
    super(message);
    this.name = "SecurityTierError";
    this.code = code;
  }
}

const PIN_STORAGE_KEY = "qaf-pin";
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_BIT_LENGTH = 256;
const SALT_BYTE_LENGTH = 16;

interface StoredPin {
  readonly hash: string;
  readonly salt: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(input: string): Uint8Array {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hashPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = salt.slice().buffer as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    PBKDF2_BIT_LENGTH,
  );
  return new Uint8Array(bits);
}

function readStoredPin(): StoredPin | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(PIN_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "hash" in parsed &&
      "salt" in parsed &&
      typeof (parsed as StoredPin).hash === "string" &&
      typeof (parsed as StoredPin).salt === "string"
    ) {
      return parsed as StoredPin;
    }
    return null;
  } catch {
    return null;
  }
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyPin(pin: string): Promise<boolean> {
  const stored = readStoredPin();
  if (!stored)
    throw new SecurityTierError("pin_not_configured", "PIN is not configured.");
  const salt = fromBase64(stored.salt);
  const computed = await hashPin(pin, salt);
  const expected = fromBase64(stored.hash);
  return constantTimeEquals(computed, expected);
}

async function storePin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const hash = await hashPin(pin, salt);
  const record: StoredPin = {
    hash: toBase64(hash),
    salt: toBase64(salt),
  };
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
}

export interface UseSecurityTierResult {
  pinConfigured: boolean;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  requireTier: (
    tier: SecurityTier,
    options?: { pin?: string; actionType?: string },
  ) => Promise<void>;
}

export function useSecurityTier(): UseSecurityTierResult {
  const { send } = useWebSocket();

  const pinConfigured = useMemo(() => readStoredPin() !== null, []);

  const setupPin = useCallback(async (pin: string): Promise<void> => {
    await storePin(pin);
  }, []);

  const verifyPinCb = useCallback(async (pin: string): Promise<boolean> => {
    return verifyPin(pin);
  }, []);

  const requireTier = useCallback(
    async (
      tier: SecurityTier,
      options: { pin?: string; actionType?: string } = {},
    ): Promise<void> => {
      if (tier === 0) return;

      try {
        await getPasskey();
      } catch {
        throw new SecurityTierError("auth_cancelled", "Biometric cancelled.");
      }

      if (tier === 1) return;

      if (readStoredPin() === null) {
        throw new SecurityTierError(
          "pin_not_configured",
          "PIN is not configured. Set up a PIN to continue.",
        );
      }
      if (options.pin === undefined) {
        throw new SecurityTierError(
          "pin_invalid",
          "PIN is required for this action.",
        );
      }
      const ok = await verifyPin(options.pin);
      if (!ok)
        throw new SecurityTierError("pin_invalid", "PIN does not match.");

      if (tier === 2) return;

      send("security.request_tier3" as never, {
        action_type: options.actionType ?? "tier3_action",
        requested_at: new Date().toISOString(),
      });
      throw new SecurityTierError(
        "cooldown_active",
        "Tier 3 action queued. A 24-hour cooldown now applies.",
      );
    },
    [send],
  );

  return {
    pinConfigured,
    setupPin,
    verifyPin: verifyPinCb,
    requireTier,
  };
}
