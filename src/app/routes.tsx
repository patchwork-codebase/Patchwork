import { createBrowserRouter, redirect, useRouteError } from "react-router";

const GlobalFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
  </div>
);

const RouteErrorBoundary = () => {
  const error = useRouteError() as any;
  
  if (
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    (error?.name === "TypeError" && error?.message?.includes("fetch"))
  ) {
    const reloadCount = parseInt(sessionStorage.getItem("chunk-reload-count") || "0", 10);
    if (reloadCount < 2) {
      sessionStorage.setItem("chunk-reload-count", (reloadCount + 1).toString());
      window.location.reload();
      return null;
    }
  }

  sessionStorage.removeItem("chunk-reload-count");

  return (
    <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center p-4">
      <div className="bg-[#1C1A24] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-slate-400 text-[15px] mb-8 leading-relaxed">
          {error?.message || "We encountered an unexpected error while trying to load this screen."}
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem("chunk-reload-count");
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    HydrateFallback: GlobalFallback,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public landing and auth
      {
        path: "/",
        lazy: () => import("./components/landing/LandingPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/onboarding",
        lazy: () => import("./components/auth/AuthPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/onbaording",
        loader: () => redirect("/onboarding"),
      },
      {
        path: "/login",
        lazy: () => import("./components/auth/AuthPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/verify-email",
        lazy: () => import("./components/auth/VerifyEmail").then(m => ({ Component: m.default })),
      },
      {
        path: "/observer-onboarding",
        lazy: () => import("./components/observer/ObserverOnboarding").then(m => ({ Component: m.default })),
      },
      {
        path: "/terms",
        lazy: () => import("./components/legal/TermsOfService").then(m => ({ Component: m.default })),
      },
      {
        path: "/privacy",
        lazy: () => import("./components/legal/PrivacyPolicy").then(m => ({ Component: m.default })),
      },

      // Authenticated dashboard shell
      {
        path: "/dashboard",
        lazy: () => import("./components/layout/Layout").then(m => ({ Component: m.default })),
        children: [
          { index: true, lazy: () => import("./components/dashboard/Dashboard").then(m => ({ Component: m.default })) },
          { path: "create", lazy: () => import("./components/room/CreateRoom").then(m => ({ Component: m.default })) },
          { path: "room/:id", lazy: () => import("./components/room/BuildRoom").then(m => ({ Component: m.default })) },
          { path: "profile/:id", lazy: () => import("./components/profile/UserProfile").then(m => ({ Component: m.default })) },
          { path: "observer", lazy: () => import("./components/observer/ObserverHub").then(m => ({ Component: m.default })) },
          { path: "explore", lazy: () => import("./components/explore/ExplorePage").then(m => ({ Component: m.default })) },
          { path: "build-logs", lazy: () => import("./components/dashboard/BuildLogs").then(m => ({ Component: m.default })) },
          { path: "notifications", lazy: () => import("./components/dashboard/Notifications").then(m => ({ Component: m.default })) },
        ],
      },
    ]
  }
]);
