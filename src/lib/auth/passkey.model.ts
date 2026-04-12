/**
 * Passkey type definitions for the qaf-web surface.
 *
 * These types describe the result of WebAuthn passkey operations and the
 * typed error classes that bubble up from {@link ./passkey.ts}. Keeping the
 * types in their own module means UI code can import props without pulling in
 * the browser-only WebAuthn runtime.
 */

export interface PasskeyCreationResult {
  /** base64url-encoded WebAuthn credential ID. */
  readonly credentialId: string;
  /** Raw bytes emitted by the PRF extension (typically 32 B). */
  readonly prfOutput: Uint8Array;
  /** Raw attestation public key (SPKI bytes). */
  readonly publicKey: Uint8Array;
}

export interface PasskeyAuthResult {
  /** base64url-encoded WebAuthn credential ID. */
  readonly credentialId: string;
  /** Raw bytes emitted by the PRF extension (typically 32 B). */
  readonly prfOutput: Uint8Array;
  /** Raw authenticator data from the assertion response. */
  readonly authenticatorData: Uint8Array;
}

export type PasskeyErrorCode =
  | "passkey_cancelled"
  | "webauthn_not_supported"
  | "prf_not_supported"
  | "passkey_not_found";

export class PasskeyError extends Error {
  public readonly code: PasskeyErrorCode;

  constructor(code: PasskeyErrorCode, message: string) {
    super(message);
    this.name = "PasskeyError";
    this.code = code;
  }
}
