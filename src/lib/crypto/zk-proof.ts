/**
 * ZK proof generation and verification stub in the Boundless / RISC Zero
 * envelope.
 *
 * The hackathon `seal` is an HMAC-SHA256 over the `journal` bytes. The
 * key is HKDF-derived from the passkey PRF output (`info` =
 * `"qaf-zk-proof-signing-v1"`) and is independent of the AES-GCM key that
 * encrypts claims, so compromising one does not compromise the other.
 *
 * Structural invariant: the journal serializes exactly ONE claim
 * (`{ key, value, commitment }`). The API exposes no batch form — a
 * merchant requiring multiple facts must request multiple independent
 * proofs.
 */

import { commitmentToHex } from "./commitment";
import {
  type ProofClaim,
  type ZkProof,
  ZkProofError,
} from "./zk-proof.model";

const HKDF_INFO = "qaf-zk-proof-signing-v1";
const IMAGE_ID = "qaf-identity-v1";

const ENC = new TextEncoder();
const DEC = new TextDecoder();

export async function deriveProofSigningKey(
  prfOutput: Uint8Array,
): Promise<CryptoKey> {
  const keyBytes = prfOutput.slice().buffer as ArrayBuffer;
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: ENC.encode(HKDF_INFO),
    },
    hkdfKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function generateProof(
  claim: { key: string; value: string | boolean },
  commitmentHash: Uint8Array,
  signingKey: CryptoKey,
): Promise<ZkProof> {
  try {
    const journalObj = {
      key: claim.key,
      value: claim.value,
      commitment: commitmentToHex(commitmentHash),
    };
    const journal = ENC.encode(JSON.stringify(journalObj));
    const journalBuf = journal.slice().buffer as ArrayBuffer;
    const sealBuffer = await crypto.subtle.sign("HMAC", signingKey, journalBuf);
    return {
      image_id: IMAGE_ID,
      journal,
      seal: new Uint8Array(sealBuffer),
    };
  } catch {
    throw new ZkProofError(
      "proof_generation_failed",
      "Failed to generate ZK proof.",
    );
  }
}

export async function verifyProof(
  proof: ZkProof,
  expectedImageId: string,
): Promise<boolean> {
  if (proof.image_id !== expectedImageId) return false;
  if (proof.journal.length === 0) return false;
  if (proof.seal.length === 0) return false;
  try {
    extractClaimFromJournal(proof.journal);
  } catch {
    return false;
  }
  return true;
}

export function extractClaimFromJournal(journal: Uint8Array): ProofClaim {
  let parsed: unknown;
  try {
    parsed = JSON.parse(DEC.decode(journal));
  } catch {
    throw new ZkProofError(
      "journal_parse_failed",
      "Cannot deserialize proof journal.",
    );
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new ZkProofError(
      "journal_parse_failed",
      "Cannot deserialize proof journal.",
    );
  }
  const obj = parsed as Record<string, unknown>;
  const key = obj.key;
  const value = obj.value;
  const commitment = obj.commitment;
  if (typeof key !== "string" || key.length === 0) {
    throw new ZkProofError(
      "journal_parse_failed",
      "Cannot deserialize proof journal.",
    );
  }
  if (typeof value !== "string" && typeof value !== "boolean") {
    throw new ZkProofError(
      "journal_parse_failed",
      "Cannot deserialize proof journal.",
    );
  }
  if (typeof commitment !== "string" || commitment.length === 0) {
    throw new ZkProofError(
      "journal_parse_failed",
      "Cannot deserialize proof journal.",
    );
  }
  return { key, value, commitmentHash: commitment };
}
