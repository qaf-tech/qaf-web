import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type {
  Claim,
  VerificationStep,
} from "./VerificationStatus.model";

const PARTIAL_STEPS: VerificationStep[] = [
  { id: "front", label: "Upload front of ID", status: "complete" },
  { id: "back", label: "Upload back of ID", status: "in_progress" },
  { id: "selfie", label: "Take selfie", status: "pending" },
  { id: "verify", label: "Verifying identity", status: "pending" },
];

const ALL_COMPLETE_STEPS: VerificationStep[] = PARTIAL_STEPS.map((s) => ({
  ...s,
  status: "complete",
}));

const CLAIMS: Claim[] = [
  { key: "over_18", value: true },
  { key: "country", value: "FR" },
];

describe("VerificationStatus", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders all step labels", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    render(<VerificationStatus steps={PARTIAL_STEPS} />);
    for (const step of PARTIAL_STEPS) {
      expect(screen.getByText(step.label)).toBeTruthy();
    }
  });

  test("applies status-specific icon class for each step", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    const { container } = render(<VerificationStatus steps={PARTIAL_STEPS} />);
    expect(container.querySelector("[class*='iconComplete']")).toBeTruthy();
    expect(container.querySelector("[class*='iconInProgress']")).toBeTruthy();
    expect(container.querySelector("[class*='iconPending']")).toBeTruthy();
  });

  test("applies iconError class for error-status steps", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    const { container } = render(
      <VerificationStatus
        steps={[
          { id: "x", label: "Failed step", status: "error" },
        ]}
      />,
    );
    expect(container.querySelector("[class*='iconError']")).toBeTruthy();
  });

  test("does not render claims when not all steps are complete", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    const { container } = render(
      <VerificationStatus steps={PARTIAL_STEPS} claims={CLAIMS} />,
    );
    expect(container.querySelector("[class*='claimsContainer']")).toBeNull();
  });

  test("renders ClaimBadge components when all steps complete and claims provided", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    render(
      <VerificationStatus steps={ALL_COMPLETE_STEPS} claims={CLAIMS} />,
    );
    expect(screen.getByText("Over 18")).toBeTruthy();
    expect(screen.getByText("Country: FR")).toBeTruthy();
  });

  test("step list has role=list", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    render(<VerificationStatus steps={PARTIAL_STEPS} />);
    expect(screen.getByRole("list")).toBeTruthy();
  });

  test("each step has role=listitem", async () => {
    const { VerificationStatus } = await import("./VerificationStatus");
    render(<VerificationStatus steps={PARTIAL_STEPS} />);
    expect(screen.getAllByRole("listitem").length).toBe(PARTIAL_STEPS.length);
  });
});
