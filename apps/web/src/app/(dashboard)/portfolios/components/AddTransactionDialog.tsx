"use client";

/**
 * AddTransactionDialog Component
 *
 * Dialog form for adding a new transaction to a portfolio.
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TransactionType } from "@/types/api";

// Form schema
const transactionFormSchema = z.object({
  type: z.enum([
    "buy",
    "sell",
    "dividend",
    "interest",
    "fee",
    "transfer_in",
    "transfer_out",
    "adjustment",
  ] as const),
  securitySymbol: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  amount: z.number().min(0.01, "Amount must be positive"),
  fees: z.number().min(0, "Fees must be non-negative"),
  tradeDate: z.date(),
  settlementDate: z.date().optional(),
  description: z.string().optional(),
});

type TransactionFormValues = z.input<typeof transactionFormSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  currency?: string;
}

// Transaction type options
const transactionTypes: Array<{ value: TransactionType; label: string; requiresSecurity: boolean }> = [
  { value: "buy", label: "Buy", requiresSecurity: true },
  { value: "sell", label: "Sell", requiresSecurity: true },
  { value: "dividend", label: "Dividend", requiresSecurity: true },
  { value: "interest", label: "Interest", requiresSecurity: false },
  { value: "fee", label: "Fee", requiresSecurity: false },
  { value: "transfer_in", label: "Transfer In", requiresSecurity: false },
  { value: "transfer_out", label: "Transfer Out", requiresSecurity: false },
  { value: "adjustment", label: "Adjustment", requiresSecurity: false },
];

export function AddTransactionDialog({
  open,
  onOpenChange,
  portfolioId,
  currency = "USD",
}: AddTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "buy",
      securitySymbol: "",
      quantity: undefined,
      price: undefined,
      amount: undefined,
      fees: 0,
      tradeDate: new Date(),
      description: "",
    },
  });

  const watchType = form.watch("type");
  const watchQuantity = form.watch("quantity");
  const watchPrice = form.watch("price");

  // Auto-calculate amount from quantity and price
  React.useEffect(() => {
    if (watchQuantity && watchPrice) {
      form.setValue("amount", watchQuantity * watchPrice);
    }
  }, [watchQuantity, watchPrice, form]);

  // Check if current type requires security
  const requiresSecurity = transactionTypes.find((t) => t.value === watchType)?.requiresSecurity;

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      console.log("Submitting transaction:", { portfolioId, ...data });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Transaction added", {
        description: `${data.type.replace("_", " ")} transaction has been recorded.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add transaction", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new transaction for this portfolio.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Security Symbol (conditional) */}
            {requiresSecurity && (
              <FormField
                control={form.control}
                name="securitySymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AAPL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the ticker symbol of the security
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Quantity and Price (conditional) */}
            {requiresSecurity && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Share</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Amount and Fees */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({currency})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fees ({currency})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trade Date */}
            <FormField
              control={form.control}
              name="tradeDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Trade Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <Input
                          type="date"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            field.onChange(date);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about this transaction..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
