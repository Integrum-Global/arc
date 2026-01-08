"use client";

/**
 * CreatePortfolioDialog Component
 *
 * Dialog form for creating a new portfolio.
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useCreatePortfolio } from "@/hooks/usePortfolios";
import type { PortfolioType } from "@/types/api";

// Form schema
const createPortfolioSchema = z.object({
  name: z
    .string()
    .min(1, "Portfolio name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum([
    "equity",
    "fixed_income",
    "balanced",
    "money_market",
    "alternative",
    "custom",
  ] as const),
  currency: z.string().min(1, "Currency is required"),
  benchmarkId: z.string().optional(),
});

type CreatePortfolioFormValues = z.infer<typeof createPortfolioSchema>;

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Portfolio type options
const portfolioTypes: Array<{ value: PortfolioType; label: string; description: string }> = [
  {
    value: "equity",
    label: "Equity",
    description: "Primarily invested in stocks",
  },
  {
    value: "fixed_income",
    label: "Fixed Income",
    description: "Primarily invested in bonds",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Mix of stocks and bonds",
  },
  {
    value: "money_market",
    label: "Money Market",
    description: "Short-term, low-risk investments",
  },
  {
    value: "alternative",
    label: "Alternative",
    description: "Alternative investments like commodities, real estate",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Custom portfolio structure",
  },
];

// Currency options
const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

export function CreatePortfolioDialog({
  open,
  onOpenChange,
}: CreatePortfolioDialogProps) {
  const { mutate: createPortfolio, isPending } = useCreatePortfolio();

  const form = useForm<CreatePortfolioFormValues>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "equity",
      currency: "USD",
      benchmarkId: "",
    },
  });

  const onSubmit = (data: CreatePortfolioFormValues) => {
    createPortfolio(
      {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        currency: data.currency,
        benchmark_id: data.benchmarkId || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Portfolio</DialogTitle>
          <DialogDescription>
            Set up a new investment portfolio to track your holdings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Portfolio Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Growth Portfolio" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Portfolio Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select portfolio type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {portfolioTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The primary currency for this portfolio
                  </FormDescription>
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
                      placeholder="Describe the investment strategy or goals..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Benchmark */}
            <FormField
              control={form.control}
              name="benchmarkId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benchmark (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a benchmark" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No benchmark</SelectItem>
                      <SelectItem value="sp500">S&P 500</SelectItem>
                      <SelectItem value="nasdaq">NASDAQ Composite</SelectItem>
                      <SelectItem value="djia">Dow Jones Industrial</SelectItem>
                      <SelectItem value="russell2000">Russell 2000</SelectItem>
                      <SelectItem value="msciworld">MSCI World</SelectItem>
                      <SelectItem value="agg">Bloomberg US Aggregate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Compare performance against a market index
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Portfolio
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
