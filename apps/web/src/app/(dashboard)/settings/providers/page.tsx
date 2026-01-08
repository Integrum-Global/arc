/**
 * Data Providers Settings Page
 *
 * Allows users to configure API keys for external data providers.
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  description: string;
  keyName: string;
  placeholder: string;
  docsUrl?: string;
  status: "connected" | "disconnected" | "error";
  lastChecked?: string;
}

const providers: Provider[] = [
  {
    id: "alpha-vantage",
    name: "Alpha Vantage",
    description: "Real-time and historical stock data",
    keyName: "API Key",
    placeholder: "Enter your Alpha Vantage API key",
    docsUrl: "https://www.alphavantage.co/documentation/",
    status: "disconnected",
  },
  {
    id: "polygon",
    name: "Polygon.io",
    description: "Real-time market data and financial APIs",
    keyName: "API Key",
    placeholder: "Enter your Polygon.io API key",
    docsUrl: "https://polygon.io/docs/",
    status: "disconnected",
  },
  {
    id: "finnhub",
    name: "Finnhub",
    description: "Stock API with fundamental data",
    keyName: "API Key",
    placeholder: "Enter your Finnhub API key",
    docsUrl: "https://finnhub.io/docs/api",
    status: "disconnected",
  },
  {
    id: "iex-cloud",
    name: "IEX Cloud",
    description: "Financial data for markets worldwide",
    keyName: "API Token",
    placeholder: "Enter your IEX Cloud API token",
    docsUrl: "https://iexcloud.io/docs/api/",
    status: "disconnected",
  },
];

interface ProviderState {
  apiKey: string;
  showKey: boolean;
  testing: boolean;
  status: "connected" | "disconnected" | "error";
  lastChecked?: string;
}

type ProvidersState = Record<string, ProviderState>;

function StatusBadge({ status }: { status: Provider["status"] }) {
  if (status === "connected") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Connected
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      Not Connected
    </Badge>
  );
}

interface ProviderCardProps {
  provider: Provider;
  state: ProviderState;
  onApiKeyChange: (providerId: string, value: string) => void;
  onToggleShowKey: (providerId: string) => void;
  onTestConnection: (providerId: string) => void;
  onSave: (providerId: string) => void;
}

function ProviderCard({
  provider,
  state,
  onApiKeyChange,
  onToggleShowKey,
  onTestConnection,
  onSave,
}: ProviderCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{provider.name}</CardTitle>
            <CardDescription>{provider.description}</CardDescription>
          </div>
          <StatusBadge status={state.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${provider.id}-key`}>{provider.keyName}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider.id}-key`}
                type={state.showKey ? "text" : "password"}
                value={state.apiKey}
                onChange={(e) => onApiKeyChange(provider.id, e.target.value)}
                placeholder={provider.placeholder}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => onToggleShowKey(provider.id)}
              >
                {state.showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTestConnection(provider.id)}
              disabled={!state.apiKey || state.testing}
            >
              {state.testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(provider.id)}
              disabled={!state.apiKey}
            >
              Save
            </Button>
          </div>
          {provider.docsUrl && (
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View docs
            </a>
          )}
        </div>

        {state.lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {state.lastChecked}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProvidersSettingsPage() {
  const [providersState, setProvidersState] = useState<ProvidersState>(() =>
    providers.reduce((acc, provider) => {
      acc[provider.id] = {
        apiKey: "",
        showKey: false,
        testing: false,
        status: provider.status,
        lastChecked: provider.lastChecked,
      };
      return acc;
    }, {} as ProvidersState)
  );

  const handleApiKeyChange = useCallback((providerId: string, value: string) => {
    setProvidersState((prev) => {
      const currentState = prev[providerId];
      if (!currentState) return prev;
      return {
        ...prev,
        [providerId]: {
          ...currentState,
          apiKey: value,
        },
      };
    });
  }, []);

  const handleToggleShowKey = useCallback((providerId: string) => {
    setProvidersState((prev) => {
      const currentState = prev[providerId];
      if (!currentState) return prev;
      return {
        ...prev,
        [providerId]: {
          ...currentState,
          showKey: !currentState.showKey,
        },
      };
    });
  }, []);

  const handleTestConnection = useCallback(async (providerId: string) => {
    setProvidersState((prev) => {
      const currentState = prev[providerId];
      if (!currentState) return prev;
      return {
        ...prev,
        [providerId]: {
          ...currentState,
          testing: true,
        },
      };
    });

    // Simulate API test (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate random success/failure for demo
    const success = Math.random() > 0.3;

    setProvidersState((prev) => {
      const currentState = prev[providerId];
      if (!currentState) return prev;
      return {
        ...prev,
        [providerId]: {
          ...currentState,
          testing: false,
          status: success ? "connected" : "error",
          lastChecked: new Date().toLocaleString(),
        },
      };
    });

    if (success) {
      toast.success("Connection successful", {
        description: `Successfully connected to ${providers.find((p) => p.id === providerId)?.name}`,
      });
    } else {
      toast.error("Connection failed", {
        description: "Please check your API key and try again",
      });
    }
  }, []);

  const handleSave = useCallback((providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    toast.success("API key saved", {
      description: `${provider?.name} API key has been saved`,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Data Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure API keys for external data sources
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => {
          const state = providersState[provider.id];
          if (!state) return null;
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              state={state}
              onApiKeyChange={handleApiKeyChange}
              onToggleShowKey={handleToggleShowKey}
              onTestConnection={handleTestConnection}
              onSave={handleSave}
            />
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Need a different data provider?{" "}
          <a
            href="mailto:support@arc-platform.com"
            className="text-primary hover:underline"
          >
            Contact us
          </a>{" "}
          to request an integration.
        </p>
      </div>
    </div>
  );
}
