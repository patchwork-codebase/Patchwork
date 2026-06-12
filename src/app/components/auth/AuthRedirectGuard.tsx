import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function AuthRedirectGuard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (location.pathname === '/onboarding') return;

      const needsOnboarding = profile?.role === 'builder' ? !profile.domain : !(profile?.interests?.length);
      
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        const targetRoute = profile?.role === 'observer' ? '/dashboard/observer' : '/dashboard';
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  return null;
}
