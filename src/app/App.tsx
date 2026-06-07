import { RouterProvider } from "react-router";
import { router } from "./routes"; // updated to use routes.tsx
import { AuthProvider } from "./components/auth/AuthContext";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import CookiesPolicyModal from "./components/legal/CookiesPolicyModal";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <CookiesPolicyModal />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
