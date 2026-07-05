import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { toast } from 'sonner';
import type { 
  DiscoveryProject, 
  DiscoveryHypothesis, 
  DiscoveryAssumption, 
  DiscoveryInterview, 
  DiscoverySignal, 
  DiscoveryDecision 
} from '../types/discovery';

// PROJECTS
export function useDiscoveryProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('discovery_projects')
        .select('*')
        .eq('builder_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoveryProject[];
    },
    enabled: !!userId,
  });
}

export function useDiscoveryProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('discovery_projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as DiscoveryProject | null;
    },
    enabled: !!projectId,
  });
}

// HYPOTHESES
export function useDiscoveryHypotheses(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_hypotheses', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('discovery_hypotheses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DiscoveryHypothesis[];
    },
    enabled: !!projectId,
  });
}

// ASSUMPTIONS
export function useDiscoveryAssumptions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_assumptions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('discovery_assumptions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoveryAssumption[];
    },
    enabled: !!projectId,
  });
}

// INTERVIEWS
export function useDiscoveryInterviews(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_interviews', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('discovery_interviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoveryInterview[];
    },
    enabled: !!projectId,
  });
}

// SIGNALS
export function useDiscoverySignals(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_signals', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('discovery_signals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoverySignal[];
    },
    enabled: !!projectId,
  });
}

// DECISIONS
export function useDiscoveryDecisions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['discovery_decisions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('discovery_decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoveryDecision[];
    },
    enabled: !!projectId,
  });
}

// MUTATIONS

// 1. Create Project
export function useCreateDiscoveryProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryProject>) => {
      const { data, error } = await supabase.from('discovery_projects').insert(payload).select().single();
      if (error) throw error;
      return data as DiscoveryProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery_projects'] });
      toast.success('Discovery project created!');
    },
  });
}

// 2. Add/Update Assumption
export function useMutateAssumption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryAssumption>) => {
      if (payload.id) {
        const { data, error } = await supabase.from('discovery_assumptions').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return data as DiscoveryAssumption;
      } else {
        const { data, error } = await supabase.from('discovery_assumptions').insert(payload).select().single();
        if (error) throw error;
        return data as DiscoveryAssumption;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_assumptions', data.project_id] });
    },
  });
}

// 3. Add Interview
export function useMutateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryInterview>) => {
      if (payload.id) {
        const { data, error } = await supabase.from('discovery_interviews').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return data as DiscoveryInterview;
      } else {
        const { data, error } = await supabase.from('discovery_interviews').insert(payload).select().single();
        if (error) throw error;
        return data as DiscoveryInterview;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_interviews', data.project_id] });
      toast.success('Interview saved');
    },
  });
}

// 4. Add Signal
export function useAddSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoverySignal>) => {
      const { data, error } = await supabase.from('discovery_signals').insert(payload).select().single();
      if (error) throw error;
      return data as DiscoverySignal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_signals', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['discovery_project', data.project_id] }); // refresh confidence score
      toast.success('Signal added');
    },
  });
}

// 5. Submit Decision
export function useSubmitDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryDecision>) => {
      const { data, error } = await supabase.from('discovery_decisions').insert(payload).select().single();
      if (error) throw error;
      
      // Update the project status
      let newStatus = 'active';
      if (payload.decision === 'proceed_to_build') newStatus = 'converted';
      if (payload.decision === 'kill_idea') newStatus = 'killed';
      
      if (newStatus !== 'active') {
        await supabase.from('discovery_projects').update({ status: newStatus }).eq('id', payload.project_id!);
      }

      return data as DiscoveryDecision;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_decisions', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['discovery_project', data.project_id] });
    },
  });
}

// 6. Update Project Details
export function useUpdateDiscoveryProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('discovery_projects')
        .update(payload)
        .eq('id', payload.id)
        .select()
        .single();
      if (error) throw error;
      return data as DiscoveryProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['discovery_projects', data.builder_id] });
      toast.success('Project details updated!');
    },
  });
}

// 7. Add/Update Hypothesis
export function useMutateHypothesis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DiscoveryHypothesis>) => {
      if (payload.id) {
        const { data, error } = await supabase.from('discovery_hypotheses').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return data as DiscoveryHypothesis;
      } else {
        const { data, error } = await supabase.from('discovery_hypotheses').insert(payload).select().single();
        if (error) throw error;
        return data as DiscoveryHypothesis;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery_hypotheses', data.project_id] });
      toast.success('Hypothesis saved');
    },
  });
}

// 8. Delete Entity
export function useDeleteDiscoveryEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: 'discovery_hypotheses' | 'discovery_assumptions' | 'discovery_interviews' | 'discovery_signals'; id: string }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { table, id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [data.table] });
      queryClient.invalidateQueries({ queryKey: ['discovery_project'] }); // reload confidence score or project in case trigger changes it
    },
  });
}

