import { describe, expect, test } from "bun:test";
import {
  decryptSeed,
  deriveEncryptionKey,
  deriveSeed,
  encryptSeed,
} from "./seed-derivation";
import { SeedDerivationError } from "./seed-derivation.model";

function randomPrfOutput(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

describe("deriveSeed", () => {
  test("returns a 16-byte Uint8Array", async () => {
    const seed = await deriveSeed(randomPrfOutput());
    expect(seed).toBeInstanceOf(Uint8Array);
    expect(seed.length).toBe(16);
  });

  test("is deterministic for the same PRF output", async () => {
    const prf = randomPrfOutput();
    const a = await deriveSeed(prf);
    const b = await deriveSeed(prf);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  test("produces different output for different PRF inputs", async () => {
    const a = await deriveSeed(randomPrfOutput());
    const b = await deriveSeed(randomPrfOutput());
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe("deriveEncryptionKey", () => {
  test("returns an AES-GCM CryptoKey with length 256", async () => {
    const key = await deriveEncryptionKey(randomPrfOutput());
    const algo = key.algorithm as { name: string; length?: number };
    expect(algo.name).toBe("AES-GCM");
    expect(algo.length).toBe(256);
  });
});

describe("encryptSeed / decryptSeed", () => {
  test("encryptSeed returns bytes longer than the IV", async () => {
    const prf = randomPrfOutput();
    const seed = await deriveSeed(prf);
    const key = await deriveEncryptionKey(prf);
    const blob = await encryptSeed(seed, key);
    expect(blob).toBeInstanceOf(Uint8Array);
    expect(blob.length).toBeGreaterThan(12);
  });

  test("encryptSeed generates a fresh random IV each call", async () => {
    const prf = randomPrfOutput();
    const seed = await deriveSeed(prf);
    const key = await deriveEncryptionKey(prf);
    const a = await encryptSeed(seed, key);
    const b = await encryptSeed(seed, key);
    expect(Array.from(a.slice(0, 12))).not.toEqual(Array.from(b.slice(0, 12)));
  });

  test("round-trips through encrypt -> decrypt", async () => {
    const prf = randomPrfOutput();
    const seed = await deriveSeed(prf);
    const key = await deriveEncryptionKey(prf);

    const blob = await encryptSeed(seed, key);
    const plain = await decryptSeed(blob, key);

    expect(Array.from(plain)).toEqual(Array.from(seed));
  });

  test("decryptSeed throws decryption_failed on a wrong key", async () => {
    const prf1 = randomPrfOutput();
    const prf2 = randomPrfOutput();
    const seed = await deriveSeed(prf1);
    const keyA = await deriveEncryptionKey(prf1);
    const keyB = await deriveEncryptionKey(prf2);

    const blob = await encryptSeed(seed, keyA);

    await expect(decryptSeed(blob, keyB)).rejects.toBeInstanceOf(
      SeedDerivationError,
    );
    await expect(decryptSeed(blob, keyB)).rejects.toMatchObject({
      code: "decryption_failed",
    });
  });

  test("decryptSeed throws decryption_failed on corrupted data", async () => {
    const prf = randomPrfOutput();
    const seed = await deriveSeed(prf);
    const key = await deriveEncryptionKey(prf);
    const blob = await encryptSeed(seed, key);

    const corrupted = new Uint8Array(blob);
    corrupted[corrupted.length - 1] ^= 0xff;

    await expect(decryptSeed(corrupted, key)).rejects.toBeInstanceOf(
      SeedDerivationError,
    );
    await expect(decryptSeed(corrupted, key)).rejects.toMatchObject({
      code: "decryption_failed",
    });
  });
});
