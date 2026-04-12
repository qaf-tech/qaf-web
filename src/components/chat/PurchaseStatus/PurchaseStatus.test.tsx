import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { PurchaseStepData } from "@/lib/models/chat";
import { PurchaseStatus } from "./PurchaseStatus";

function makeStep(overrides: Partial<PurchaseStepData> = {}): PurchaseStepData {
  return {
    id: "step-1",
    label: "Verifying identity",
    status: "pending",
    timestamp: 0,
    ...overrides,
  };
}

describe("PurchaseStatus", () => {
  test("renders all provided steps", () => {
    render(
      <PurchaseStatus
        steps={[
          makeStep({ id: "1", label: "Step one" }),
          makeStep({ id: "2", label: "Step two" }),
          makeStep({ id: "3", label: "Step three" }),
        ]}
      />,
    );
    expect(screen.getByText("Step one")).toBeDefined();
    expect(screen.getByText("Step two")).toBeDefined();
    expect(screen.getByText("Step three")).toBeDefined();
  });

  test("completed steps render with completed icon class", () => {
    const { container } = render(
      <PurchaseStatus steps={[makeStep({ id: "1", status: "completed" })]} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("iconCompleted");
  });

  test("in_progress steps render with spinner icon class", () => {
    const { container } = render(
      <PurchaseStatus steps={[makeStep({ id: "1", status: "in_progress" })]} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("iconInProgress");
  });

  test("failed steps render with error icon class", () => {
    const { container } = render(
      <PurchaseStatus steps={[makeStep({ id: "1", status: "failed" })]} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("iconFailed");
  });

  test("has role='status' and aria-live='polite'", () => {
    render(<PurchaseStatus steps={[makeStep()]} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  test("renders optional detail text", () => {
    render(
      <PurchaseStatus
        steps={[makeStep({ detail: "Processing payment..." })]}
      />,
    );
    expect(screen.getByText("Processing payment...")).toBeDefined();
  });
});
