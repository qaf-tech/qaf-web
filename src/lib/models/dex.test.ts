import { describe, expect, test } from "bun:test";
import type {
  PriceEstimate,
  SellOffer,
  SellStep,
  TransferResult,
  TransferStep,
  UserLookupResult,
} from "./dex";

describe("DEX models", () => {
  test("SellStep accepts all valid step values", () => {
    const values: SellStep[] = [
      "estimate",
      "authenticate",
      "submitting",
      "waiting",
      "success",
      "error",
    ];
    expect(values).toHaveLength(6);
  });

  test("TransferStep accepts all valid step values", () => {
    const values: TransferStep[] = [
      "recipient",
      "authenticate",
      "submitting",
      "success",
      "error",
    ];
    expect(values).toHaveLength(5);
  });

  test("SellOffer accepts valid offer objects", () => {
    const offer: SellOffer = {
      offerIndex: "offer-abc",
      txHash: "HASH1",
      amount: "96.00",
      assetType: "nft",
    };
    expect(offer.assetType).toBe("nft");
  });

  test("SellOffer accepts iou asset type", () => {
    const offer: SellOffer = {
      offerIndex: "offer-xyz",
      txHash: "HASH2",
      amount: "100",
      assetType: "iou",
    };
    expect(offer.assetType).toBe("iou");
  });

  test("TransferResult accepts valid result objects", () => {
    const result: TransferResult = {
      txHash: "TXHASH",
      offerIndex: "OI",
      recipientAddress: "rFriend...",
    };
    expect(result.recipientAddress).toBe("rFriend...");
  });

  test("UserLookupResult accepts valid lookup results", () => {
    const result: UserLookupResult = {
      username: "alice",
      xrplAddress: "rAlice...",
    };
    expect(result.username).toBe("alice");
  });

  test("PriceEstimate currency is always RLUSD", () => {
    const estimate: PriceEstimate = {
      estimatedPrice: 96.0,
      currency: "RLUSD",
    };
    expect(estimate.currency).toBe("RLUSD");
  });
});
