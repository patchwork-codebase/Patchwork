import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function AuthRedirectGuard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (!profile) return;

      const localSignupComplete = localStorage.getItem(`signup_completed_${user.id}`) === 'true';
      const needsOnboarding = (profile?.signup_completed_at 
        ? false 
        : (profile?.role === 'builder' ? !profile.domain : !(profile?.interests?.length))) && !localSignupComplete;
      
      if (needsOnboarding) {
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } else {
        const targetRoute = profile?.role === 'observer' ? '/dashboard/observer' : '/dashboard';
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  return null;
}
