"use client";

/**
 * TransactionsTab Component
 *
 * Displays transaction history with filtering options.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data/DataTable";
import { usePortfolioTransactions } from "@/hooks/usePortfolios";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType, TransactionStatus } from "@/types/api";

interface TransactionsTabProps {
  portfolioId: string;
  currency?: string;
  onAddTransaction?: () => void;
}

// Transaction type config
const transactionTypeConfig: Record<
  TransactionType,
  { label: string; className: string }
> = {
  buy: { label: "Buy", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  sell: { label: "Sell", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  dividend: {
    label: "Dividend",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  interest: {
    label: "Interest",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  fee: { label: "Fee", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  transfer_in: {
    label: "Transfer In",
    className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  transfer_out: {
    label: "Transfer Out",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  adjustment: {
    label: "Adjustment",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
};

// Status config
const statusConfig: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  executed: { label: "Executed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

// Type filter options
const typeOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "dividend", label: "Dividend" },
  { value: "interest", label: "Interest" },
  { value: "fee", label: "Fee" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "adjustment", label: "Adjustment" },
];

export function TransactionsTab({
  portfolioId,
  currency = "USD",
  onAddTransaction,
}: TransactionsTabProps) {
  // Filter state
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // Fetch transactions
  const { data: transactionsData, isPending } = usePortfolioTransactions(
    portfolioId,
    {
      type: typeFilter !== "all" ? (typeFilter as TransactionType) : undefined,
      sort_by: "trade_date",
      sort_order: "desc",
    }
  );

  // Filter and search
  const transactions = React.useMemo(() => {
    if (!transactionsData?.items) return [];

    if (!search) return transactionsData.items;

    const searchLower = search.toLowerCase();
    return transactionsData.items.filter(
      (t) =>
        t.security?.symbol?.toLowerCase().includes(searchLower) ||
        t.security?.name?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
    );
  }, [transactionsData, search]);

  // Column definitions
  const columns: ColumnDef<Transaction>[] = React.useMemo(
    () => [
      {
        accessorKey: "trade_date",
        header: "Date",
        cell: ({ getValue }) => (
          <span className="text-sm">
            {formatDate(getValue() as string, "short")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue() as TransactionType;
          const config = transactionTypeConfig[type];
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                config.className
              )}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        accessorKey: "security",
        header: "Security",
        cell: ({ row }) => {
          const security = row.original.security;
          if (!security) return "-";
          return (
            <div>
              <p className="font-semibold">{security.symbol}</p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {security.name}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ getValue, row }) => {
          const qty = getValue() as number;
          const type = row.original.type;
          if (qty === 0) return "-";
          const isNegative = type === "sell" || type === "transfer_out";
          return (
            <span className="font-mono tabular-nums">
              {isNegative ? "-" : ""}
              {qty.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ getValue }) => {
          const price = getValue() as number;
          if (price === 0) return "-";
          return (
            <span className="font-mono tabular-nums">
              {formatCurrency(price, { currency, decimals: 2 })}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue, row }) => {
          const amount = getValue() as number;
          const type = row.original.type;
          const isInflow =
            type === "sell" ||
            type === "dividend" ||
            type === "interest" ||
            type === "transfer_in";
          return (
            <span
              className={cn(
                "font-mono tabular-nums font-medium",
                isInflow ? "text-positive" : "text-negative"
              )}
            >
              {isInflow ? "+" : "-"}
              {formatCurrency(Math.abs(amount), { currency, compact: true })}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as TransactionStatus;
          const config = statusConfig[status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
    ],
    [currency]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add transaction button */}
              {onAddTransaction && (
                <Button size="sm" onClick={onAddTransaction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={transactions}
            columns={columns}
            loading={isPending}
            pagination
            pageSize={15}
            sortable
            emptyMessage="No transactions found"
            skeletonRows={5}
          />
        </CardContent>
      </Card>
    </div>
  );
}
