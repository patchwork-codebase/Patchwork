import { RouterProvider } from "react-router";
import { router } from "./routes"; // updated to use routes.tsx
import { AuthProvider } from "./components/auth/AuthContext";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { Analytics } from "@vercel/analytics/react";
import CookiesPolicyModal from "./components/legal/CookiesPolicyModal";

import UpdateNotification from "./components/ui/UpdateNotification";
import ErrorBoundary from "./components/ui/ErrorBoundary";

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
