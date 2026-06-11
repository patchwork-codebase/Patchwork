import { RouterProvider, useNavigate, useLocation } from "react-router";
import { router } from "./routes"; // updated to use routes.tsx
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { Analytics } from "@vercel/analytics/react";
import CookiesPolicyModal from "./components/legal/CookiesPolicyModal";
import { useEffect } from "react";

import UpdateNotification from "./components/ui/UpdateNotification";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Central auth redirect handler
function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Auth state:", { user, profile, loading, pathname: location.pathname });
    
    if (!loading && user) {
      // If we're on a public page and logged in, redirect to dashboard
      const publicRoutes = ['/', '/login', '/onboarding'];
      if (publicRoutes.includes(location.pathname)) {
        console.log("Redirecting to dashboard...");
        const targetRoute = profile?.role === 'observer' ? '/dashboard/observer' : '/dashboard';
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <CookiesPolicyModal />
          <UpdateNotification />
          <Toaster position="bottom-right" richColors />
          <Analytics />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
