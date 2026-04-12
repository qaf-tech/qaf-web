import { describe, expect, test } from "bun:test";
import { decryptClaims, encryptClaims } from "./encryption";
import { EncryptionError } from "./encryption.model";

async function makeKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

describe("encryptClaims / decryptClaims", () => {
  test("encryptClaims returns IV + ciphertext longer than 12 bytes", async () => {
    const key = await makeKey();
    const blob = await encryptClaims({ over_18: true }, key);
    expect(blob.length).toBeGreaterThan(12);
  });

  test("encryptClaims produces different output each call (random IV)", async () => {
    const key = await makeKey();
    const a = await encryptClaims({ over_18: true }, key);
    const b = await encryptClaims({ over_18: true }, key);
    expect(a.length).toBe(b.length);
    const equal = a.every((byte, i) => byte === b[i]);
    expect(equal).toBe(false);
  });

  test("round-trip preserves boolean claim values", async () => {
    const key = await makeKey();
    const claims = { over_18: true, sanctions_clear: false };
    const roundtripped = await decryptClaims(
      await encryptClaims(claims, key),
      key,
    );
    expect(roundtripped.over_18).toBe(true);
    expect(roundtripped.sanctions_clear).toBe(false);
  });

  test("round-trip preserves string claim values", async () => {
    const key = await makeKey();
    const claims = { country: "FR", nationality: "French" };
    const roundtripped = await decryptClaims(
      await encryptClaims(claims, key),
      key,
    );
    expect(roundtripped.country).toBe("FR");
    expect(roundtripped.nationality).toBe("French");
  });

  test("decryptClaims throws claims_decryption_failed on wrong key", async () => {
    const keyA = await makeKey();
    const keyB = await makeKey();
    const blob = await encryptClaims({ over_18: true }, keyA);
    try {
      await decryptClaims(blob, keyB);
      throw new Error("expected decryptClaims to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(EncryptionError);
      expect((err as EncryptionError).code).toBe("claims_decryption_failed");
    }
  });

  test("decryptClaims throws claims_decryption_failed on corrupted blob", async () => {
    const key = await makeKey();
    const blob = await encryptClaims({ over_18: true }, key);
    const truncated = blob.slice(0, blob.length - 4);
    try {
      await decryptClaims(truncated, key);
      throw new Error("expected decryptClaims to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(EncryptionError);
      expect((err as EncryptionError).code).toBe("claims_decryption_failed");
    }
  });
});
