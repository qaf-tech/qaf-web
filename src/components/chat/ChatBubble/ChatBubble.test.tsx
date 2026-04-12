import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatBubble } from "./ChatBubble";

describe("ChatBubble", () => {
  test("renders content text", () => {
    render(<ChatBubble content="Hello" variant="user" timestamp={0} />);
    expect(screen.getByText("Hello")).toBeDefined();
  });

  test("user variant applies user class", () => {
    const { container } = render(
      <ChatBubble content="Hi" variant="user" timestamp={0} />,
    );
    const div = container.querySelector("div");
    expect(div?.className).toContain("user");
  });

  test("agent variant applies agent class and glass surface", () => {
    const { container } = render(
      <ChatBubble content="Hi" variant="agent" timestamp={0} />,
    );
    const div = container.querySelector("div");
    expect(div?.className).toContain("agent");
    expect(div?.className).toContain("surface");
  });

  test("error variant renders retry button when onRetry provided", () => {
    const onRetry = mock(() => {});
    render(
      <ChatBubble
        content="Failed"
        variant="agent"
        timestamp={0}
        isError
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry message" })).toBeDefined();
  });

  test("retry button calls onRetry when clicked", () => {
    const onRetry = mock(() => {});
    render(
      <ChatBubble
        content="Failed"
        variant="agent"
        timestamp={0}
        isError
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("success variant applies success class", () => {
    const { container } = render(
      <ChatBubble content="Done" variant="agent" timestamp={0} isSuccess />,
    );
    const div = container.querySelector("div");
    expect(div?.className).toContain("success");
  });

  test("renders formatted timestamp", () => {
    const timestamp = new Date(2025, 0, 1, 14, 30).getTime();
    const { container } = render(
      <ChatBubble content="Hi" variant="agent" timestamp={timestamp} />,
    );
    const span = container.querySelector("span");
    expect(span?.textContent).toMatch(/\d{1,2}[:.]\d{2}/);
  });
});
