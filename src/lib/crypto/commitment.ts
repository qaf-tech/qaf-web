/**
 * SHA-256 commitment helpers.
 *
 * The commitment is hashed over the already-encrypted blob, not the
 * plaintext — so possession of the commitment alone reveals nothing
 * about the claim contents. The hex form is what lands on XRPL as the
 * NFT URI and Memo.
 */

import type { Commitment } from "./commitment.model";

export async function generateCommitment(
  encryptedBlob: Uint8Array,
): Promise<Uint8Array> {
  const buf = encryptedBlob.slice().buffer as ArrayBuffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return new Uint8Array(hashBuffer);
}

export function commitmentToHex(commitment: Uint8Array): string {
  return Array.from(commitment)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createCommitment(
  encryptedBlob: Uint8Array,
): Promise<Commitment> {
  const hash = await generateCommitment(encryptedBlob);
  return { hash, hex: commitmentToHex(hash) };
}
