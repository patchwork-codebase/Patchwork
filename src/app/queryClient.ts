import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes stale time by default
      refetchOnWindowFocus: false, // disable automatic window refetch to save requests
      retry: 1, // retry failed queries once
    },
  },
});
