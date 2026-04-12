import * as ed25519 from "@noble/ed25519";
import type { Asset, Category } from "@/lib/models/asset";
import type { PresentationToken } from "./token.model";

export const PRESENTATION_TTL_SECONDS = 60;

const CATEGORY_FACT_MAP: Record<Category, string> = {
  tickets: "valid_ticket",
  insurance: "active_insurance",
  esims: "active_esim",
  money_rwa: "balance_holder",
};

export function getDefaultFact(asset: Asset): string {
  const override = asset.metadata.presentation_fact;
  if (typeof override === "string" && override.length > 0) {
    return override;
  }
  return CATEGORY_FACT_MAP[asset.category];
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}

export async function generatePresentationToken(
  credentialId: string,
  presenterAddress: string,
  fact: string,
  privateKey: Uint8Array,
): Promise<PresentationToken> {
  const nonce = crypto.randomUUID();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + PRESENTATION_TTL_SECONDS;

  const unsignedPayload = {
    credential_id: credentialId,
    expires_at: expiresAt,
    fact,
    issued_at: issuedAt,
    nonce,
    presenter: presenterAddress,
  };
  const json = JSON.stringify(unsignedPayload);
  const message = new TextEncoder().encode(json);
  const signatureBytes = await ed25519.signAsync(message, privateKey);
  const signature = toHex(signatureBytes);

  return {
    credential_id: credentialId,
    presenter: presenterAddress,
    fact,
    nonce,
    issued_at: issuedAt,
    expires_at: expiresAt,
    signature,
  };
}

export function serializeToken(token: PresentationToken): string {
  return JSON.stringify(token);
}
