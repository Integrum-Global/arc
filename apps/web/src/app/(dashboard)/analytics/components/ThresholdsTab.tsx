"use client";

/**
 * ThresholdsTab Component
 *
 * List of alert thresholds with edit/delete functionality.
 * Allows users to manage custom alert thresholds for financial ratios.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Bell,
  BellOff,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThresholdForm, type ThresholdFormData } from "./ThresholdForm";
import { formatRelativeTime } from "@/lib/formatting";

/**
 * Threshold type definition
 */
interface Threshold {
  id: string;
  name: string;
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value: number;
  severity: "low" | "medium" | "high" | "critical";
  securityTicker?: string;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

/**
 * Operator display labels
 */
const operatorLabels: Record<string, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "=",
  neq: "!=",
};

/**
 * Severity badge colors
 */
const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/**
 * Mock thresholds data
 */
const MOCK_THRESHOLDS: Threshold[] = [
  {
    id: "th-1",
    name: "Current Ratio Critical",
    metric: "Current Ratio",
    operator: "lt",
    value: 1.0,
    severity: "critical",
    isActive: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "th-2",
    name: "Current Ratio Warning",
    metric: "Current Ratio",
    operator: "lt",
    value: 1.5,
    severity: "medium",
    isActive: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "th-3",
    name: "Debt/Equity High",
    metric: "Debt/Equity",
    operator: "gt",
    value: 2.0,
    severity: "high",
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "th-4",
    name: "ROE Target",
    metric: "ROE",
    operator: "gte",
    value: 15,
    severity: "low",
    isActive: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: "th-5",
    name: "P/E Ratio Alert",
    metric: "P/E Ratio",
    operator: "gt",
    value: 30,
    severity: "medium",
    securityTicker: "AMZN",
    isActive: false,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "th-6",
    name: "Gross Margin Warning",
    metric: "Gross Margin",
    operator: "lt",
    value: 30,
    severity: "high",
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

/**
 * Loading skeleton
 */
function ThresholdsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThresholdsTab() {
  const [thresholds, setThresholds] = React.useState<Threshold[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingThreshold, setEditingThreshold] = React.useState<Threshold | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);

  // Load mock data
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setThresholds(MOCK_THRESHOLDS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleToggleActive = (id: string) => {
    setThresholds((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingThreshold(null);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setThresholds((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFormSubmit = (data: ThresholdFormData) => {
    if (isCreateMode) {
      // Create new threshold
      const newThreshold: Threshold = {
        id: `th-${Date.now()}`,
        name: data.name,
        metric: data.metric,
        operator: data.operator,
        value: data.value,
        severity: data.severity,
        securityTicker: data.securityTicker || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setThresholds((prev) => [newThreshold, ...prev]);
    } else if (editingThreshold) {
      // Update existing threshold
      setThresholds((prev) =>
        prev.map((t) =>
          t.id === editingThreshold.id
            ? {
                ...t,
                name: data.name,
                metric: data.metric,
                operator: data.operator,
                value: data.value,
                severity: data.severity,
                securityTicker: data.securityTicker || undefined,
              }
            : t
        )
      );
    }
    setIsDialogOpen(false);
  };

  if (loading) {
    return <ThresholdsTabSkeleton />;
  }

  const activeCount = thresholds.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Alert Thresholds</h2>
          <Badge variant="secondary">
            {activeCount} active / {thresholds.length} total
          </Badge>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Threshold
        </Button>
      </div>

      {/* Thresholds Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Active</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Security</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 opacity-50" />
                        <p>No thresholds configured</p>
                        <Button variant="outline" size="sm" onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first threshold
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  thresholds.map((threshold) => (
                    <TableRow
                      key={threshold.id}
                      className={cn(!threshold.isActive && "opacity-60")}
                    >
                      <TableCell>
                        <Switch
                          checked={threshold.isActive}
                          onCheckedChange={() => handleToggleActive(threshold.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{threshold.name}</TableCell>
                      <TableCell>{threshold.metric}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {operatorLabels[threshold.operator]} {threshold.value}
                        {threshold.metric.includes("%") || threshold.metric.includes("Margin") || threshold.metric.includes("ROE") || threshold.metric.includes("ROA")
                          ? "%"
                          : threshold.metric.includes("Ratio") || threshold.metric.includes("Debt")
                          ? "x"
                          : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("capitalize", severityColors[threshold.severity])}
                        >
                          {threshold.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {threshold.securityTicker ? (
                          <Badge variant="outline">{threshold.securityTicker}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">All</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {threshold.lastTriggered
                          ? formatRelativeTime(threshold.lastTriggered)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(threshold)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(threshold.id)}
                            >
                              {threshold.isActive ? (
                                <>
                                  <BellOff className="mr-2 h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Bell className="mr-2 h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(threshold.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? "Create Threshold" : "Edit Threshold"}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? "Configure a new alert threshold for financial ratios."
                : "Update the threshold configuration."}
            </DialogDescription>
          </DialogHeader>
          <ThresholdForm
            initialData={
              editingThreshold
                ? {
                    name: editingThreshold.name,
                    metric: editingThreshold.metric,
                    operator: editingThreshold.operator,
                    value: editingThreshold.value,
                    severity: editingThreshold.severity,
                    securityTicker: editingThreshold.securityTicker,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

ThresholdsTab.displayName = "ThresholdsTab";
