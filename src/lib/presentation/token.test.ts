import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Asset, Category } from "@/lib/models/asset";
import {
  generatePresentationToken,
  getDefaultFact,
  PRESENTATION_TTL_SECONDS,
  serializeToken,
} from "./token";
import type { PresentationToken } from "./token.model";

function makeAsset(
  category: Category,
  metadata: Record<string, string> = {},
): Asset {
  return {
    id: "a1",
    title: "Test",
    issuer: "Issuer",
    category,
    description: "desc",
    expiresAt: null,
    issuedAt: "2026-01-01T00:00:00Z",
    tokenId: "t1",
    metadata,
    iconUrl: "",
  };
}

const originalRandomUUID = crypto.randomUUID;
const originalDateNow = Date.now;
const FIXED_UUID = "11111111-1111-4111-8111-111111111111";
const FIXED_NOW_MS = 1_700_000_000_000;
const FIXED_ISSUED_AT = Math.floor(FIXED_NOW_MS / 1000);

beforeEach(() => {
  Object.defineProperty(crypto, "randomUUID", {
    value: () => FIXED_UUID,
    configurable: true,
    writable: true,
  });
  Date.now = () => FIXED_NOW_MS;
});

afterEach(() => {
  Object.defineProperty(crypto, "randomUUID", {
    value: originalRandomUUID,
    configurable: true,
    writable: true,
  });
  Date.now = originalDateNow;
});

describe("getDefaultFact", () => {
  test("maps tickets to valid_ticket", () => {
    expect(getDefaultFact(makeAsset("tickets"))).toBe("valid_ticket");
  });

  test("maps insurance to active_insurance", () => {
    expect(getDefaultFact(makeAsset("insurance"))).toBe("active_insurance");
  });

  test("maps esims to active_esim", () => {
    expect(getDefaultFact(makeAsset("esims"))).toBe("active_esim");
  });

  test("maps money_rwa to balance_holder", () => {
    expect(getDefaultFact(makeAsset("money_rwa"))).toBe("balance_holder");
  });

  test("returns metadata override when presentation_fact is set", () => {
    expect(
      getDefaultFact(
        makeAsset("tickets", { presentation_fact: "custom_fact" }),
      ),
    ).toBe("custom_fact");
  });
});

describe("generatePresentationToken", () => {
  async function makeToken(): Promise<PresentationToken> {
    const privateKey = new Uint8Array(32);
    return generatePresentationToken(
      "cred-1",
      "rPresenter",
      "valid_ticket",
      privateKey,
    );
  }

  test("returns object with all required fields", async () => {
    const token = await makeToken();
    expect(token.credential_id).toBe("cred-1");
    expect(token.presenter).toBe("rPresenter");
    expect(token.fact).toBe("valid_ticket");
    expect(token.nonce).toBe(FIXED_UUID);
    expect(token.issued_at).toBe(FIXED_ISSUED_AT);
    expect(token.expires_at).toBe(FIXED_ISSUED_AT + PRESENTATION_TTL_SECONDS);
    expect(typeof token.signature).toBe("string");
  });

  test("nonce matches UUID v4 format", async () => {
    const token = await makeToken();
    expect(token.nonce).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  test("expires_at equals issued_at + 60", async () => {
    const token = await makeToken();
    expect(token.expires_at - token.issued_at).toBe(60);
  });

  test("signature is a 128-character hex string (64 bytes)", async () => {
    const token = await makeToken();
    expect(token.signature.length).toBe(128);
    expect(token.signature).toMatch(/^[0-9a-f]+$/);
  });
});

describe("serializeToken", () => {
  const sample: PresentationToken = {
    credential_id: "cred-1",
    presenter: "rPresenter",
    fact: "valid_ticket",
    nonce: FIXED_UUID,
    issued_at: FIXED_ISSUED_AT,
    expires_at: FIXED_ISSUED_AT + 60,
    signature: "a".repeat(128),
  };

  test("produces valid JSON that parses back to the original token", () => {
    const json = serializeToken(sample);
    expect(JSON.parse(json)).toEqual(sample);
  });

  test("output contains no whitespace", () => {
    const json = serializeToken(sample);
    expect(json).not.toMatch(/\s/);
  });
});
