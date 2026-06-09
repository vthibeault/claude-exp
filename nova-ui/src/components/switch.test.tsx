import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Switch } from "./switch";

describe("Switch", () => {
  it("toggles uncontrolled state", async () => {
    render(<Switch defaultChecked={false} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("works as a controlled component", async () => {
    const onCheckedChange = vi.fn();

    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <Switch
          checked={on}
          onCheckedChange={(v) => {
            setOn(v);
            onCheckedChange(v);
          }}
        />
      );
    }

    render(<Controlled />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    render(<Switch disabled />);
    const toggle = screen.getByRole("switch");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
