# Frontend Architecture

## Overview

The ARC SSO frontend is built using:
- **Next.js 15** - App Router with Server and Client Components
- **React 19** - Client-side interactivity
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client auth state management
- **sessionStorage** - OAuth state persistence across redirects

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Pages)                         │
│  /login - SSO Provider Buttons                              │
│  /auth/callback - OAuth Callback Handler                    │
│  /settings/security - Linked Accounts Manager               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Component Layer                                │
│  - LinkAccountModal (Account Linking UI)                    │
│  - LinkedAccountsManager (Manage Linked Accounts)           │
│  - Brand Icons (AzureIcon, GoogleIcon, GitHubIcon)          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Hook Layer                                  │
│  - useLinkedAccounts (Query)                                │
│  - useLinkAccount (Mutation)                                │
│  - useUnlinkAccount (Mutation)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            State Management                                 │
│  - React Query (Server state)                               │
│  - Zustand (Auth state)                                     │
│  - sessionStorage (OAuth flow state)                        │
└─────────────────────────────────────────────────────────────┘
```

## OAuth Flow Overview

The frontend implements OAuth 2.0 Authorization Code Flow with PKCE:

```
┌──────────┐                                  ┌──────────┐
│          │  1. Click SSO Button             │          │
│  Login   ├─────────────────────────────────>│ Backend  │
│  Page    │                                  │   API    │
│          │<─────────────────────────────────┤          │
│          │  2. Return auth_url, state,      │          │
│          │     code_verifier                └──────────┘
│          │                                        │
│          │  3. Store in sessionStorage           │
│          │  4. Redirect to IdP                   │
│          │                                        │
└──────────┘                                        v
     │                                    ┌──────────────────┐
     │                                    │  Identity        │
     │<───────────────────────────────────┤  Provider        │
     │  5. Redirect to /auth/callback     │  (Azure/Google)  │
     │     with code & state              └──────────────────┘
     │
     v
