import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { PresentationTimer } from "./PresentationTimer";

const originalDateNow = Date.now;

beforeEach(() => {
  Date.now = () => 1_700_000_000_000;
});

afterEach(() => {
  Date.now = originalDateNow;
});

describe("PresentationTimer", () => {
  test("renders remaining seconds in text", () => {
    const now = 1_700_000_000;
    render(
      <PresentationTimer expiresAt={now + 42} onExpired={mock(() => {})} />,
    );
    expect(screen.getByText("42")).toBeDefined();
  });

  test("applies normal color class when remaining > 10", () => {
    const now = 1_700_000_000;
    const { container } = render(
      <PresentationTimer expiresAt={now + 30} onExpired={mock(() => {})} />,
    );
    const progress = container.querySelectorAll("circle")[1];
    expect(progress?.getAttribute("class")).toContain("progressNormal");
  });

  test("applies warning color class when remaining <= 10", () => {
    const now = 1_700_000_000;
    const { container } = render(
      <PresentationTimer expiresAt={now + 8} onExpired={mock(() => {})} />,
    );
    const progress = container.querySelectorAll("circle")[1];
    expect(progress?.getAttribute("class")).toContain("progressWarning");
  });

  test("applies danger color class when remaining <= 5", () => {
    const now = 1_700_000_000;
    const { container } = render(
      <PresentationTimer expiresAt={now + 3} onExpired={mock(() => {})} />,
    );
    const progress = container.querySelectorAll("circle")[1];
    expect(progress?.getAttribute("class")).toContain("progressDanger");
  });

  test("container has role='timer'", () => {
    const now = 1_700_000_000;
    render(
      <PresentationTimer expiresAt={now + 10} onExpired={mock(() => {})} />,
    );
    expect(screen.getByRole("timer")).toBeDefined();
  });

  test("numeric element has aria-live='polite'", () => {
    const now = 1_700_000_000;
    const { container } = render(
      <PresentationTimer expiresAt={now + 10} onExpired={mock(() => {})} />,
    );
    const seconds = container.querySelector("text[aria-live='polite']");
    expect(seconds).not.toBeNull();
  });

  test("container aria-label includes remaining seconds", () => {
    const now = 1_700_000_000;
    render(
      <PresentationTimer expiresAt={now + 15} onExpired={mock(() => {})} />,
    );
    const timer = screen.getByRole("timer");
    expect(timer.getAttribute("aria-label")).toBe(
      "Presentation expires in 15 seconds",
    );
  });

  test(
    "calls onExpired when countdown reaches 0",
    async () => {
      const now = 1_700_000_000;
      const onExpired = mock(() => {});
      render(<PresentationTimer expiresAt={now} onExpired={onExpired} />);
      await new Promise((r) => setTimeout(r, 1100));
      expect(onExpired).toHaveBeenCalled();
    },
    { timeout: 3000 },
  );
});
