import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  test("calls onSend with trimmed text when Enter is pressed", () => {
    const onSend = mock((_text: string) => {});
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "  hello  " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0]?.[0]).toBe("hello");
  });

  test("does not call onSend when input is empty", () => {
    const onSend = mock(() => {});
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  test("does not send when Shift+Enter is pressed", () => {
    const onSend = mock((_text: string) => {});
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "hi" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  test("clears input after sending", () => {
    const onSend = mock((_text: string) => {});
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "hi" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(textarea.value).toBe("");
  });

  test("send button has aria-disabled='true' when input is empty", () => {
    render(<ChatInput onSend={mock(() => {})} />);
    const button = screen.getByRole("button", { name: "Send message" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  test("textarea is disabled when isDisabled is true", () => {
    render(<ChatInput onSend={mock(() => {})} isDisabled />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  test("send button has accessible label", () => {
    render(<ChatInput onSend={mock(() => {})} />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDefined();
  });

  test("clicking send button sends the message", () => {
    const onSend = mock((_text: string) => {});
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByLabelText(
      "Type a message",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "click" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0]?.[0]).toBe("click");
  });
});
