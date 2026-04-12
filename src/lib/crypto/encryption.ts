/**
 * AES-GCM encryption helpers for the identity verification claims payload.
 *
 * All symmetric cryptography uses the Web Crypto API — no external
 * libraries. The encryption key is derived elsewhere (see
 * `../auth/seed-derivation.deriveEncryptionKey`) from the passkey PRF
 * output. The ciphertext format is `IV (12 bytes) || ciphertext+tag` so
 * both values travel together and can be pulled apart on decrypt.
 *
 * Privacy invariant: this module never transmits data. It only transforms
 * the in-memory claims object into ciphertext; network delivery is the
 * caller's responsibility and must happen over the established WebSocket.
 */

import { type ClaimsPayload, EncryptionError } from "./encryption.model";

const IV_BYTE_LENGTH = 12;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Encrypt a claims payload with AES-GCM and return `IV || ciphertext`.
 *
 * @throws {EncryptionError} with code `claims_encryption_failed` on failure.
 */
export async function encryptClaims(
  claims: ClaimsPayload,
  encryptionKey: CryptoKey,
): Promise<Uint8Array> {
  try {
    const plaintext = new TextEncoder().encode(JSON.stringify(claims));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
    const plaintextBuf = plaintext.slice().buffer as ArrayBuffer;
    const ivBuf = iv.slice().buffer as ArrayBuffer;
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ivBuf },
      encryptionKey,
      plaintextBuf,
    );
    const out = new Uint8Array(IV_BYTE_LENGTH + ciphertext.byteLength);
    out.set(iv, 0);
    out.set(new Uint8Array(ciphertext), IV_BYTE_LENGTH);
    return out;
  } catch {
    throw new EncryptionError(
      "claims_encryption_failed",
      "Failed to encrypt claims.",
    );
  }
}

/**
 * Decrypt an `IV || ciphertext` blob produced by {@link encryptClaims}.
 *
 * @throws {EncryptionError} with code `claims_decryption_failed` when the
 *   key is wrong, the blob is corrupted, or the plaintext is not a JSON
 *   object.
 */
export async function decryptClaims(
  encryptedBlob: Uint8Array,
  encryptionKey: CryptoKey,
): Promise<ClaimsPayload> {
  const iv = encryptedBlob.slice(0, IV_BYTE_LENGTH);
  const ciphertext = encryptedBlob.slice(IV_BYTE_LENGTH);
  const ivBuf = iv.slice().buffer as ArrayBuffer;
  const ciphertextBuf = ciphertext.slice().buffer as ArrayBuffer;
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuf },
      encryptionKey,
      ciphertextBuf,
    );
  } catch {
    throw new EncryptionError(
      "claims_decryption_failed",
      "The encryption key may not match or data is corrupted.",
    );
  }

  const decoded = new TextDecoder().decode(plaintext);
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new EncryptionError(
      "claims_decryption_failed",
      "Decrypted data is not valid JSON.",
    );
  }

  if (!isPlainObject(parsed)) {
    throw new EncryptionError(
      "claims_decryption_failed",
      "Decrypted data is not a JSON object.",
    );
  }
  return parsed as ClaimsPayload;
}
