/**
 * Type definitions for client-side claims encryption.
 *
 * Claims payloads are plain JSON objects keyed by claim name with scalar
 * values (strings or booleans). The ciphertext — produced by
 * {@link ../encryption.encryptClaims} — is the only form that ever crosses
 * the network boundary; plaintext claims live in memory only for the
 * duration of the verification flow.
 */

export type ClaimsPayload = Record<string, string | boolean>;

export type EncryptionErrorCode =
  | "claims_encryption_failed"
  | "claims_decryption_failed";

export class EncryptionError extends Error {
  readonly code: EncryptionErrorCode;

  constructor(code: EncryptionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "EncryptionError";
  }
}
