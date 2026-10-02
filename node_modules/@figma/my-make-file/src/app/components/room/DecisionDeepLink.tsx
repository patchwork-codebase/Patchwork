import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { Loader2 } from "lucide-react";

export default function DecisionDeepLink() {
  const { roomId, decisionId } = useParams<{ roomId: string; decisionId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // User is not authenticated. Save the destination URL and redirect to login.
      localStorage.setItem("authRedirectUrl", `/dashboard/build-logs/${roomId}?updateId=${decisionId}`);
      navigate("/login", { replace: true });
    } else {
      // User is authenticated, navigate directly to the decision log in the authenticated space
      navigate(`/dashboard/build-logs/${roomId}?updateId=${decisionId}`, { replace: true });
    }
  }, [user, loading, navigate, roomId, decisionId]);

  // Render a loading state while checking auth
  return (
    <div className="min-h-screen bg-[#0E0C16] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Opening decision log...</p>
      </div>
    </div>
  );
}
