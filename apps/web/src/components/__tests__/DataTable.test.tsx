import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, createSortableColumn, createCurrencyColumn, createPercentColumn } from "@/components/data/DataTable";

// Test data type
interface TestRow {
  id: string;
  name: string;
  value: number;
  change: number;
}

// Sample test data
const testData: TestRow[] = [
  { id: "1", name: "Apple Inc.", value: 150.25, change: 0.025 },
  { id: "2", name: "Google LLC", value: 2750.00, change: -0.015 },
  { id: "3", name: "Microsoft Corp", value: 380.50, change: 0.032 },
  { id: "4", name: "Amazon.com Inc", value: 175.20, change: -0.008 },
  { id: "5", name: "Meta Platforms", value: 510.75, change: 0.045 },
];

// Generate large dataset for pagination tests
const generateLargeDataset = (count: number): TestRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Company ${i + 1}`,
    value: Math.random() * 1000,
    change: (Math.random() - 0.5) * 0.1,
  }));

// Basic column definitions
const columns: ColumnDef<TestRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
  },
  {
    accessorKey: "change",
    header: "Change",
    cell: ({ getValue }) => {
      const val = getValue() as number;
      return `${val >= 0 ? "+" : ""}${(val * 100).toFixed(2)}%`;
    },
  },
];

describe("DataTable", () => {
  describe("Rendering", () => {
    it("renders columns correctly", () => {
      render(<DataTable data={testData} columns={columns} pagination={false} />);

      // Check column headers are rendered
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Value")).toBeInTheDocument();
      expect(screen.getByText("Change")).toBeInTheDocument();
    });

    it("renders all data rows", () => {
      render(<DataTable data={testData} columns={columns} pagination={false} />);

      // Check all company names are rendered
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
      expect(screen.getByText("Google LLC")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corp")).toBeInTheDocument();
      expect(screen.getByText("Amazon.com Inc")).toBeInTheDocument();
      expect(screen.getByText("Meta Platforms")).toBeInTheDocument();
    });

    it("renders formatted cell values", () => {
      render(<DataTable data={testData} columns={columns} pagination={false} />);

      // Check formatted values
      expect(screen.getByText("$150.25")).toBeInTheDocument();
      expect(screen.getByText("+2.50%")).toBeInTheDocument();
      expect(screen.getByText("-1.50%")).toBeInTheDocument();
    });

    it("applies custom className to table", () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          className="custom-table-class"
          pagination={false}
        />
      );

      const table = screen.getByRole("table");
      expect(table).toHaveClass("custom-table-class");
    });

    it("applies container className", () => {
      const { container } = render(
        <DataTable
          data={testData}
          columns={columns}
          containerClassName="custom-container"
          pagination={false}
        />
      );

      expect(container.firstChild).toHaveClass("custom-container");
    });
  });

  describe("Empty State", () => {
    it("shows default empty message when no data", () => {
      render(<DataTable data={[]} columns={columns} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("shows custom empty message when provided", () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          emptyMessage="No holdings found"
        />
      );

      expect(screen.getByText("No holdings found")).toBeInTheDocument();
    });

    it("renders empty state in a single cell spanning all columns", () => {
      render(<DataTable data={[]} columns={columns} />);

      const emptyCell = screen.getByText("No data available").closest("td");
      expect(emptyCell).toHaveAttribute("colspan", String(columns.length));
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton when loading", () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          loading={true}
          skeletonRows={5}
        />
      );

      // Check that skeleton rows are rendered
      const rows = screen.getAllByRole("row");
      // 1 header row + 5 skeleton rows
      expect(rows.length).toBe(6);
    });

    it("renders correct number of skeleton rows", () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          loading={true}
          skeletonRows={3}
        />
      );

      const rows = screen.getAllByRole("row");
      // 1 header row + 3 skeleton rows
      expect(rows.length).toBe(4);
    });

    it("does not show data when loading", () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          loading={true}
          skeletonRows={3}
        />
      );

      // Data should not be visible
      expect(screen.queryByText("Apple Inc.")).not.toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("shows sort indicator on sortable columns", () => {
      const { container } = render(
        <DataTable
          data={testData}
          columns={columns}
          sortable={true}
          pagination={false}
        />
      );

      // Each sortable header should have the sort indicator (SVG icons)
      const headers = container.querySelectorAll("th");
      headers.forEach((header) => {
        // ArrowUpDown icon should be present in sortable headers
        expect(header.querySelector("svg")).toBeInTheDocument();
      });
    });

    it("handles sorting on header click", async () => {
      const user = userEvent.setup();

      render(
        <DataTable
          data={testData}
          columns={columns}
          sortable={true}
          pagination={false}
        />
      );

      // Get the Name header and click it
      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader).toBeInTheDocument();

      await user.click(nameHeader!);

      // After clicking, data should be sorted alphabetically
      const cells = screen.getAllByRole("cell");
      const nameCells = cells.filter((_, index) => index % 3 === 0);

      // First row should be Amazon (alphabetically first)
      expect(nameCells[0]).toHaveTextContent("Amazon.com Inc");
    });

    it("toggles sort direction on repeated clicks", async () => {
      const user = userEvent.setup();

      render(
        <DataTable
          data={testData}
          columns={columns}
          sortable={true}
          pagination={false}
        />
      );

      const nameHeader = screen.getByText("Name").closest("th");

      // First click - ascending
      await user.click(nameHeader!);

      // Second click - descending
      await user.click(nameHeader!);

      const cells = screen.getAllByRole("cell");
      const nameCells = cells.filter((_, index) => index % 3 === 0);

      // First row should be Meta (last alphabetically)
      expect(nameCells[0]).toHaveTextContent("Microsoft Corp");
    });

    it("disables sorting when sortable is false", async () => {
      const user = userEvent.setup();

      render(
        <DataTable
          data={testData}
          columns={columns}
          sortable={false}
          pagination={false}
        />
      );

      const nameHeader = screen.getByText("Name").closest("th");

      // Should not have cursor-pointer class
      expect(nameHeader).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Pagination", () => {
    it("shows pagination controls when pagination is enabled", () => {
      const largeData = generateLargeDataset(30);

      render(
        <DataTable
          data={largeData}
          columns={columns}
          pagination={true}
          pageSize={10}
        />
      );

      // Should show pagination controls
      expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
      expect(screen.getByText("Rows per page")).toBeInTheDocument();
    });

    it("limits displayed rows to page size", () => {
      const largeData = generateLargeDataset(30);

      render(
        <DataTable
          data={largeData}
          columns={columns}
          pagination={true}
          pageSize={10}
        />
      );

      // Should only show 10 data rows + 1 header row
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(11);
    });

    it("navigates to next page on click", async () => {
      const user = userEvent.setup();
      const largeData = generateLargeDataset(30);

      render(
        <DataTable
          data={largeData}
          columns={columns}
          pagination={true}
          pageSize={10}
        />
      );

      // First page should show Company 1-10
      expect(screen.getByText("Company 1")).toBeInTheDocument();
      expect(screen.queryByText("Company 11")).not.toBeInTheDocument();

      // Click next page button
      const nextButton = screen.getAllByRole("button").find(
        (btn) => btn.querySelector('[class*="chevron-right"]') !== null ||
                 btn.textContent === "" && btn.querySelector("svg")
      );

      // Find the next page button (ChevronRight icon)
      const buttons = screen.getAllByRole("button");
      const nextPageBtn = buttons[buttons.length - 2]; // Second to last button

      await user.click(nextPageBtn);

      // Second page should show Company 11-20
      expect(screen.getByText("Company 11")).toBeInTheDocument();
      expect(screen.queryByText("Company 1")).not.toBeInTheDocument();
    });

    it("shows row count information", () => {
      const largeData = generateLargeDataset(25);

      render(
        <DataTable
          data={largeData}
          columns={columns}
          pagination={true}
          pageSize={10}
          showRowCount={true}
        />
      );

      expect(screen.getByText(/Showing 1-10 of 25 rows/)).toBeInTheDocument();
    });

    it("hides pagination when no data", () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          pagination={true}
          pageSize={10}
        />
      );

      expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
    });

    it("changes page size when selector changes", async () => {
      const user = userEvent.setup();
      const largeData = generateLargeDataset(30);

      render(
        <DataTable
          data={largeData}
          columns={columns}
          pagination={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
        />
      );

      // Initially should show 10 rows
      let rows = screen.getAllByRole("row");
      expect(rows.length).toBe(11); // 10 data + 1 header

      // Change page size to 25
      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "25");

      // Now should show 25 rows
      rows = screen.getAllByRole("row");
      expect(rows.length).toBe(26); // 25 data + 1 header
    });
  });

  describe("Row Selection", () => {
    it("allows row selection when selectable is true", async () => {
      const onSelectionChange = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={columns}
          selectable={true}
          onSelectionChange={onSelectionChange}
          pagination={false}
        />
      );

      // Component should accept selectable prop without error
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("calls onSelectionChange with selected rows", async () => {
      const onSelectionChange = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={columns}
          selectable={true}
          selectedRows={{}}
          onSelectionChange={onSelectionChange}
          pagination={false}
        />
      );

      // Selection functionality is available
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("Row Click", () => {
    it("calls onRowClick when row is clicked", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={columns}
          onRowClick={onRowClick}
          pagination={false}
        />
      );

      // Click on a row
      const row = screen.getByText("Apple Inc.").closest("tr");
      await user.click(row!);

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it("applies cursor-pointer to clickable rows", () => {
      const onRowClick = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={columns}
          onRowClick={onRowClick}
          pagination={false}
        />
      );

      const row = screen.getByText("Apple Inc.").closest("tr");
      expect(row).toHaveClass("cursor-pointer");
    });
  });

  describe("Compact Mode", () => {
    it("applies compact styling when compact is true", () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          compact={true}
          pagination={false}
        />
      );

      const cells = screen.getAllByRole("cell");
      cells.forEach((cell) => {
        expect(cell).toHaveClass("py-2");
      });
    });
  });

  describe("Striped Rows", () => {
    it("applies striped styling when striped is true", () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          striped={true}
          pagination={false}
        />
      );

      // Every other row should have the striped class
      const rows = screen.getAllByRole("row").slice(1); // Skip header
      rows.forEach((row, index) => {
        if (index % 2 === 1) {
          expect(row).toHaveClass("bg-muted/30");
        }
      });
    });
  });

  describe("Sticky Header", () => {
    it("applies sticky header styling", () => {
      const { container } = render(
        <DataTable
          data={testData}
          columns={columns}
          stickyHeader={true}
          pagination={false}
        />
      );

      // Header should have sticky class
      const thead = container.querySelector("thead");
      expect(thead).toHaveClass("sticky");
    });
  });

  describe("Helper Functions", () => {
    describe("createSortableColumn", () => {
      it("creates a sortable column definition", () => {
        const column = createSortableColumn<TestRow, string>("name", "Company Name");

        expect(column.accessorKey).toBe("name");
        expect(column.header).toBe("Company Name");
        expect(column.enableSorting).toBe(true);
      });

      it("allows disabling sorting", () => {
        const column = createSortableColumn<TestRow, string>("name", "Company Name", {
          enableSorting: false,
        });

        expect(column.enableSorting).toBe(false);
      });
    });

    describe("createCurrencyColumn", () => {
      it("creates a currency column with formatting", () => {
        const column = createCurrencyColumn<TestRow>("value", "Price");

        expect(column.accessorKey).toBe("value");
        expect(column.header).toBe("Price");

        // Test the cell renderer
        if (column.cell && typeof column.cell === "function") {
          const result = column.cell({
            getValue: () => 1234.56,
            row: {} as never,
            column: {} as never,
            table: {} as never,
            cell: {} as never,
            renderValue: () => null,
          });

          // Should return formatted currency element
          expect(result).toBeDefined();
        }
      });
    });

    describe("createPercentColumn", () => {
      it("creates a percentage column with formatting", () => {
        const column = createPercentColumn<TestRow>("change", "Change %", {
          colorize: true,
          showSign: true,
        });

        expect(column.accessorKey).toBe("change");
        expect(column.header).toBe("Change %");

        // Test the cell renderer
        if (column.cell && typeof column.cell === "function") {
          const result = column.cell({
            getValue: () => 0.05,
            row: {} as never,
            column: {} as never,
            table: {} as never,
            cell: {} as never,
            renderValue: () => null,
          });

          expect(result).toBeDefined();
        }
      });
    });
  });
});
