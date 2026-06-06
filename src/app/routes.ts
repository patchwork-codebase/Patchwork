import { createBrowserRouter, redirect } from "react-router";
import AuthPage from "./components/auth/AuthPage";
import BuildRoom from "./components/room/BuildRoom";
import CreateRoom from "./components/room/CreateRoom";
import Dashboard from "./components/dashboard/Dashboard";
import BuildLogs from "./components/dashboard/BuildLogs";
import ExplorePage from "./components/explore/ExplorePage";
import ObserverHub from "./components/observer/ObserverHub";
import ObserverOnboarding from "./components/observer/ObserverOnboarding";
import LandingPage from "./components/landing/LandingPage";
import Layout from "./components/layout/Layout";
import UserProfile from "./components/profile/UserProfile";
import VerifyEmail from "./components/auth/VerifyEmail";

export const router = createBrowserRouter([
  // Public landing and auth
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/onboarding",
    Component: AuthPage,
  },
  {
    path: "/onbaording",
    loader: () => redirect("/onboarding"),
  },
  {
    path: "/login",
    Component: AuthPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmail,
  },

  {
    path: "/observer-onboarding",
    Component: ObserverOnboarding,
  },

  // Authenticated dashboard shell
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "create", Component: CreateRoom },
      { path: "room/:id", Component: BuildRoom },
      { path: "profile/:id", Component: UserProfile },
      { path: "observer", Component: ObserverHub },
      { path: "explore", Component: ExplorePage },
      { path: "build-logs", Component: BuildLogs },
    ],
  },
]);

