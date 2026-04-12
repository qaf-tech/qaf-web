import { describe, expect, test } from "bun:test";
import type { Notification, NotificationType } from "./notification";

describe("Notification model", () => {
  test("accepts a transaction_confirmed notification", () => {
    const n: Notification = {
      id: "n-1",
      type: "transaction_confirmed",
      title: "Payment confirmed",
      body: "You sent 20 RLUSD",
      tier: 1,
      read: false,
      createdAt: "2026-04-12T10:00:00Z",
      payload: { hash: "ABCD", amount: 20 },
    };
    expect(n.type).toBe("transaction_confirmed");
    expect(n.tier).toBe(1);
  });

  test("accepts a purchase_complete notification", () => {
    const n: Notification = {
      id: "n-2",
      type: "purchase_complete",
      title: "Ticket purchased",
      body: "Concert ticket added to wallet",
      tier: 1,
      read: true,
      createdAt: "2026-04-12T10:00:00Z",
      payload: {},
    };
    expect(n.type).toBe("purchase_complete");
  });

  test("accepts a credential_expiring notification with tier 2", () => {
    const n: Notification = {
      id: "n-3",
      type: "credential_expiring",
      title: "Credential expiring soon",
      body: "Expires in 15 days",
      tier: 2,
      read: false,
      createdAt: "2026-04-12T10:00:00Z",
      payload: { days: 15 },
    };
    expect(n.tier).toBe(2);
  });

  test("accepts an access_alert with tier 3", () => {
    const n: Notification = {
      id: "n-4",
      type: "access_alert",
      title: "Unknown accessor",
      body: "Unverified party viewed your passport number",
      tier: 3,
      read: false,
      createdAt: "2026-04-12T10:00:00Z",
      payload: { accessor: "unknown" },
    };
    expect(n.tier).toBe(3);
  });

  test("tier accepts all valid values 0, 1, 2, 3", () => {
    const tiers: Notification["tier"][] = [0, 1, 2, 3];
    expect(tiers).toHaveLength(4);
  });

  test("NotificationType accepts all four variants", () => {
    const types: NotificationType[] = [
      "transaction_confirmed",
      "purchase_complete",
      "credential_expiring",
      "access_alert",
    ];
    expect(types).toHaveLength(4);
  });
});
