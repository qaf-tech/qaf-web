import { describe, expect, test } from "bun:test";
import type { AccessLogEntry } from "./accessLog";

describe("AccessLogEntry model", () => {
  test("accepts a valid non-revoked entry", () => {
    const entry: AccessLogEntry = {
      id: "al-1",
      accessorName: "Acme Airline",
      credentialName: "Passport",
      factDisclosed: "passport number",
      accessedAt: "2026-04-12T10:00:00Z",
      expiresAt: "2026-05-12T10:00:00Z",
      revoked: false,
    };
    expect(entry.revoked).toBe(false);
    expect(entry.accessorName).toBe("Acme Airline");
  });

  test("accepts a revoked entry", () => {
    const entry: AccessLogEntry = {
      id: "al-2",
      accessorName: "Insurance Co",
      credentialName: "Medical Record",
      factDisclosed: "date of birth",
      accessedAt: "2026-04-12T10:00:00Z",
      expiresAt: null,
      revoked: true,
    };
    expect(entry.revoked).toBe(true);
  });

  test("accepts expiresAt as null", () => {
    const entry: AccessLogEntry = {
      id: "al-3",
      accessorName: "Bank of Example",
      credentialName: "KYC",
      factDisclosed: "full name",
      accessedAt: "2026-04-12T10:00:00Z",
      expiresAt: null,
      revoked: false,
    };
    expect(entry.expiresAt).toBeNull();
  });
});
