import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Slider } from "./slider";

function Single({ onValueChange = (_: number | [number, number]) => {} }) {
  const [v, setV] = useState<number>(50);
  return (
    <Slider
      value={v}
      onValueChange={(n) => {
        setV(n as number);
        onValueChange(n);
      }}
    />
  );
}

function Range() {
  const [v, setV] = useState<[number, number]>([20, 80]);
  return <Slider value={v} onValueChange={(n) => setV(n as [number, number])} />;
}

describe("Slider", () => {
  it("exposes ARIA slider semantics", () => {
    render(<Single />);
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("moves with arrow keys, Home and End", async () => {
    const onValueChange = vi.fn();
    render(<Single onValueChange={onValueChange} />);
    const thumb = screen.getByRole("slider");

    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(51);

    await userEvent.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(0);

    await userEvent.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
  });

  it("renders two thumbs for range values and keeps order", async () => {
    render(<Range />);
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-valuenow", "20");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "80");

    thumbs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("slider")[0]).toHaveAttribute("aria-valuenow", "21");
  });
});
