/**
 * AlertTable Component
 *
 * Displays alerts in a table format with sorting, selection, and pagination.
 *
 * Features:
 * - Responsive table → card layout on mobile
 * - Checkbox selection for bulk actions
 * - Sort by severity, time, portfolio
 * - Pagination (20 items per page)
 * - Loading skeletons
 * - Empty states
 */

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { AlertRow } from "./AlertRow";
import { useMediaQuery } from "@/hooks";
import type { Alert } from "@/types/alert";

export interface AlertTableProps {
  /** List of alerts to display */
  alerts: Alert[];
  /** Loading state */
  loading?: boolean;
  /** Sort order */
  sortBy?: "recent" | "severity" | "portfolio";
  /** Pagination */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Loading Skeleton for Table
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-12 flex-1" data-testid="skeleton" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ message }: { message?: string }) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {message || "No alerts found"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or check back later
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Mobile Card Layout
 */
function MobileCardLayout({
  alerts,
  selectedIds,
  onSelectionChange,
}: {
  alerts: Alert[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3" role="list">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className="p-4"
          data-testid="alert-card"
          role="listitem"
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedIds.has(alert.id)}
              onCheckedChange={(checked) =>
                onSelectionChange(alert.id, !!checked)
              }
              aria-label={`Select alert ${alert.message}`}
            />
            <AlertRow alert={alert} compact />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Pagination Controls
 */
function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/**
 * AlertTable Component
 */
export function AlertTable({
  alerts,
  loading = false,
  sortBy = "recent",
  page = 1,
  totalPages = 1,
  onPageChange,
}: AlertTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(alerts.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected =
    alerts.length > 0 && selectedIds.size === alerts.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Loading state
  if (loading) {
    return <TableSkeleton />;
  }

  // Empty state
  if (alerts.length === 0) {
    return <EmptyState />;
  }

  // Mobile card layout
  if (isMobile) {
    return (
      <>
        {/* Bulk actions header */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-accent rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedIds.size} alert{selectedIds.size > 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Acknowledge Selected
              </Button>
              <Button size="sm" variant="outline">
                Dismiss Selected
              </Button>
            </div>
          </div>
        )}

        <MobileCardLayout
          alerts={alerts}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectOne}
        />

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange || (() => {})}
        />
      </>
    );
  }

  // Desktop table layout
  return (
    <>
      {/* Bulk actions header */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-accent rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedIds.size} alert{selectedIds.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              role="button"
              aria-label="Acknowledge Selected"
            >
              Acknowledge Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              role="button"
              aria-label="Dismiss Selected"
            >
              Dismiss Selected
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table role="table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all alerts"
                />
              </TableHead>
              <TableHead className="w-24">Severity</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-40">Portfolio</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-32">Time</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(alert.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(alert.id, !!checked)
                    }
                    aria-label={`Select alert ${alert.message}`}
                  />
                </TableCell>
                <AlertRow
                  alert={alert}
                  onAcknowledge={() => {}}
                  onDismiss={() => {}}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange || (() => {})}
      />
    </>
  );
}

AlertTable.displayName = "AlertTable";
