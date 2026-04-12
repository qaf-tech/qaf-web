import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  test("renders children", () => {
    render(
      <AppShell>
        <span>child-content</span>
      </AppShell>,
    );
    expect(screen.getByText("child-content")).toBeDefined();
  });

  test("renders a container wrapper div", () => {
    const { container } = render(
      <AppShell>
        <span>x</span>
      </AppShell>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toBeTruthy();
  });
});