┌──────────────┐                          ┌──────────┐
│   Callback   │  6. Retrieve from        │          │
│    Handler   │     sessionStorage       │ Backend  │
│              ├─────────────────────────>│   API    │
│              │  7. Send code, state,    │          │
│              │     code_verifier        │          │
│              │                          │          │
│              │<─────────────────────────┤          │
│              │  8. Return JWT tokens    └──────────┘
│              │     OR link_required
│              │
│              │  9. Store auth & redirect
│              │     OR show LinkAccountModal
└──────────────┘
```

## Login Page

The login page provides SSO buttons for Azure AD, Google, and GitHub.

**File**: `/apps/web/src/app/(auth)/login/page.tsx` (225 lines)

### Component Structure

```tsx
export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);

  // Handle SSO login button click
  const handleSSOLogin = async (provider: SSOProvider) => {
    // 1. Call backend API to start OAuth flow
    // 2. Store OAuth state in sessionStorage (CRITICAL!)
    // 3. Redirect to IdP authorization page
  };

  return (
    <Card>
      {/* SSO Buttons */}
      {SSO_PROVIDERS.map((provider) => (
        <Button onClick={() => handleSSOLogin(provider.id)}>
          Continue with {provider.name}
        </Button>
      ))}

      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin}>
        {/* Email and password inputs */}
      </form>
    </Card>
  );
}
```

### SSO Provider Configuration

**File**: `/apps/web/src/app/(auth)/login/page.tsx:26-46`

```tsx
const SSO_PROVIDERS = [
  {
    id: "azure" as const,
    name: "Microsoft",
    icon: AzureIcon,
    color: "bg-[#00A4EF]",
  },
  {
    id: "google" as const,
    name: "Google",
    icon: GoogleIcon,
    color: "bg-white border",
  },
  {
    id: "github" as const,
    name: "GitHub",
    icon: GitHubIcon,
    color: "bg-[#24292F]",
  },
];
```

### Starting OAuth Flow

**File**: `/apps/web/src/app/(auth)/login/page.tsx:63-94`

```tsx
const handleSSOLogin = async (provider: SSOProvider) => {
  setSsoLoading(provider);

  try {
    // Step 1: Call backend API to start OAuth flow
    const response = await fetch(`/api/v1/auth/oauth/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: "default",
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth start failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Step 2: Store OAuth state and PKCE verifier (CRITICAL!)
    // These values MUST be stored before redirect to verify callback
    sessionStorage.setItem("oauth_state", data.state);
    sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
    sessionStorage.setItem("oauth_provider", provider);
    sessionStorage.setItem("oauth_return_url", returnUrl);

    // Step 3: Redirect to IdP authorization page
    window.location.href = data.auth_url;
  } catch (error) {
    console.error("SSO error:", error);
    setSsoLoading(null);
  }
};
```

**sessionStorage Keys:**

| Key | Type | Purpose |
|-----|------|---------|
| `oauth_state` | string | CSRF protection - verified in callback |
| `oauth_code_verifier` | string | PKCE verifier - proves you initiated the flow |
| `oauth_provider` | string | Provider name for callback handler |
| `oauth_return_url` | string | Where to redirect after successful auth |

### Loading States

The login page shows loading spinners and disables all buttons during OAuth flow:

```tsx
{SSO_PROVIDERS.map((provider) => {
  const isLoadingThis = ssoLoading === provider.id;

  return (
    <Button
      onClick={() => handleSSOLogin(provider.id)}
      disabled={!!ssoLoading}  // Disable all buttons when one is loading
    >
      {isLoadingThis ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
      Continue with {provider.name}
    </Button>
  );
})}
```

## OAuth Callback Handler

The callback handler receives the authorization code from the IdP and exchanges it for JWT tokens.

**File**: `/apps/web/src/app/auth/callback/page.tsx` (208 lines)

### Component Structure

```tsx
function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [state, setState] = useState<CallbackState>("loading");
  const [linkData, setLinkData] = useState<LinkData | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // 1. Extract URL parameters (code, state)
    // 2. Retrieve stored values from sessionStorage
    // 3. Exchange code for tokens
    // 4. Handle response (success, link_required, or error)
  };

  return (
    <>
      {/* Loading/Success/Error UI */}
      <LinkAccountModal
        open={state === "link_required"}
        linkData={linkData}
        onSuccess={handleLinkSuccess}
        onCancel={handleLinkCancel}
      />
    </>
  );
}
```

### Callback States

```tsx
type CallbackState = "loading" | "success" | "link_required" | "error";
```

| State | Description | UI |
|-------|-------------|-----|
| `loading` | Exchanging code for tokens | Spinner with "Completing sign in..." |
| `success` | Authentication successful | Green checkmark with redirect message |
| `link_required` | Account exists, needs linking | Shows LinkAccountModal |
| `error` | Authentication failed | Red error icon with error message |

### Handling OAuth Callback

**File**: `/apps/web/src/app/auth/callback/page.tsx:36-107`

```tsx
const handleCallback = async () => {
  try {
    // Step 1: Extract URL parameters from IdP redirect
    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Check for error from IdP (user denied, config error, etc.)
    if (errorParam) {
      throw new Error(errorDescription || errorParam);
    }

    // Validate required parameters
    if (!code || !returnedState) {
      throw new Error("Missing authorization code or state");
    }

    // Step 2: Retrieve stored values from sessionStorage
    const storedState = sessionStorage.getItem("oauth_state");
    const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
    const provider = sessionStorage.getItem("oauth_provider");
    const returnUrl = sessionStorage.getItem("oauth_return_url") || "/dashboard";

    // Check for expired session (user took too long, browser restart, etc.)
    if (!storedState || !codeVerifier || !provider) {
      throw new Error("Session expired. Please try again.");
    }

    // Step 3: Exchange code for tokens
    const response = await fetch(`/api/auth/oauth/${provider}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        state: returnedState,
        code_verifier: codeVerifier,
        expected_state: storedState,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    // Step 4a: Handle link_required action
    if (data.action === "link_required") {
      setLinkData(data.link_data);
      setState("link_required");
      return;
    }

    // Step 4b: Success - clear sessionStorage and store auth
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_code_verifier");
    sessionStorage.removeItem("oauth_provider");
    sessionStorage.removeItem("oauth_return_url");

    // Store auth in Zustand store
    setAuth(data.user, data.access_token);
    setState("success");

    // Redirect to return URL
    setTimeout(() => {
      router.push(returnUrl);
    }, 1000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
    setState("error");
  }
};
```

### Error Handling

Common errors and their handling:

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing authorization code or state` | Invalid callback URL | Restart OAuth flow |
| `Session expired` | sessionStorage cleared or expired | Restart OAuth flow |
| `Authentication failed` | Token exchange failed | Check provider config |
| `error_description` from IdP | User denied, config error | Display error to user |

### Success Flow

```tsx
{state === "success" && (
  <div className="text-center py-8">
    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
    </div>
    <p className="mt-4 font-medium">Sign in successful!</p>
    <p className="text-sm text-muted-foreground">
      Redirecting to dashboard...
    </p>
  </div>
)}
```

## Link Account Modal

When a user tries to sign in with SSO but an account with that email already exists, the backend returns `action: "link_required"`. The frontend shows a modal asking if the user wants to link the accounts.

**File**: `/apps/web/src/components/auth/LinkAccountModal.tsx` (120 lines)

### Component Props

```tsx
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
```

### Link Account Flow

**File**: `/apps/web/src/components/auth/LinkAccountModal.tsx:40-65`

```tsx
const handleLinkAccount = async () => {
  if (!linkData) return;

  setIsLoading(true);
  setError("");

  try {
    // Call backend API to link accounts
    const response = await fetch(`/api/auth/link/${linkData.provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to link account");
    }

    // Success - notify parent component
    onSuccess(data.user, data.access_token);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to link account");
  } finally {
    setIsLoading(false);
  }
};
```

### Modal UI

```tsx
<Dialog open={open} onOpenChange={() => !isLoading && onCancel()}>
  <DialogContent>
    <DialogHeader>
      <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
      </div>
      <DialogTitle>Account Already Exists</DialogTitle>
      <DialogDescription>
        An account with email{" "}
        <strong>{linkData.provider_email}</strong>{" "}
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

    <DialogFooter>
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleLinkAccount} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Link Account
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Linked Accounts Manager

