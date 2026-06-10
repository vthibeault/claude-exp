import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PivotTable } from "./pivot-table";

const sales = [
  { region: "EMEA", country: "France", quarter: "Q1", revenue: 100 },
  { region: "EMEA", country: "Germany", quarter: "Q1", revenue: 200 },
  { region: "EMEA", country: "Germany", quarter: "Q2", revenue: 300 },
  { region: "APAC", country: "Japan", quarter: "Q1", revenue: 400 },
];

const fields = [
  { key: "region", label: "Region", numeric: false },
  { key: "country", label: "Country", numeric: false },
  { key: "quarter", label: "Quarter", numeric: false },
  { key: "revenue", label: "Revenue" },
];

function renderPivot() {
  return render(
    <PivotTable
      data={sales}
      fields={fields}
      defaultConfig={{
        rows: ["region", "country"],
        columns: ["quarter"],
        values: [{ key: "revenue", aggregation: "sum" }],
      }}
    />,
  );
}

describe("PivotTable", () => {
  it("renders group rows with subtotals and a grand total", () => {
    renderPivot();

    // EMEA group row shows the subtotal of France + Germany
    const emeaRow = screen.getByRole("button", { name: /EMEA/ }).closest("tr")!;
    expect(within(emeaRow).getAllByText("600").length).toBeGreaterThan(0); // row total Q1+Q2

    // Grand total row: 100+200+300+400
    const totalRow = screen.getByRole("rowheader", { name: "Total" }).closest("tr")!;
    expect(within(totalRow).getByText("1,000")).toBeInTheDocument();
  });

  it("shows a Total column aggregating across column groups", () => {
    renderPivot();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();

    // Germany row total = 200 + 300
    const germanyRow = screen.getByText("Germany").closest("tr")!;
    expect(within(germanyRow).getByText("500")).toBeInTheDocument();
  });

  it("collapses and expands row groups", async () => {
    renderPivot();
    expect(screen.getByText("France")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /EMEA/ }));
    expect(screen.queryByText("France")).not.toBeInTheDocument();
    // Subtotal still visible on the collapsed group row
    const emeaRow = screen.getByRole("button", { name: /EMEA/ }).closest("tr")!;
    expect(within(emeaRow).getByText("600")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /EMEA/ }));
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("removes a row field from the config bar", async () => {
    renderPivot();
    await userEvent.click(screen.getByRole("button", { name: "Remove Country from rows" }));
    expect(screen.queryByText("France")).not.toBeInTheDocument();
    // Region rows become leaves but totals are unchanged
    const totalRow = screen.getByRole("rowheader", { name: "Total" }).closest("tr")!;
    expect(within(totalRow).getByText("1,000")).toBeInTheDocument();
  });

  it("changes the aggregation from the value chip menu", async () => {
    renderPivot();
    await userEvent.click(screen.getByRole("button", { name: /Sum of Revenue/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Count" }));

    const totalRow = screen.getByRole("rowheader", { name: "Total" }).closest("tr")!;
    expect(within(totalRow).getByText("4")).toBeInTheDocument();
  });
});
