"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LinkData {
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string;
  provider_name?: string;
}

interface LinkAccountModalProps {
  open: boolean;
  linkData: LinkData | null;
  onSuccess: (user: any, accessToken: string) => void;
  onCancel: () => void;
}

export function LinkAccountModal({
  open,
  linkData,
  onSuccess,
  onCancel,
}: LinkAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleLinkAccount = async () => {
    if (!linkData) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/link/${linkData.provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to link account");
      }

      onSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link account");
    } finally {
      setIsLoading(false);
    }
  };

  if (!linkData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => !isLoading && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-center">
            Account Already Exists
          </DialogTitle>
          <DialogDescription className="text-center">
            An account with email{" "}
            <strong className="text-foreground">{linkData.provider_email}</strong>{" "}
            already exists. Would you like to link your {linkData.provider}{" "}
            account to it?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLinkAccount}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
