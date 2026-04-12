/**
 * Type definitions for commitment hashes.
 *
 * A commitment is a 32-byte SHA-256 digest of the AES-GCM encrypted claims
 * blob. It binds the off-chain encrypted payload to the on-chain credential
 * (stored as the XRPL NFT URI) without leaking any claim content.
 */

export interface Commitment {
  /** 32-byte SHA-256 digest of the encrypted claims blob. */
  hash: Uint8Array;
  /** Lowercase 64-character hex representation of {@link hash}. */
  hex: string;
}
