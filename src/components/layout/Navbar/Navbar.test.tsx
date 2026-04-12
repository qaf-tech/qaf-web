import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("next/navigation", () => ({
  usePathname: () => "/",
}));

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

describe("Navbar", () => {
  test("renders with role='banner'", async () => {
    const { Navbar } = await import("./Navbar");
    render(<Navbar />);
    expect(screen.getByRole("banner")).toBeDefined();
  });

  test("displays app name text", async () => {
    const { Navbar } = await import("./Navbar");
    render(<Navbar appName="Custom App" />);
    expect(screen.getByText("Custom App")).toBeDefined();
  });

  test("defaults to 'QAF' app name", async () => {
    const { Navbar } = await import("./Navbar");
    render(<Navbar />);
    expect(screen.getByText("QAF")).toBeDefined();
  });

  test("renders primary navigation", async () => {
    const { Navbar } = await import("./Navbar");
    render(<Navbar />);
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeDefined();
  });
});
