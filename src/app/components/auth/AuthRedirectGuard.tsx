import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function AuthRedirectGuard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[AuthRedirectGuard] Checking auth state:', { 
      user: !!user, 
      profile: !!profile, 
      loading, 
      pathname: location.pathname,
      hash: !!window.location.hash,
      search: !!window.location.search
    });
    
    if (!loading && user) {
      console.log('[AuthRedirectGuard] User is authenticated, redirecting to dashboard...');
      const targetRoute = profile?.role === 'observer' ? '/dashboard/observer' : '/dashboard';
      navigate(targetRoute, { replace: true });
    }
  }, [user, profile, loading, navigate, location.pathname]);

  return null;
}
