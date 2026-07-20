import { useState, useEffect } from 'react';
import { avatarStore } from '../utils/avatarStore';

export function useAvatar(userId: string, name?: string | null, initialUrl?: string | null) {
  const [avatarUrl, setAvatarUrl] = useState(() => {
    // 1. Highest priority: check the reactive global store
    const cached = avatarStore.get(userId);
    if (cached) return cached;
    
    // 2. Next priority: if a valid real image is provided directly
    if (initialUrl && initialUrl.startsWith('http')) return initialUrl;
    
    // 3. Fallback priority: generated Dicebear avatar
    const seed = userId || name || 'default';
    return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
  });

  useEffect(() => {
    if (!userId) return;

    // Subscribe to real-time updates for this user's avatar
    const unsubscribe = avatarStore.subscribe(userId, (newUrl) => {
      setAvatarUrl(newUrl);
    });
    
    // Check if the store was updated right before we subscribed
    const current = avatarStore.get(userId);
    if (current && current !== avatarUrl) {
      setAvatarUrl(current);
    }
    
    return unsubscribe;
  }, [userId]); // removed avatarUrl from deps to prevent unnecessary resubscriptions

  return avatarUrl;
}
