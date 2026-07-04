import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface RoadmapItem {
  id: string;
  builder_id: string;
  room_id: string | null;
  sprint_id: string | null;
  title: string;
  description: string | null;
  status: 'now' | 'next' | 'later' | 'completed';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  builder_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RoadmapDependency {
  id: string;
  item_id: string;
  depends_on_item_id: string;
  created_at: string;
}

// Hooks for Roadmap Items
export function useRoadmapItems(builderId: string) {
  return useQuery({
    queryKey: ['roadmap_items', builderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .eq('builder_id', builderId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as RoadmapItem[];
    },
    enabled: !!builderId,
  });
}

export function useCreateRoadmapItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newItem: Partial<RoadmapItem>) => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .insert(newItem)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_items', data.builder_id] });
    },
  });
}

export function useUpdateRoadmapItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RoadmapItem> }) => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_items', data.builder_id] });
    },
  });
}

export function useDeleteRoadmapItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapItem;
    },
    onSuccess: (data) => {
      if (data?.builder_id) {
        queryClient.invalidateQueries({ queryKey: ['roadmap_items', data.builder_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['roadmap_items'] });
      }
    },
  });
}

// Hooks for Sprints
export function useSprints(builderId: string) {
  return useQuery({
    queryKey: ['sprints', builderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('builder_id', builderId)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!builderId,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSprint: Partial<Sprint>) => {
      const { data, error } = await supabase
        .from('sprints')
        .insert(newSprint)
        .select()
        .single();
      if (error) throw error;
      return data as Sprint;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.builder_id] });
    },
  });
}

// Hooks for Dependencies
export function useDependencies(builderId: string) {
  return useQuery({
    queryKey: ['roadmap_dependencies', builderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_dependencies')
        .select('*, roadmap_items!item_id(builder_id)')
        .eq('roadmap_items.builder_id', builderId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!builderId,
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dep: { item_id: string; depends_on_item_id: string }) => {
      const { data, error } = await supabase
        .from('roadmap_dependencies')
        .insert(dep)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_dependencies'] });
    },
  });
}
