import { beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: () => () => undefined,
    send: () => undefined,
  }),
}));

type MediaDevicesMock = {
  getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>;
};

describe("RecipientInput", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: () =>
          Promise.reject(new Error("blocked")),
      } satisfies MediaDevicesMock,
      writable: true,
      configurable: true,
    });
  });

  test("renders three tabs", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByRole("tab", { name: "Scan QR" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Username" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Paste Address" })).toBeTruthy();
  });

  test("Scan QR tab is active by default", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    const scanTab = screen.getByRole("tab", { name: "Scan QR" });
    expect(scanTab.getAttribute("aria-selected")).toBe("true");
  });

  test("clicking Username tab switches panel", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Username" }));
    expect(
      screen.getByLabelText("Search by username"),
    ).toBeTruthy();
  });

  test("clicking Paste Address tab switches panel", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Paste Address" }));
    expect(screen.getByLabelText("XRPL address")).toBeTruthy();
  });

  test("tablist and tabs have correct roles", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  test("paste input accepts valid address", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Paste Address" }));
    fireEvent.change(screen.getByLabelText("XRPL address"), {
      target: { value: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" },
    });
    expect(
      screen.queryByText("Invalid XRPL address format"),
    ).toBeNull();
  });

  test("paste input shows error for invalid prefix", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Paste Address" }));
    fireEvent.change(screen.getByLabelText("XRPL address"), {
      target: { value: "xABCDEFG1234567890ABCDEFG" },
    });
    expect(screen.getByText("Invalid XRPL address format")).toBeTruthy();
  });

  test("paste input shows error for short address", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Paste Address" }));
    fireEvent.change(screen.getByLabelText("XRPL address"), {
      target: { value: "rTooShort" },
    });
    expect(screen.getByText("Invalid XRPL address format")).toBeTruthy();
  });

  test("Continue button is disabled when no address set", async () => {
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={() => undefined}
        onCancel={() => undefined}
      />,
    );
    const btn = screen.getByRole("button", { name: "Continue" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  test("Continue button calls onRecipientSelected with valid address", async () => {
    const onSelect = mock((_a: string) => undefined);
    const { RecipientInput } = await import("./RecipientInput");
    render(
      <RecipientInput
        onRecipientSelected={onSelect}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Paste Address" }));
    fireEvent.change(screen.getByLabelText("XRPL address"), {
      target: { value: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSelect).toHaveBeenCalledWith("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
  });
});
