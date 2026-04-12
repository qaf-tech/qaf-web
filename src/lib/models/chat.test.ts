import { describe, expect, test } from "bun:test";
import type {
  BiometricStatus,
  ChatMessage,
  ChatMessageType,
  PurchaseCompleteData,
  PurchaseFlowState,
  PurchaseStepData,
  QuoteData,
} from "./chat";

describe("chat types", () => {
  test("ChatMessageType union accepts known literals", () => {
    const values: ChatMessageType[] = [
      "user_message",
      "agent_text",
      "agent_thinking",
      "agent_quotes",
      "purchase_confirmation",
      "purchase_status",
      "purchase_complete",
      "agent_error",
    ];
    expect(values.length).toBe(8);
  });

  test("QuoteData accepts a valid shape", () => {
    const quote: QuoteData = {
      merchantId: "m1",
      merchantName: "Acme",
      merchantUrl: "https://acme.test",
      productName: "Widget",
      productDescription: "A small widget.",
      priceDrops: 15_000_000,
      currency: "RLUSD",
      features: ["a", "b"],
      identityFactsRequired: ["age_over_18"],
      rating: 4.6,
      validUntil: "2026-04-12T00:00:00Z",
      score: 0.92,
    };
    expect(quote.priceDrops).toBe(15_000_000);
  });

  test("PurchaseStepData status values are constrained", () => {
    const step: PurchaseStepData = {
      id: "s1",
      label: "Paying",
      status: "in_progress",
      timestamp: 1,
    };
    expect(step.status).toBe("in_progress");
  });

  test("ChatMessage accepts all content variants", () => {
    const user: ChatMessage = {
      id: "1",
      type: "user_message",
      content: "hi",
      timestamp: 0,
      variant: "user",
    };
    const complete: PurchaseCompleteData = {
      txHash: "abc",
      nftTokenId: "42",
      merchantName: "Acme",
      productName: "Widget",
      message: "Done!",
    };
    const done: ChatMessage = {
      id: "2",
      type: "purchase_complete",
      content: complete,
      timestamp: 1,
      variant: "agent",
      isSuccess: true,
    };
    expect(user.variant).toBe("user");
    expect(done.variant).toBe("agent");
  });

  test("BiometricStatus and PurchaseFlowState unions expose expected values", () => {
    const b: BiometricStatus = "authenticating";
    const p: PurchaseFlowState = "confirming";
    expect(b).toBe("authenticating");
    expect(p).toBe("confirming");
  });
});
