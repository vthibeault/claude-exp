import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onOpenChange={setOpen} aria-labelledby="t">
        <DialogHeader>
          <DialogTitle id="t">Confirm</DialogTitle>
          <DialogDescription>Are you sure?</DialogDescription>
        </DialogHeader>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("opens via showModal and closes with the close button", async () => {
    render(<DialogHarness />);
    const dialog = screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(dialog.open).toBe(true);
    expect(screen.getByText("Are you sure?")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog.open).toBe(false);
  });

  it("syncs state when the platform closes it (Esc)", async () => {
    render(<DialogHarness />);
    const dialog = screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;

    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(dialog.open).toBe(true);

    // Simulate the platform's Esc behavior: dialog closes and fires `close`.
    // (jsdom lacks dialog.close(), so mimic what the browser does.)
    dialog.removeAttribute("open");
    dialog.dispatchEvent(new Event("close"));
    // Re-opening still works because React state was synced.
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(dialog.open).toBe(true);
  });
});
