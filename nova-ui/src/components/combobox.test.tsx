import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Combobox, type ComboboxOption } from "./combobox";

const options: ComboboxOption[] = [
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
];

function Harness({ onValueChange = (_: string) => {} }) {
  const [value, setValue] = useState<string | undefined>();
  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange(v);
      }}
    />
  );
}

describe("Combobox", () => {
  it("opens on focus and filters as you type", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");

    await userEvent.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await userEvent.type(input, "ja");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Japan" })).toBeInTheDocument();
  });

  it("selects with keyboard navigation", async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox");

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("de");
    expect(input).toHaveValue("Germany");
  });

  it("shows the empty message for no matches", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole("combobox"), "xyz");
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("manages aria-activedescendant", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");

    const activeId = input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)).toHaveTextContent("Germany");
  });
});