The LinkedAccountsManager component displays all linked SSO providers and allows users to link/unlink accounts.

**File**: `/apps/web/src/components/settings/LinkedAccountsManager.tsx` (219 lines)

### Component Structure

```tsx
export function LinkedAccountsManager() {
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);

  // Query hooks
  const { data: linkedAccounts = [], isPending: isLoading } = useLinkedAccounts();

  // Mutation hooks
  const linkMutation = useLinkAccount();
  const unlinkMutation = useUnlinkAccount();

  const handleLink = async (provider: string) => {
    linkMutation.mutate(provider);
  };

  const handleUnlinkConfirm = () => {
    if (unlinkProvider) {
      unlinkMutation.mutate(unlinkProvider);
      setUnlinkProvider(null);
    }
  };

  return (
    <>
      <Card>
        {/* List of providers with link/unlink buttons */}
      </Card>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={!!unlinkProvider}>
        {/* Confirmation UI */}
      </AlertDialog>
    </>
  );
}
```

### Provider List UI

**File**: `/apps/web/src/components/settings/LinkedAccountsManager.tsx:129-189`

```tsx
{PROVIDERS.map((provider) => {
  const Icon = provider.icon;
  const linked = getLinkedAccount(provider.id);

  return (
    <div
      key={provider.id}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      {/* Provider Icon and Name */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium">{provider.name}</p>
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

      {/* Link/Unlink Button */}
      <div className="flex items-center gap-2">
        {linked && (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )}

        {linked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUnlinkProvider(provider.id)}
            disabled={unlinkMutation.isPending}
          >
            <Unlink className="h-4 w-4 mr-1" />
            Unlink
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLink(provider.id)}
            disabled={linkMutation.isPending}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
})}
```

