/**
 * Linked Accounts Manager Component
 * Manages SSO provider account linking/unlinking
 *
 * Features:
 * - Lists all available SSO providers (Azure AD, Google, GitHub)
 * - Shows connected/not connected status for each provider
 * - Allows connecting new providers (initiates OAuth flow)
 * - Allows unlinking providers (with confirmation)
 * - Prevents unlinking last auth method (if no password set)
 */

"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Unlink, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import {
  useLinkedAccounts,
  useAuthMethods,
  useLinkAccount,
  useUnlinkAccount,
  type LinkedAccount,
} from "@/hooks/useLinkedAccounts";
import {
  AzureIcon,
  GoogleIcon,
  GitHubIcon,
} from "@/components/icons/providers";

interface Provider {
  id: "azure" | "google" | "github";
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROVIDERS: Provider[] = [
  { id: "azure", name: "azure", displayName: "Microsoft Azure AD", icon: AzureIcon },
  { id: "google", name: "google", displayName: "Google Workspace", icon: GoogleIcon },
  { id: "github", name: "github", displayName: "GitHub", icon: GitHubIcon },
];

interface UnlinkDialogState {
  provider: Provider | null;
  account: LinkedAccount | null;
}

export function LinkedAccountsManager() {
  const [unlinkDialog, setUnlinkDialog] = useState<UnlinkDialogState>({
    provider: null,
    account: null,
  });

  // Query hooks
  const { data: linkedAccounts = [], isPending: isLoading } =
    useLinkedAccounts();
  const { data: authMethods } = useAuthMethods();

  // Mutation hooks
  const linkMutation = useLinkAccount();
  const unlinkMutation = useUnlinkAccount();

  // Determine if user can unlink (has password OR has more than 1 linked account)
  const canUnlink = useMemo(() => {
    const hasPassword = authMethods?.has_password ?? false;
    return hasPassword || linkedAccounts.length > 1;
  }, [authMethods?.has_password, linkedAccounts.length]);

  const handleLink = async (provider: string) => {
    linkMutation.mutate(provider);
  };

  const handleUnlinkClick = (provider: Provider, account: LinkedAccount) => {
    setUnlinkDialog({ provider, account });
  };

  const handleUnlinkConfirm = () => {
    if (unlinkDialog.provider) {
      unlinkMutation.mutate(unlinkDialog.provider.id);
      setUnlinkDialog({ provider: null, account: null });
    }
  };

  const handleUnlinkCancel = () => {
    setUnlinkDialog({ provider: null, account: null });
  };

  const getLinkedAccount = (providerId: string): LinkedAccount | undefined =>
    linkedAccounts.find((a) => a.provider_type === providerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect your account to external identity providers for single
            sign-on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect your account to external identity providers for single
            sign-on.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const linked = getLinkedAccount(provider.id);
            const isLastAuthMethod = !canUnlink && linked;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{provider.displayName}</p>
                    {linked ? (
                      <p className="text-sm text-muted-foreground">
                        {linked.provider_email}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {linked && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}

                  {linked ? (
                    isLastAuthMethod ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="cursor-not-allowed"
                              data-testid={`unlink-disabled-${provider.id}`}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                              Unlink
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cannot unlink last authentication method.</p>
                            <p className="text-xs text-muted-foreground">
                              Set a password first or link another account.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkClick(provider, linked)}
                        disabled={unlinkMutation.isPending}
                        data-testid={`unlink-${provider.id}`}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Unlink
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(provider.id)}
                      disabled={linkMutation.isPending}
                      data-testid={`connect-${provider.id}`}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        open={!!unlinkDialog.provider}
        onOpenChange={() => handleUnlinkCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlink {unlinkDialog.provider?.displayName} Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection between your ARC account and{" "}
              <strong>{unlinkDialog.account?.provider_email}</strong>.
              You will no longer be able to sign in with this provider.
              You can always reconnect later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              disabled={unlinkMutation.isPending}
            >
              {unlinkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unlink Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
