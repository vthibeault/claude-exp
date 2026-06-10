import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { PinInput } from "./pin-input";

function Harness({ onComplete = (_: string) => {} }) {
  const [v, setV] = useState("");
  return <PinInput length={4} value={v} onValueChange={setV} onComplete={onComplete} />;
}

describe("PinInput", () => {
  it("auto-advances as digits are typed and fires onComplete", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");

    await userEvent.click(boxes[0]);
    await userEvent.keyboard("1234");

    expect(boxes[0]).toHaveValue("1");
    expect(boxes[3]).toHaveValue("4");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("ignores non-numeric keys in numeric mode", async () => {
    render(<Harness />);
    const boxes = screen.getAllByRole("textbox");
    await userEvent.click(boxes[0]);
    await userEvent.keyboard("a7");
    expect(boxes[0]).toHaveValue("7");
  });

  it("backspace clears and moves backwards", async () => {
    render(<Harness />);
    const boxes = screen.getAllByRole("textbox");
    await userEvent.click(boxes[0]);
    await userEvent.keyboard("12");

    await userEvent.keyboard("{Backspace}");
    expect(boxes[2]).toHaveValue("");
    await userEvent.keyboard("{Backspace}");
    expect(boxes[1]).toHaveValue("");
  });

  it("fills from paste", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");

    await userEvent.click(boxes[0]);
    await userEvent.paste("9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
    expect(boxes[0]).toHaveValue("9");
    expect(boxes[3]).toHaveValue("6");
  });
});