### Loading States

Shows skeleton loaders while fetching linked accounts:

```tsx
{isLoading && (
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
)}
```

## React Hooks

Custom hooks provide clean abstraction for SSO operations using React Query.

**File**: `/apps/web/src/hooks/useLinkedAccounts.ts` (107 lines)

### useLinkedAccounts Hook

Fetches linked accounts for current user.

```tsx
export function useLinkedAccounts() {
  return useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async (): Promise<LinkedAccount[]> => {
      const res = await fetch("/api/v1/auth/linked-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch linked accounts");
      }
      return res.json();
    },
  });
}
```

**Usage:**

```tsx
const { data: linkedAccounts = [], isPending, isError } = useLinkedAccounts();
```

### useLinkAccount Hook

Initiates OAuth flow to link a new provider.

**File**: `/apps/web/src/hooks/useLinkedAccounts.ts:37-74`

```tsx
export function useLinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      // Step 1: Call backend API to start OAuth flow
      const res = await fetch(`/api/v1/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          return_url: "/settings/security",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start OAuth flow: ${await res.text()}`);
      }

      const data = await res.json();

      // Step 2: Store OAuth state for callback (CRITICAL!)
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", "/settings/security");

      // Step 3: Redirect to provider OAuth page
      window.location.href = data.auth_url;

      return data;
    },
    onError: (error: Error) => {
      toast.error("Failed to start linking process", {
        description: error.message,
      });
    },
  });
}
```

**Usage:**

```tsx
const linkMutation = useLinkAccount();

// Initiate OAuth flow for Azure
linkMutation.mutate("azure");
```

### useUnlinkAccount Hook

Unlinks an SSO provider from user account.

**File**: `/apps/web/src/hooks/useLinkedAccounts.ts:79-106`

```tsx
export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/v1/auth/link/${provider}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to unlink account");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate linked accounts query to refetch
      queryClient.invalidateQueries({ queryKey: ["linked-accounts"] });
      toast.success("Account unlinked successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to unlink account", {
        description: error.message,
      });
    },
  });
}
```

**Usage:**

```tsx
const unlinkMutation = useUnlinkAccount();

// Unlink Azure account
unlinkMutation.mutate("azure");
```

## Brand Icon Components

Custom SVG icons for SSO providers.

**File**: `/apps/web/src/components/icons/providers.tsx` (84 lines)

### AzureIcon

```tsx
export function AzureIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M13.05 15.375L8.325 14.25L13.5 3L21 18.75H15.45L13.05 15.375Z"
        fill="#0089D6"
      />
      <path
        d="M8.325 14.25L3 18.75H15.45L13.05 15.375L8.325 14.25Z"
        fill="#0078D4"
      />
      <path
        d="M13.05 15.375L15.45 18.75L13.5 3L8.325 14.25L13.05 15.375Z"
        fill="#50E6FF"
        opacity="0.8"
      />
    </svg>
  );
}
```

### GoogleIcon

```tsx
export function GoogleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      {/* Additional paths for Google logo colors */}
    </svg>
  );
}
```

### GitHubIcon

```tsx
export function GitHubIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49..."
      />
    </svg>
  );
}
```

**Usage:**

```tsx
import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons/providers";

<Button>
  <AzureIcon className="h-5 w-5" />
  Continue with Microsoft
</Button>
```

## sessionStorage Management

sessionStorage is used to persist OAuth state across the IdP redirect. This is CRITICAL for security (CSRF protection) and PKCE verification.

