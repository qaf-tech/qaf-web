import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "./TypingIndicator";

describe("TypingIndicator", () => {
  test("renders status text", () => {
    render(<TypingIndicator statusText="Thinking..." />);
    expect(screen.getByText("Thinking...")).toBeDefined();
  });

  test("has role='status'", () => {
    render(<TypingIndicator statusText="Working" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  test("aria-label matches statusText prop", () => {
    render(<TypingIndicator statusText="Parsing request" />);
    expect(screen.getByLabelText("Parsing request")).toBeDefined();
  });

  test("renders three animated dots", () => {
    const { container } = render(<TypingIndicator statusText="Loading" />);
    const dots = container.querySelectorAll("[class*='dot']");
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });
});
