import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function renderTabs() {
  return render(
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">Panel one</TabsContent>
      <TabsContent value="two">Panel two</TabsContent>
      <TabsContent value="three">Panel three</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("shows the default panel and switches on click", async () => {
    renderTabs();
    expect(screen.getByText("Panel one")).toBeInTheDocument();
    expect(screen.queryByText("Panel two")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Panel two")).toBeInTheDocument();
    expect(screen.queryByText("Panel one")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation with wrap-around", async () => {
    renderTabs();
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    expect(screen.getByText("Panel two")).toBeInTheDocument();

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    expect(screen.getByText("Panel three")).toBeInTheDocument();
  });

  it("wires up ARIA relationships", () => {
    renderTabs();
    const tab = screen.getByRole("tab", { name: "One" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
  });
});