### Storage Keys

| Key | Value | Lifetime |
|-----|-------|----------|
| `oauth_state` | Random 32-byte string | Cleared after callback |
| `oauth_code_verifier` | Random 32-byte string | Cleared after callback |
| `oauth_provider` | "azure" \| "google" \| "github" | Cleared after callback |
| `oauth_return_url` | URL to redirect after auth | Cleared after callback |

### Storage Flow

```tsx
// 1. Store before redirect (Login Page)
sessionStorage.setItem("oauth_state", data.state);
sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
sessionStorage.setItem("oauth_provider", provider);
sessionStorage.setItem("oauth_return_url", returnUrl);

// 2. Retrieve after redirect (Callback Handler)
const storedState = sessionStorage.getItem("oauth_state");
const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
const provider = sessionStorage.getItem("oauth_provider");
const returnUrl = sessionStorage.getItem("oauth_return_url");

// 3. Clear after successful auth
sessionStorage.removeItem("oauth_state");
sessionStorage.removeItem("oauth_code_verifier");
sessionStorage.removeItem("oauth_provider");
sessionStorage.removeItem("oauth_return_url");
```

### Why sessionStorage?

- **Survives redirects**: Unlike component state, persists across IdP redirect
- **Tab-scoped**: Each tab has independent OAuth flow (safer than localStorage)
- **Temporary**: Automatically cleared when tab closes
- **Same-origin only**: Cannot be accessed by IdP or other domains

## State Management

### Zustand Auth Store

Client-side auth state management.

```tsx
interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));
```

**Usage:**

```tsx
const { user, accessToken, setAuth } = useAuthStore();

// Store auth after successful login
setAuth(data.user, data.access_token);
```

### React Query

Server state management for linked accounts.

```tsx
const queryClient = new QueryClient();

// Wrap app with provider
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Cache invalidation:**

```tsx
// After unlinking account, invalidate cache to refetch
queryClient.invalidateQueries({ queryKey: ["linked-accounts"] });
```

## Error Handling

### Frontend Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| **Network Errors** | Fetch failed, timeout | Show error message, allow retry |
| **Validation Errors** | Missing params, invalid state | Clear sessionStorage, restart flow |
| **IdP Errors** | User denied, config error | Display error_description from IdP |
| **Backend Errors** | Token exchange failed | Display error message from API |

### Error Display

```tsx
{state === "error" && (
  <div className="text-center py-8 space-y-4">
    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
      <AlertCircle className="h-6 w-6 text-destructive" />
    </div>
    <div>
      <p className="font-medium text-destructive">Sign in failed</p>
      <Alert variant="destructive" className="mt-4 text-left">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
    <Button variant="outline" onClick={() => router.push("/login")}>
      Back to Login
    </Button>
  </div>
)}
```

### Toast Notifications

Using `sonner` for non-blocking notifications:

```tsx
import { toast } from "sonner";

// Success toast
toast.success("Account unlinked successfully");

// Error toast with description
toast.error("Failed to start linking process", {
  description: error.message,
});
```

## Testing

### Unit Tests

Test individual components and hooks in isolation.

**File**: `/tests/unit/app/auth/login.test.tsx` (390 lines)

```tsx
describe("LoginPage", () => {
  describe("SSO Button Interactions", () => {
    it("calls OAuth API when Azure button is clicked", async () => {
      const mockResponse = {
        auth_url: "https://login.microsoftonline.com/...",
        state: "test-state",
        code_verifier: "test-verifier",
        return_url: "/dashboard",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      fireEvent.click(azureButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/v1/auth/oauth/azure",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              tenant_id: "default",
              return_url: "/dashboard",
            }),
          })
        );
      });
    });

    it("stores OAuth state in sessionStorage", async () => {
      const mockResponse = {
        auth_url: "https://login.microsoftonline.com/...",
        state: "test-state-123",
        code_verifier: "test-verifier-456",
        return_url: "/dashboard",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("oauth_state")).toBe("test-state-123");
        expect(sessionStorage.getItem("oauth_code_verifier")).toBe("test-verifier-456");
        expect(sessionStorage.getItem("oauth_provider")).toBe("google");
      });
    });
  });
});
```

### Hook Tests

Test React Query hooks with mock fetch.

**File**: `/tests/unit/hooks/useLinkedAccounts.test.tsx` (354 lines)

```tsx
describe("useLinkedAccounts", () => {
  it("fetches linked accounts on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLinkedAccounts,
    });

    const { result } = renderHook(() => useLinkedAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/linked-accounts");
    expect(result.current.data).toEqual(mockLinkedAccounts);
  });
});

