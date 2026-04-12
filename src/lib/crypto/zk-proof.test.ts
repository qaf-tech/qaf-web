import { describe, expect, test } from "bun:test";
import { commitmentToHex, generateCommitment } from "./commitment";
import {
  deriveProofSigningKey,
  extractClaimFromJournal,
  generateProof,
  verifyProof,
} from "./zk-proof";
import { ZkProofError } from "./zk-proof.model";

async function testContext() {
  const prfOutput = crypto.getRandomValues(new Uint8Array(32));
  const signingKey = await deriveProofSigningKey(prfOutput);
  const commitment = await generateCommitment(new Uint8Array([7, 8, 9]));
  return { signingKey, commitment };
}

describe("zk-proof", () => {
  test("deriveProofSigningKey returns an HMAC CryptoKey", async () => {
    const prfOutput = crypto.getRandomValues(new Uint8Array(32));
    const key = await deriveProofSigningKey(prfOutput);
    expect(key.algorithm.name).toBe("HMAC");
  });

  test("generateProof sets image_id to qaf-identity-v1", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    expect(proof.image_id).toBe("qaf-identity-v1");
  });

  test("generateProof journal is non-empty and seal is 32 bytes", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    expect(proof.journal.length).toBeGreaterThan(0);
    expect(proof.seal.length).toBe(32);
  });

  test("extractClaimFromJournal round-trips key, value, and commitment", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "country", value: "FR" },
      commitment,
      signingKey,
    );
    const claim = extractClaimFromJournal(proof.journal);
    expect(claim.key).toBe("country");
    expect(claim.value).toBe("FR");
    expect(claim.commitmentHash).toBe(commitmentToHex(commitment));
  });

  test("verifyProof returns true for a well-formed proof", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    expect(await verifyProof(proof, "qaf-identity-v1")).toBe(true);
  });

  test("verifyProof returns false when image_id does not match", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    expect(await verifyProof(proof, "something-else")).toBe(false);
  });

  test("verifyProof returns false when journal is empty", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    proof.journal = new Uint8Array(0);
    expect(await verifyProof(proof, "qaf-identity-v1")).toBe(false);
  });

  test("verifyProof returns false when seal is empty", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    proof.seal = new Uint8Array(0);
    expect(await verifyProof(proof, "qaf-identity-v1")).toBe(false);
  });

  test("extractClaimFromJournal throws journal_parse_failed on garbage", () => {
    const garbage = new Uint8Array([0xff, 0xff, 0xff]);
    try {
      extractClaimFromJournal(garbage);
      throw new Error("expected extractClaimFromJournal to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ZkProofError);
      expect((err as ZkProofError).code).toBe("journal_parse_failed");
    }
  });

  test("journal contains exactly one claim (single key, value, commitment)", async () => {
    const { signingKey, commitment } = await testContext();
    const proof = await generateProof(
      { key: "over_18", value: true },
      commitment,
      signingKey,
    );
    const decoded = new TextDecoder().decode(proof.journal);
    const parsed = JSON.parse(decoded);
    expect(Object.keys(parsed).sort()).toEqual(["commitment", "key", "value"]);
  });
});
