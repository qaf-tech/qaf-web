import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";

mock.module("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("WelcomeScreen", () => {
  test("renders the primary heading", async () => {
    const { WelcomeScreen } = await import("./WelcomeScreen");
    render(<WelcomeScreen onCreateWallet={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "Your wallet, your identity" }),
    ).toBeDefined();
  });

  test("renders the create wallet CTA with accessible label", async () => {
    const { WelcomeScreen } = await import("./WelcomeScreen");
    render(<WelcomeScreen onCreateWallet={() => {}} />);
    const button = screen.getByRole("button", {
      name: "Create a new QAF wallet",
    });
    expect(button).toBeDefined();
    expect(button.textContent).toBe("Create wallet");
  });

  test("calls onCreateWallet when CTA is clicked", async () => {
    const { WelcomeScreen } = await import("./WelcomeScreen");
    const onCreateWallet = mock(() => {});
    render(<WelcomeScreen onCreateWallet={onCreateWallet} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new QAF wallet" }),
    );
    expect(onCreateWallet).toHaveBeenCalledTimes(1);
  });

  test("renders recovery link pointing to /recover", async () => {
    const { WelcomeScreen } = await import("./WelcomeScreen");
    render(<WelcomeScreen onCreateWallet={() => {}} />);
    const link = screen.getByRole("link", { name: "Recover existing wallet" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/recover");
  });

  test("exposes main landmark role", async () => {
    const { WelcomeScreen } = await import("./WelcomeScreen");
    render(<WelcomeScreen onCreateWallet={() => {}} />);
    expect(screen.getByRole("main")).toBeDefined();
  });
});
