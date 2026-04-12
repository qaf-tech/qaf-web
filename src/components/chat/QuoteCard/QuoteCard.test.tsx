import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { QuoteData } from "@/lib/models/chat";
import { QuoteCard } from "./QuoteCard";

function makeQuote(overrides: Partial<QuoteData> = {}): QuoteData {
  return {
    merchantId: "m-acme",
    merchantName: "Acme",
    merchantUrl: "https://acme.test",
    productName: "Premium Widget",
    productDescription: "A thoroughly premium widget.",
    priceDrops: 15_000_000,
    currency: "RLUSD",
    features: ["Fast", "Secure", "Eco", "Trusted"],
    identityFactsRequired: ["age_over_18"],
    rating: 4.6,
    validUntil: "2026-04-13T00:00:00Z",
    score: 0.92,
    ...overrides,
  };
}

describe("QuoteCard", () => {
  test("renders merchant name as heading", () => {
    const onSelect = mock(() => {});
    render(<QuoteCard quote={makeQuote()} onSelect={onSelect} />);
    expect(screen.getByRole("heading", { name: "Acme" })).toBeDefined();
  });

  test("converts price from drops to RLUSD", () => {
    const onSelect = mock(() => {});
    render(<QuoteCard quote={makeQuote()} onSelect={onSelect} />);
    expect(screen.getByText("15.00 RLUSD")).toBeDefined();
  });

  test("shows +N more when features exceed 4", () => {
    const onSelect = mock(() => {});
    render(
      <QuoteCard
        quote={makeQuote({ features: ["a", "b", "c", "d", "e", "f"] })}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("+2 more")).toBeDefined();
  });

  test("renders all features when 4 or fewer", () => {
    const onSelect = mock(() => {});
    render(
      <QuoteCard
        quote={makeQuote({ features: ["a", "b"] })}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("a")).toBeDefined();
    expect(screen.getByText("b")).toBeDefined();
    expect(screen.queryByText(/more/)).toBeNull();
  });

  test("calls onSelect with quote data when select button is clicked", () => {
    const onSelect = mock((_q: QuoteData) => {});
    const quote = makeQuote();
    render(<QuoteCard quote={quote} onSelect={onSelect} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Select quote from Acme/,
      }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toEqual(quote);
  });

  test("has role='article' and descriptive aria-label", () => {
    const onSelect = mock(() => {});
    render(<QuoteCard quote={makeQuote()} onSelect={onSelect} />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe(
      "Quote from Acme for 15.00 RLUSD",
    );
  });
});
