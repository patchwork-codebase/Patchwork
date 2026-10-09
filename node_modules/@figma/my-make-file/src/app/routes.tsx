import { createBrowserRouter, redirect, useRouteError, Outlet } from "react-router";
import { AuthProvider } from "./components/auth/AuthContext";

function AuthWrapper() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

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
    try {
      const reloadCount = parseInt(sessionStorage.getItem("chunk-reload-count") || "0", 10);
      if (reloadCount < 2) {
        sessionStorage.setItem("chunk-reload-count", (reloadCount + 1).toString());
        window.location.reload();
        return null;
      }
    } catch (e) {
      // sessionStorage might be disabled or unavailable, skip auto-reload and show error UI
      console.error("Failed to access sessionStorage for chunk reload:", e);
    }
  }

  try {
    sessionStorage.removeItem("chunk-reload-count");
  } catch (e) {}

  const isNotFound = error?.status === 404 || 
                     error?.statusText === "Not Found" || 
                     error?.data?.includes?.("No route matches") ||
                     error?.message?.includes?.("No route matches");

  const title = isNotFound ? "Page Not Found" : "Something went wrong";
  const description = isNotFound
    ? "The page or profile you are looking for doesn't exist, or has been moved."
    : (error?.message && !error.message.includes("Postgrest")
        ? error.message
        : "We encountered an unexpected issue while trying to load this screen.");

  return (
    <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center p-4">
      <div className="bg-[#1C1A24] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 text-[15px] mb-8 leading-relaxed break-words">
          {description}
        </p>
        <div className="flex flex-col gap-3">
          {isNotFound ? (
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
            >
              Go to Home
            </a>
          ) : (
            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem("chunk-reload-count");
                } catch (e) {}
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
            >
              Reload Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    HydrateFallback: GlobalFallback,
    errorElement: <RouteErrorBoundary />,
    Component: AuthWrapper,
    children: [
      // Public landing and auth
      {
        path: "/",
        lazy: () => import("./components/landing/LandingPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/onboarding",
        lazy: () => import("./components/auth/OnboardingWizard").then(m => ({ Component: m.default })),
      },
      {
        path: "/u/:username",
        lazy: () => import("./components/portfolio/BuilderPortfolioView").then(m => ({ Component: m.BuilderPortfolioView })),
      },
      {
        path: "/u/:username/pow",
        lazy: () => import("./components/portfolio/BuilderPortfolioView").then(m => ({ Component: m.BuilderPortfolioView })),
      },
      // Handle-style URLs (/@username, /@username/pow). React Router does not support
      // partial dynamic segments ("/@:username"), so match the whole segment and require "@".
      {
        path: "/:username",
        loader: ({ params }) => {
          if (!params.username?.startsWith("@")) throw new Response("Not Found", { status: 404 });
          return null;
        },
        lazy: () => import("./components/portfolio/BuilderPortfolioView").then(m => ({ Component: m.BuilderPortfolioView })),
      },
      {
        path: "/:username/pow",
        loader: ({ params }) => {
          if (!params.username?.startsWith("@")) throw new Response("Not Found", { status: 404 });
          return null;
        },
        lazy: () => import("./components/portfolio/BuilderPortfolioView").then(m => ({ Component: m.BuilderPortfolioView })),
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
        path: "/signup",
        lazy: () => import("./components/auth/AuthPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/forgot-password",
        lazy: () => import("./components/auth/ForgotPasswordPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/reset-password",
        lazy: () => import("./components/auth/ResetPasswordPage").then(m => ({ Component: m.default })),
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
        path: "/credentials/:id",
        lazy: () => import("./components/pow/CredentialPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/verify",
        lazy: () => import("./components/pow/VerifyCredentialPage").then(m => ({ Component: m.default })),
      },
      // {
      //   path: "/learning-hub",
      //   lazy: () => import("./components/learning-hub/LearningHub").then(m => ({ Component: m.default })),
      // },
      {
        path: "/terms",
        lazy: () => import("./components/legal/TermsOfService").then(m => ({ Component: m.default })),
      },
      {
        path: "/privacy",
        lazy: () => import("./components/legal/PrivacyPolicy").then(m => ({ Component: m.default })),
      },
      {
        path: "/ip-framework",
        lazy: () => import("./components/legal/IPFrameworkPage").then(m => ({ Component: m.default })),
      },
      {
        path: "/build-room/:roomId/decision/:decisionId",
        lazy: () => import("./components/room/DecisionDeepLink").then(m => ({ Component: m.default })),
      },
      {
        path: "/room/:id",
        lazy: () => import("./components/room/BuildRoom").then(m => ({ Component: m.default })),
      },
      {
        path: "/pm-studio",
        lazy: () => import("./components/pm-studio/PMStudioLayout").then(m => ({ Component: m.default })),
        children: [
          { index: true, lazy: () => import("./components/pm-studio/PMStudioDashboard").then(m => ({ Component: m.default })) },
          { path: "decisions", lazy: () => import("./components/pm-studio/PMDecisionList").then(m => ({ Component: m.default })) },
          { path: "decisions/:id", lazy: () => import("./components/pm-studio/PMDecisionSimulator").then(m => ({ Component: m.default })) },
          { path: "case-studies", lazy: () => import("./components/pm-studio/PMCaseStudyList").then(m => ({ Component: m.default })) },
          { path: "case-studies/:id", lazy: () => import("./components/pm-studio/PMScenarioPlayer").then(m => ({ Component: m.default })) },
          { path: "profile", lazy: () => import("./components/pm-studio/PMProfile").then(m => ({ Component: m.default })) },
        ]
      },

      // Authenticated dashboard shell
      {
        path: "/dashboard",
        lazy: () => import("./components/layout/Layout").then(m => ({ Component: m.default })),
        children: [
          { index: true, lazy: () => import("./components/dashboard/Dashboard").then(m => ({ Component: m.default })) },
          { path: "create", lazy: () => import("./components/room/CreateRoom").then(m => ({ Component: m.default })) },
          { path: "room/:id", lazy: () => import("./components/room/BuildRoom").then(m => ({ Component: m.default })) },
          { path: "rooms", lazy: () => import("./components/dashboard/MyRoomsPage").then(m => ({ Component: m.default })) },
          { path: "followed-rooms", lazy: () => import("./components/dashboard/FollowedRoomsPage").then(m => ({ Component: m.default })) },
          { path: "profile/:id", lazy: () => import("./components/profile/UserProfile").then(m => ({ Component: m.default })) },
          { path: "observer", lazy: () => import("./components/observer/ObserverHub").then(m => ({ Component: m.default })) },
          { path: "observer/bounties", lazy: () => import("./components/observer/BountyDashboard").then(m => ({ Component: m.default })) },
          { path: "explore", lazy: () => import("./components/explore/ExplorePage").then(m => ({ Component: m.default })) },
          ...(import.meta.env.DEV ? [{ path: "experts", lazy: () => import("./components/explore/ExpertsDirectory").then(m => ({ Component: m.default })) }] : []),
          { path: "logs", loader: () => redirect("/dashboard/build-logs") },
          { path: "build-logs", lazy: () => import("./components/dashboard/BuildLogs").then(m => ({ Component: m.default })) },
          { path: "build-logs/:roomId", lazy: () => import("./components/dashboard/RoomLogPage").then(m => ({ Component: m.default })) },
          { path: "notifications", lazy: () => import("./components/dashboard/Notifications").then(m => ({ Component: m.default })) },
          { path: "expert-apply", lazy: () => import("./components/profile/VerifiedExpertApplication").then(m => ({ Component: m.default })) },
          { path: "expert-hub", lazy: () => import("./components/dashboard/ExpertReviewHub").then(m => ({ Component: m.default })) },
          { path: "roadmap", lazy: () => import("./components/dashboard/RoadmapPage").then(m => ({ Component: m.default })) },
          { path: "milestones", lazy: () => import("./components/dashboard/MilestonesPage").then(m => ({ Component: m.default })) },
          { path: "analytics", lazy: () => import("./components/dashboard/AnalyticsPage").then(m => ({ Component: m.default })) },
          { path: "messages", lazy: () => import("./components/chat/MessagesLayout").then(m => ({ Component: m.default })), children: [
            { path: ":roomId", lazy: () => import("./components/chat/ChatThread").then(m => ({ Component: m.default })) }
          ]},
          { path: "discovery", lazy: () => import("./components/discovery/DiscoveryHub").then(m => ({ Component: m.default })) },
          { path: "discovery/:id", lazy: () => import("./components/discovery/DiscoveryDashboard").then(m => ({ Component: m.default })) },
          { path: "achievements", lazy: () => import("./components/pow/AchievementsPage").then(m => ({ Component: m.default })) },
          { path: "leaderboard", lazy: () => import("./components/dashboard/LeaderboardPage").then(m => ({ Component: m.default })) },
        ],
      },
      { path: "/profile", loader: () => redirect("/dashboard") },
      { path: "/profile/:id", loader: ({ params }) => redirect(`/dashboard/profile/${params.id}`) },
    ]
  }
]);
