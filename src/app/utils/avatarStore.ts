type Listener = (url: string) => void;

class AvatarStore {
  private cache = new Map<string, string>();
  private listeners = new Map<string, Set<Listener>>();

  set(id: string, url: string) {
    if (!id || !url || !url.startsWith('http')) return;
    
    // Check if the URL has actually changed
    if (this.cache.get(id) === url) return;
    
    this.cache.set(id, url);
    
    // Notify all listeners for this specific user ID
    const idListeners = this.listeners.get(id);
    if (idListeners) {
      idListeners.forEach(listener => listener(url));
    }
  }

  get(id: string): string | undefined {
    return this.cache.get(id);
  }

  subscribe(id: string, listener: Listener) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    
    this.listeners.get(id)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(id)?.delete(listener);
    };
  }
}

export const avatarStore = new AvatarStore();
