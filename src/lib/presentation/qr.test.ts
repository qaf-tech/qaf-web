import { beforeEach, describe, expect, mock, test } from "bun:test";

const toDataURLMock = mock(async (_data: string): Promise<string> => {
  return "data:image/png;base64,AAAA";
});

mock.module("qrcode", () => ({
  default: { toDataURL: toDataURLMock },
}));

beforeEach(() => {
  toDataURLMock.mockClear();
  toDataURLMock.mockImplementation(
    async (_data: string) => "data:image/png;base64,AAAA",
  );
});

async function loadSubject() {
  const mod = await import("./qr");
  return mod;
}

describe("generateQRDataUrl", () => {
  test("returns data URL prefixed with data:image/png;base64,", async () => {
    const { generateQRDataUrl } = await loadSubject();
    const url = await generateQRDataUrl(JSON.stringify({ a: 1 }));
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
  });

  test("accepts a typical presentation token JSON (~400 bytes)", async () => {
    const { generateQRDataUrl } = await loadSubject();
    const payload = JSON.stringify({
      credential_id: "cred-1",
      presenter: "rPresenter",
      fact: "valid_ticket",
      nonce: "11111111-1111-4111-8111-111111111111",
      issued_at: 1_700_000_000,
      expires_at: 1_700_000_060,
      signature: "a".repeat(128),
    });
    expect(payload.length).toBeGreaterThan(200);
    const url = await generateQRDataUrl(payload);
    expect(url).toContain("base64,");
  });

  test("throws qr_data_too_large on capacity overflow", async () => {
    toDataURLMock.mockImplementation(async (_data: string) => {
      throw new Error("The amount of data is too big to be stored");
    });
    const { generateQRDataUrl } = await loadSubject();
    try {
      await generateQRDataUrl("x".repeat(100_000));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toMatchObject({ code: "qr_data_too_large" });
    }
  });
});
