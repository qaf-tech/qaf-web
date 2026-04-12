import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BalanceHeader } from "./BalanceHeader";

describe("BalanceHeader", () => {
  test("renders formatted balance", () => {
    render(<BalanceHeader balance={1234.56} isLoading={false} />);
    expect(screen.getByText("$1,234.56")).toBeTruthy();
  });

  test("renders Total RLUSD Balance label", () => {
    render(<BalanceHeader balance={0} isLoading={false} />);
    expect(screen.getByText("Total RLUSD Balance")).toBeTruthy();
  });

  test("renders skeleton when isLoading", () => {
    const { container } = render(
      <BalanceHeader balance={0} isLoading={true} />,
    );
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
  });

  test("balance element has descriptive aria-label", () => {
    render(<BalanceHeader balance={2500} isLoading={false} />);
    expect(
      screen.getByLabelText("Total RLUSD balance: $2,500.00"),
    ).toBeTruthy();
  });
});
