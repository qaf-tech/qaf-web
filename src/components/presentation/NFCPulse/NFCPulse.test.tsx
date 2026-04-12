import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { NFCPulse } from "./NFCPulse";

describe("NFCPulse", () => {
  test("renders the NFC SVG icon", () => {
    const { container } = render(<NFCPulse isActive />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  test("renders the 'Hold near reader' label", () => {
    render(<NFCPulse isActive />);
    expect(screen.getByText("Hold near reader")).toBeDefined();
  });

  test("SVG has aria-hidden='true'", () => {
    const { container } = render(<NFCPulse isActive />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  test("container has role='status'", () => {
    render(<NFCPulse isActive />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  test("container has aria-label 'NFC tap-to-present available'", () => {
    render(<NFCPulse isActive />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).toBe(
      "NFC tap-to-present available",
    );
  });

  test("applies active class when isActive is true", () => {
    const { container } = render(<NFCPulse isActive />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("iconActive");
  });

  test("applies inactive class when isActive is false", () => {
    const { container } = render(<NFCPulse isActive={false} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("iconInactive");
  });
});
