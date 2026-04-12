import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

describe("ClaimBadge", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders 'Over 18' for over_18 true", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(<ClaimBadge claim={{ key: "over_18", value: true }} verified />);
    expect(screen.getByText("Over 18")).toBeTruthy();
  });

  test("renders 'Country: FR' for country FR", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(<ClaimBadge claim={{ key: "country", value: "FR" }} verified />);
    expect(screen.getByText("Country: FR")).toBeTruthy();
  });

  test("renders 'Sanctions Clear' for sanctions_clear true", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(
      <ClaimBadge claim={{ key: "sanctions_clear", value: true }} verified />,
    );
    expect(screen.getByText("Sanctions Clear")).toBeTruthy();
  });

  test("renders 'Nationality: French' for nationality French", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(
      <ClaimBadge claim={{ key: "nationality", value: "French" }} verified />,
    );
    expect(screen.getByText("Nationality: French")).toBeTruthy();
  });

  test("renders 'Document: passport' for document_type passport", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(
      <ClaimBadge
        claim={{ key: "document_type", value: "passport" }}
        verified
      />,
    );
    expect(screen.getByText("Document: passport")).toBeTruthy();
  });

  test("applies the verified class when verified is true", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    const { container } = render(
      <ClaimBadge claim={{ key: "over_18", value: true }} verified />,
    );
    const span = container.querySelector("span[role='status']");
    expect(span?.className.includes("verified")).toBe(true);
  });

  test("applies the unverified class when verified is false", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    const { container } = render(
      <ClaimBadge claim={{ key: "over_18", value: true }} verified={false} />,
    );
    const span = container.querySelector("span[role='status']");
    expect(span?.className.includes("unverified")).toBe(true);
  });

  test("has role=status", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(<ClaimBadge claim={{ key: "over_18", value: true }} verified />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  test("aria-label contains 'Verified:' when verified", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(<ClaimBadge claim={{ key: "over_18", value: true }} verified />);
    const element = screen.getByRole("status");
    expect(element.getAttribute("aria-label")).toContain("Verified:");
  });

  test("renders checkmark icon when verified", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(<ClaimBadge claim={{ key: "over_18", value: true }} verified />);
    expect(screen.getByTestId("claim-verified-icon")).toBeTruthy();
  });

  test("does not render checkmark icon when not verified", async () => {
    const { ClaimBadge } = await import("./ClaimBadge");
    render(
      <ClaimBadge claim={{ key: "over_18", value: true }} verified={false} />,
    );
    expect(screen.queryByTestId("claim-verified-icon")).toBeNull();
  });
});
