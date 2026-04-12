/**
 * Seed-derivation type definitions for the qaf-web surface.
 *
 * Consumed by {@link ./seed-derivation.ts}. The result type bundles the raw
 * XRPL entropy together with its AES-GCM sealed form so callers can hand the
 * encrypted blob to the server without ever leaking plaintext.
 */

export interface SeedDerivationResult {
  /** 16-byte XRPL entropy derived from the passkey PRF output. */
  readonly seed: Uint8Array;
  /** IV || ciphertext || auth-tag, ready to persist server-side. */
  readonly encryptedSeed: Uint8Array;
}

export type SeedDerivationErrorCode = "decryption_failed" | "derivation_failed";

export class SeedDerivationError extends Error {
  public readonly code: SeedDerivationErrorCode;

  constructor(code: SeedDerivationErrorCode, message: string) {
    super(message);
    this.name = "SeedDerivationError";
    this.code = code;
  }
}
