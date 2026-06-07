import { createBrowserRouter, redirect } from "react-router";

export const router = createBrowserRouter([
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
]);
