import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { NumberInput } from "./number-input";

function Harness({ onValueChange = (_: number | null) => {}, min = 0, max = 10 }) {
  const [v, setV] = useState<number | null>(5);
  return (
    <NumberInput
      value={v}
      min={min}
      max={max}
      onValueChange={(n) => {
        setV(n);
        onValueChange(n);
      }}
    />
  );
}

describe("NumberInput", () => {
  it("increments and decrements with the steppers", async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(onValueChange).toHaveBeenLastCalledWith(6);

    await userEvent.click(screen.getByRole("button", { name: "Decrease" }));
    expect(onValueChange).toHaveBeenLastCalledWith(5);
  });

  it("steps with arrow keys", async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton");
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(7);
  });

  it("clamps typed values to min/max on blur", async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "999");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  it("disables steppers at the bounds", async () => {
    render(<Harness />);
    const inc = screen.getByRole("button", { name: "Increase" });
    for (let i = 0; i < 5; i++) await userEvent.click(inc);
    expect(inc).toBeDisabled();
  });
});
