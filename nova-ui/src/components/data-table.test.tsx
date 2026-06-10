import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";

interface Person {
  name: string;
  role: string;
  age: number;
}

const data: Person[] = [
  { name: "Charlie", role: "Designer", age: 34 },
  { name: "Alice", role: "Engineer", age: 29 },
  { name: "Bob", role: "Manager", age: 41 },
];

const columns: Array<DataTableColumn<Person>> = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
  { key: "age", header: "Age", sortable: true },
];

function bodyRows() {
  const rows = screen.getAllByRole("row");
  return rows.slice(1); // drop header row
}

describe("DataTable", () => {
  it("renders all rows", () => {
    render(<DataTable data={data} columns={columns} columnToggle={false} />);
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText("3 rows")).toBeInTheDocument();
  });

  it("sorts by column on header click and toggles direction", async () => {
    render(<DataTable data={data} columns={columns} columnToggle={false} />);
    const sortButton = screen.getByRole("button", { name: /Name/ });

    await userEvent.click(sortButton);
    expect(within(bodyRows()[0]).getByText("Alice")).toBeInTheDocument();

    await userEvent.click(sortButton);
    expect(within(bodyRows()[0]).getByText("Charlie")).toBeInTheDocument();
  });

  it("filters rows with the global search", async () => {
    render(<DataTable data={data} columns={columns} columnToggle={false} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Search table" }), "engineer");

    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows the empty message when nothing matches", async () => {
    render(<DataTable data={data} columns={columns} columnToggle={false} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Search table" }), "zzz");
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("paginates", async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      name: `User ${String(i).padStart(2, "0")}`,
      role: "Engineer",
      age: 20 + i,
    }));
    render(<DataTable data={many} columns={columns} pageSize={10} columnToggle={false} />);

    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("User 00")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText("User 24")).toBeInTheDocument();
  });

  it("selects rows and the whole page", async () => {
    render(<DataTable data={data} columns={columns} selectable columnToggle={false} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });
});
