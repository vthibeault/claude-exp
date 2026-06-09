import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("wires label, description and control together", () => {
    render(
      <Field label="Email" description="We never share it.">
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and exposes the error", () => {
    render(
      <Field label="Email" error="Invalid address" required>
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid address");
  });
});
