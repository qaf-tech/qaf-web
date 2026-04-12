import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QRPresentation } from "./QRPresentation";

describe("QRPresentation", () => {
  test("renders img element when qrDataUrl is provided", () => {
    render(
      <QRPresentation
        qrDataUrl="data:image/png;base64,AA"
        credentialTitle="Ticket"
        fact="valid_ticket"
      />,
    );
    const img = screen.getByAltText("Presentation QR code for Ticket");
    expect(img.tagName).toBe("IMG");
  });

  test("sets correct alt text on the image", () => {
    render(
      <QRPresentation
        qrDataUrl="data:image/png;base64,AA"
        credentialTitle="My Pass"
        fact="valid_ticket"
      />,
    );
    expect(
      screen.getByAltText("Presentation QR code for My Pass"),
    ).toBeDefined();
  });

  test("renders skeleton when qrDataUrl is null", () => {
    const { container } = render(
      <QRPresentation
        qrDataUrl={null}
        credentialTitle="Ticket"
        fact="valid_ticket"
      />,
    );
    expect(container.querySelector("[class*='skeleton']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  test("container has role='img'", () => {
    render(
      <QRPresentation
        qrDataUrl="data:image/png;base64,AA"
        credentialTitle="Ticket"
        fact="valid_ticket"
      />,
    );
    expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(1);
  });

  test("container has correct aria-label", () => {
    render(
      <QRPresentation
        qrDataUrl="data:image/png;base64,AA"
        credentialTitle="Ticket"
        fact="active_insurance"
      />,
    );
    const imgs = screen.getAllByRole("img");
    const container = imgs.find((el) =>
      el.getAttribute("aria-label")?.startsWith("Scan this QR code"),
    );
    expect(container?.getAttribute("aria-label")).toBe(
      "Scan this QR code to verify active_insurance",
    );
  });
});
