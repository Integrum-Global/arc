"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

/**
 * DataTable Component
 *
 * A flexible data table component built on TanStack React Table.
 * Supports sorting, pagination, loading states, row selection,
 * and custom cell rendering.
 */

export interface DataTableProps<TData> {
  /** Data array to display */
  data: TData[];
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Loading state */
  loading?: boolean;
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Enable sorting */
  sortable?: boolean;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Enable pagination */
  pagination?: boolean;
  /** Initial page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Enable row selection */
  selectable?: boolean;
  /** Selected rows (controlled) */
  selectedRows?: RowSelectionState;
  /** Selection change handler */
  onSelectionChange?: (selection: RowSelectionState) => void;
  /** Additional table class */
  className?: string;
  /** Table container class */
  containerClassName?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Show row count */
  showRowCount?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Number of skeleton rows to show when loading */
  skeletonRows?: number;
}

/**
 * Skeleton row for loading state
 */
function TableSkeletonRow({
  columns,
  compact,
}: {
  columns: number;
  compact: boolean;
}) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i} className={compact ? "py-2" : "py-3"}>
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Sort indicator component
 */
function SortIndicator({
  sorted,
  className,
}: {
  sorted: false | "asc" | "desc";
  className?: string;
}) {
  if (!sorted) {
    return <ArrowUpDown className={cn("h-4 w-4 opacity-50", className)} />;
  }

  return sorted === "asc" ? (
    <ArrowUp className={cn("h-4 w-4", className)} />
  ) : (
    <ArrowDown className={cn("h-4 w-4", className)} />
  );
}

/**
 * Pagination controls component
 */
function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  showRowCount,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  pageSizeOptions: number[];
  showRowCount: boolean;
}) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;

  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Row count */}
      {showRowCount && (
        <div className="text-sm text-muted-foreground">
          Showing {startRow}-{endRow} of {totalRows} rows
        </div>
      )}

      <div className="flex items-center gap-4 ml-auto">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page indicator */}
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount || 1}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  sortable = true,
  onRowClick,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedRows,
  onSelectionChange,
  className,
  containerClassName,
  stickyHeader = false,
  compact = false,
  showRowCount = true,
  striped = false,
  skeletonRows = 5,
}: DataTableProps<TData>) {
  // State
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [paginationState, setPaginationState] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize,
    }
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    selectedRows ?? {}
  );

  // Sync external selection state
  React.useEffect(() => {
    if (selectedRows !== undefined) {
      setRowSelection(selectedRows);
    }
  }, [selectedRows]);

  // Handle selection change
  const handleSelectionChange = React.useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onSelectionChange?.(newSelection);
    },
    [rowSelection, onSelectionChange]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: pagination ? paginationState : undefined,
      rowSelection,
    },
    enableSorting: sortable,
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onPaginationChange: setPaginationState,
    onRowSelectionChange: handleSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
  });

  // Handle row click
  const handleRowClick = (row: Row<TData>) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  return (
    <div className={cn("space-y-0", containerClassName)}>
      <div
        className={cn(
          "rounded-md border",
          stickyHeader && "overflow-auto max-h-[600px]"
        )}
      >
        <Table className={className}>
          <TableHeader className={stickyHeader ? "sticky top-0 bg-background z-10" : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        compact && "py-2",
                        canSort && "cursor-pointer select-none hover:bg-muted/50"
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <SortIndicator
                            sorted={header.column.getIsSorted()}
                          />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableSkeletonRow
                  key={i}
                  columns={columns.length}
                  compact={compact}
                />
              ))
            ) : table.getRowModel().rows?.length ? (
              // Data rows
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    striped && index % 2 === 1 && "bg-muted/30"
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={compact ? "py-2" : undefined}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && !loading && data.length > 0 && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showRowCount={showRowCount}
        />
      )}
    </div>
  );
}

DataTable.displayName = "DataTable";

/**
 * Helper function to create a sortable column
 */
export function createSortableColumn<TData, TValue>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    cell?: (value: TValue) => React.ReactNode;
    enableSorting?: boolean;
    meta?: Record<string, unknown>;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    cell: options?.cell
      ? ({ getValue }) => options.cell!(getValue() as TValue)
      : undefined,
    enableSorting: options?.enableSorting ?? true,
    meta: options?.meta,
  };
}

/**
 * Helper function to create a currency column
 */
export function createCurrencyColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    currency?: string;
    compact?: boolean;
    enableSorting?: boolean;
  }
): ColumnDef<TData> {
  const { currency = "USD", compact = false, enableSorting = true } = options ?? {};

  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as number;
      if (value === null || value === undefined) return "-";

      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: 2,
      });

      return (
        <span className="font-mono tabular-nums">{formatter.format(value)}</span>
      );
    },
    enableSorting,
  };
}

/**
 * Helper function to create a percentage column
 */
export function createPercentColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    decimals?: number;
    showSign?: boolean;
    colorize?: boolean;
    enableSorting?: boolean;
  }
): ColumnDef<TData> {
  const {
    decimals = 2,
    showSign = false,
    colorize = false,
    enableSorting = true,
  } = options ?? {};

  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as number;
      if (value === null || value === undefined) return "-";

      const formatted = `${showSign && value > 0 ? "+" : ""}${(value * 100).toFixed(decimals)}%`;

      let colorClass = "";
      if (colorize) {
        if (value > 0) colorClass = "text-positive";
        else if (value < 0) colorClass = "text-negative";
      }

      return (
        <span className={cn("font-mono tabular-nums", colorClass)}>
          {formatted}
        </span>
      );
    },
    enableSorting,
  };
}
