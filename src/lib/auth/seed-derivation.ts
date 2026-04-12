/**
 * Seed derivation and AES-GCM sealed-box helpers for qaf-web.
 *
 * Pipeline:
 *   1. PRF output (32 B)          -> HKDF-SHA256 -> 16-byte XRPL seed
 *   2. PRF output (32 B)          -> HKDF-SHA256 -> 32-byte AES-GCM CryptoKey
 *   3. AES-GCM(key, random IV, seed) = IV || ciphertext || auth-tag
 *
 * The server never holds plaintext: only the passkey owner can re-evaluate
 * the PRF and recover the seed.
 *
 * Implementation notes:
 *   - HKDF uses an empty salt (per spec) — entropy comes from the PRF.
 *   - `info` strings (`qaf-xrpl-seed-v1`, `qaf-seed-encryption-v1`) provide
 *     domain separation between the two HKDF outputs.
 *   - Only Web Crypto is used — no third-party crypto dependencies.
 */

import { SeedDerivationError } from "./seed-derivation.model";

const SEED_INFO = "qaf-xrpl-seed-v1";
const ENCRYPTION_KEY_INFO = "qaf-seed-encryption-v1";
const SEED_BIT_LENGTH = 128;
const AES_KEY_BIT_LENGTH = 256;
const IV_BYTE_LENGTH = 12;

const ENC = new TextEncoder();

/** Import PRF output as a non-extractable HKDF base key. */
async function importHkdfKey(prfOutput: Uint8Array): Promise<CryptoKey> {
  const keyBytes = prfOutput.slice().buffer as ArrayBuffer;
  return crypto.subtle.importKey("raw", keyBytes, "HKDF", false, [
    "deriveBits",
    "deriveKey",
  ]);
}

/**
 * Derive the 16-byte XRPL seed from the PRF output.
 *
 * @throws {SeedDerivationError} with code `derivation_failed` on any failure.
 */
export async function deriveSeed(prfOutput: Uint8Array): Promise<Uint8Array> {
  try {
    const hkdfKey = await importHkdfKey(prfOutput);
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(0),
        info: ENC.encode(SEED_INFO),
      },
      hkdfKey,
      SEED_BIT_LENGTH,
    );
    return new Uint8Array(derivedBits);
  } catch (_err) {
    throw new SeedDerivationError(
      "derivation_failed",
      "Failed to derive XRPL seed from PRF output.",
    );
  }
}

/**
 * Derive a non-extractable AES-GCM CryptoKey from the PRF output.
 *
 * Deterministic for a given PRF output: the same passkey always produces the
 * same key, so sealed seeds can be round-tripped after re-authentication.
 */
export async function deriveEncryptionKey(
  prfOutput: Uint8Array,
): Promise<CryptoKey> {
  const hkdfKey = await importHkdfKey(prfOutput);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: ENC.encode(ENCRYPTION_KEY_INFO),
    },
    hkdfKey,
    { name: "AES-GCM", length: AES_KEY_BIT_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt the XRPL seed under the AES-GCM key.
 *
 * The returned blob is `IV || ciphertext || auth-tag` and can be stored or
 * transmitted as a single opaque byte string.
 */
export async function encryptSeed(
  seed: Uint8Array,
  encryptionKey: CryptoKey,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const seedBuffer = seed.slice().buffer as ArrayBuffer;
  const ivBuffer = iv.slice().buffer as ArrayBuffer;
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ivBuffer },
      encryptionKey,
      seedBuffer,
    ),
  );
  const out = new Uint8Array(iv.length + ciphertext.length);
  out.set(iv, 0);
  out.set(ciphertext, iv.length);
  return out;
}

/**
 * Decrypt a sealed seed.
 *
 * @throws {SeedDerivationError} with code `decryption_failed` when the key
 *   does not match or the blob is corrupt.
 */
export async function decryptSeed(
  encryptedBlob: Uint8Array,
  encryptionKey: CryptoKey,
): Promise<Uint8Array> {
  try {
    const iv = encryptedBlob.slice(0, IV_BYTE_LENGTH);
    const ciphertext = encryptedBlob.slice(IV_BYTE_LENGTH);
    const ivBuffer = iv.slice().buffer as ArrayBuffer;
    const ctBuffer = ciphertext.slice().buffer as ArrayBuffer;
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      encryptionKey,
      ctBuffer,
    );
    return new Uint8Array(plaintext);
  } catch (_err) {
    throw new SeedDerivationError(
      "decryption_failed",
      "The passkey may not match the original wallet.",
    );
  }
}
