"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  School,
  Settings,
  AlertCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthStore, useIsHydrated } from "@/stores/auth-store";
import {
  validateSession,
  checkHealth,
  getSession,
  clearTokens,
} from "@/lib/auth/session";
import { clearSessionAction } from "@/lib/actions/auth";
import { useConnectionStatus } from "@/lib/auth/hooks";
import type { NavGroup } from "@/components/layout/sidebar";

// Grouped navigation items for site admin sidebar
const siteAdminNavGroups: NavGroup[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      {
        title: "Dashboard",
        href: "/site-admin",
        icon: LayoutDashboard,
      },
      {
        title: "Schools",
        href: "/site-admin", // For now, dashboard IS schools list
        icon: School,
      },
    ],
  },
  {
    title: "Configuration",
    defaultOpen: false,
    items: [
      {
        title: "Settings",
        href: "/site-admin/settings",
        icon: Settings,
      },
    ],
  },
];

// Loading Skeleton
function SiteAdminLayoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
        <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <School
              className="w-6 h-6 text-purple-600 animate-bounce"
              style={{ animationDuration: "3s" }}
            />
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Site Administration
        </h3>
        <p className="text-sm text-gray-500 font-medium">
          Verifying secure session...
        </p>
      </div>
    </div>
  );
}

// Session error component
function SessionError({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Session Error
        </h2>
        <p className="text-gray-500 text-sm mb-4">{message}</p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
          />
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

// Offline banner component
function OfflineBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
}

export default function SiteAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isHydrated = useIsHydrated();
  const isOnline = useConnectionStatus();

  // Component state
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState(true);

  // React 19 transition for smooth state updates
  const [isPending, startTransition] = useTransition();

  // Session validation function
  const validateUserSession = useCallback(async () => {
    setIsValidating(true);
    setSessionError(null);

    // Optimize: Check local session first (synchronous)
    const session = getSession();
    if (!session) {
      router.replace("/login/admin"); // Use admin login for site admin
      return;
    }

    try {
      const [validationResult, healthResult] = await Promise.all([
        validateSession(),
        checkHealth(),
      ]);

      setApiHealthy(healthResult.api);
      const { valid, user: validatedUser } = validationResult;

      if (!valid) {
        clearTokens();
        await clearSessionAction();
        router.replace("/login/admin");
        return;
      }

      // Check role - MUST be site_admin
      if (validatedUser?.role !== "site_admin") {
        setSessionError("You do not have site admin access.");
        // Redirect to appropriate dashboard
        if (validatedUser?.role === "admin") {
          router.replace("/admin");
        } else if (validatedUser?.role === "teacher") {
          router.replace("/teacher");
        } else if (validatedUser?.role === "student") {
          router.replace("/student");
        }
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      setSessionError("Session validation failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  }, [router]);

  // Initial validation
  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login/admin");
      return;
    }

    // Role check from store
    if (user?.role !== "site_admin") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "teacher") router.push("/teacher");
      else if (user?.role === "student") router.push("/student");
      else router.push("/login/admin");
      return;
    }

    startTransition(() => {
      validateUserSession();
    });
  }, [isHydrated, isAuthenticated, user?.role, router, validateUserSession]);

  // Periodic health check
  useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(async () => {
      const health = await checkHealth();
      setApiHealthy(health.api);
      if (!health.auth && health.api) {
        const { valid } = await validateSession();
        if (!valid) {
          clearTokens();
          logout();
          router.push("/login/admin");
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthorized, router, logout]);

  const handleRetry = () => {
    startTransition(() => {
      validateUserSession();
    });
  };

  if (!isHydrated || isValidating || isPending) {
    return <SiteAdminLayoutSkeleton />;
  }

  if (sessionError) {
    return (
      <SessionError
        message={sessionError}
        onRetry={handleRetry}
        isRetrying={isPending}
      />
    );
  }

  if (!isAuthorized) {
    return <SiteAdminLayoutSkeleton />;
  }

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <DashboardShell navGroups={siteAdminNavGroups} role="admin">
        {/* Reuse role="admin" for DashShell styles, or add site_admin support there? 
            Admin style is purple which fits Site Admin. */}
        {!apiHealthy && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="h-4 w-4 flex shrink-0" />
            <span>Server connection is unstable.</span>
          </div>
        )}
        {children}
      </DashboardShell>
    </>
  );
}