describe("useUnlinkAccount", () => {
  it("invalidates linked-accounts query on success", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUnlinkAccount(), { wrapper });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["linked-accounts"],
    });
  });
});
```

### Testing Approach

1. **Unit Tests**: Test components and hooks in isolation with mocked dependencies
2. **Integration Tests**: Test full OAuth flow with mock IdP responses
3. **Manual Testing**: Test with real Azure AD, Google, and GitHub apps

**Test Coverage:**
- Login page rendering and SSO buttons
- OAuth state storage in sessionStorage
- Callback handler with various response types
- Link/unlink mutations with React Query
- Error handling and loading states
- sessionStorage cleanup after successful auth

## Performance Considerations

### Code Splitting

Use Next.js dynamic imports for SSO-related components:

```tsx
import dynamic from "next/dynamic";

const LinkedAccountsManager = dynamic(
  () => import("@/components/settings/LinkedAccountsManager"),
  { ssr: false }
);
```

### React Query Caching

Linked accounts are cached for 5 minutes (default):

```tsx
const { data: linkedAccounts } = useLinkedAccounts();
// No refetch on component remount within 5 minutes
```

### Optimistic Updates

Show loading states immediately for better UX:

```tsx
const linkMutation = useLinkAccount();

// Show loading state before redirect
linkMutation.mutate("azure");
// User sees spinner, then redirected to IdP
```

## Security Considerations

### CSRF Protection

State parameter prevents CSRF attacks:

```tsx
// Frontend generates and stores state
sessionStorage.setItem("oauth_state", data.state);

// Backend validates state matches
if (!secrets.compare_digest(state, expected_state)) {
  raise ValueError("Invalid state parameter")
}
```

### PKCE Protection

Code verifier proves frontend initiated the flow:

```tsx
// Frontend stores verifier
sessionStorage.setItem("oauth_code_verifier", data.code_verifier);

// Backend validates verifier matches challenge
// SHA256(verifier) === code_challenge
```

### sessionStorage Security

- **Tab-scoped**: Each tab has independent OAuth flow
- **Cleared after auth**: No persistent storage of sensitive data
- **Same-origin only**: Cannot be accessed by IdP or other domains
- **HTTPS only**: Ensure production uses HTTPS

## Summary

The ARC SSO frontend provides:

1. **Login Page**: SSO buttons for Azure AD, Google, and GitHub with loading states
2. **Callback Handler**: Processes OAuth redirects and handles link_required flows
3. **Linked Accounts Manager**: UI for managing linked SSO providers
4. **React Hooks**: Clean abstraction for SSO operations with React Query
5. **Link Account Modal**: Prompts user to link accounts when email already exists
6. **Brand Icons**: Custom SVG icons for SSO providers
7. **sessionStorage Management**: Persists OAuth state across IdP redirects
8. **Error Handling**: Comprehensive error display with toast notifications
9. **Testing**: 79+ unit tests covering all SSO flows

**Next Steps:**
- [Backend Architecture](./01-backend-architecture.md) - Backend implementation details
- [Azure Setup](./03-azure-setup.md) - Configure Azure AD multi-tenant
- [Testing SSO](./06-testing-sso.md) - Comprehensive testing guide
