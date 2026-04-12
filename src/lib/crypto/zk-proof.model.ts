/**
 * Type definitions for zero-knowledge proofs in the Boundless / RISC Zero
 * format.
 *
 * For the hackathon the `seal` is an HMAC-SHA256 over the serialized
 * `journal`. In production this field would hold a Groth16 proof produced
 * by a RISC Zero guest program whose identifier is carried in `image_id`.
 * Each proof attests to exactly ONE claim to structurally prevent
 * over-disclosure.
 */

export interface ZkProof {
  /** Identifier of the verification program (e.g. `"qaf-identity-v1"`). */
  image_id: string;
  /** Public outputs: serialized `{ key, value, commitment }` JSON. */
  journal: Uint8Array;
  /** Cryptographic seal over `journal` (HMAC in hackathon, Groth16 in prod). */
  seal: Uint8Array;
}

export interface ProofClaim {
  key: string;
  value: string | boolean;
  /** Hex commitment that binds the proof to a specific credential. */
  commitmentHash: string;
}

export type ZkProofErrorCode =
  | "proof_generation_failed"
  | "proof_verification_failed"
  | "journal_parse_failed";

export class ZkProofError extends Error {
  readonly code: ZkProofErrorCode;

  constructor(code: ZkProofErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ZkProofError";
  }
}
