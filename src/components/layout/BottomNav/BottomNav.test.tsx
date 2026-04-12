import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("next/navigation", () => ({
  usePathname: () => "/chat",
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

const items = [
  { href: "/", label: "Home", icon: <span>H</span> },
  { href: "/chat", label: "Chat", icon: <span>C</span> },
  { href: "/cards", label: "Cards", icon: <span>K</span> },
];

describe("BottomNav", () => {
  test("renders nav with role='navigation' and aria-label", async () => {
    const { BottomNav } = await import("./BottomNav");
    render(<BottomNav items={items} />);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeDefined();
  });

  test("renders all provided items as links", async () => {
    const { BottomNav } = await import("./BottomNav");
    render(<BottomNav items={items} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  test("sets aria-current='page' on the active item", async () => {
    const { BottomNav } = await import("./BottomNav");
    render(<BottomNav items={items} />);
    const links = screen.getAllByRole("link");
    const chat = links.find(
      (l) => (l as HTMLAnchorElement).getAttribute("href") === "/chat",
    );
    expect(chat?.getAttribute("aria-current")).toBe("page");
  });

  test("non-active items do not have aria-current", async () => {
    const { BottomNav } = await import("./BottomNav");
    render(<BottomNav items={items} />);
    const links = screen.getAllByRole("link");
    const home = links.find(
      (l) => (l as HTMLAnchorElement).getAttribute("href") === "/",
    );
    expect(home?.getAttribute("aria-current")).toBeNull();
  });
});
