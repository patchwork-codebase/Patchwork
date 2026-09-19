import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { toast } from 'sonner';

export interface RoomIntegration {
  id: string;
  room_id: string;
  builder_id?: string;
  provider: string;
  platform: string;
  label?: string;
  url?: string;
  secret_token: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
}

export function useRoomIntegrations(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['room-integrations', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('room_integrations')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        provider: row.provider || row.platform || 'github',
        platform: row.platform || row.provider || 'github',
        label: row.metadata?.label || row.provider,
        url: row.url || row.metadata?.url || '',
      })) as RoomIntegration[];
    },
    enabled: !!roomId,
  });

  const setupIntegration = useMutation({
    mutationFn: async ({ provider }: { provider: 'github' | 'linear' }) => {
      if (!roomId) throw new Error('Missing room ID');

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://patchwork.build';
      const webhookUrl = `${baseUrl}/api/v1/webhooks/${provider}?roomId=${roomId}`;

      // 1. Check if integration record already exists
      const { data: existing } = await supabase
        .from('room_integrations')
        .select('*')
        .eq('room_id', roomId)
        .eq('provider', provider)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('room_integrations')
          .update({
            builder_id: userId || existing.builder_id,
            url: existing.url || webhookUrl,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as RoomIntegration;
      }

      // 2. Insert new integration record with builder_id and url populated
      const { data, error } = await supabase
        .from('room_integrations')
        .insert({
          room_id: roomId,
          builder_id: userId,
          provider,
          platform: provider,
          url: webhookUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as RoomIntegration;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-integrations', roomId] });
      toast.success(`${variables.provider === 'github' ? 'GitHub' : 'Linear'} webhook endpoint generated!`);
    },
    onError: (err: any) => {
      console.error('Setup integration error:', err);
      toast.error(err?.message || 'Failed to setup integration endpoint.');
    },
  });

  const triggerTestEvent = useMutation({
    mutationFn: async ({ provider }: { provider: 'github' | 'linear' }) => {
      if (!roomId) throw new Error('Missing room ID');

      const author = provider === 'github' ? 'GitHub Bot [bot]' : 'Linear Integration';
      const content = provider === 'github'
        ? '🔀 **GitHub Commit Shipped**: `feat(core): optimized bundle asset loading & database indexing`\n\nBranch: `main` • Author: @akinrodolu'
        : '📌 **Linear Issue Shipped**: `ENG-402: Implement Granular Role-Based Access Control`\n\nStatus: **Completed** • Assignee: @akinrodolu';

      const codeSnippet = provider === 'github' ? 'git commit -m "feat(core): optimized database queries"\n1 file changed, 45 insertions(+)' : undefined;

      const { error } = await supabase.rpc('process_integration_webhook', {
        p_room_id: roomId,
        p_provider: provider,
        p_content: content,
        p_author_name: author,
        p_code_snippet: codeSnippet,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-updates', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      toast.success(`Test ${variables.provider === 'github' ? 'GitHub' : 'Linear'} update streamed into feed!`);
    },
    onError: (err: any) => {
      console.error('Trigger test event error:', err);
      toast.error(err?.message || 'Failed to trigger test event.');
    },
  });

  return {
    ...query,
    setupIntegration,
    triggerTestEvent,
  };
}

export function useAddIntegration(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ platform, url, label, builderId }: { platform: string; url: string; label?: string; builderId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = builderId || user?.id;
      const webhookUrl = url || `${window.location.origin}/api/v1/webhooks/${platform}?roomId=${roomId}`;

      const { data: existing } = await supabase
        .from('room_integrations')
        .select('*')
        .eq('room_id', roomId)
        .eq('provider', platform)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('room_integrations')
          .update({
            builder_id: userId || existing.builder_id,
            url: webhookUrl,
            is_active: true,
            metadata: { url: webhookUrl, label, builderId: userId },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('room_integrations')
        .insert({
          room_id: roomId,
          builder_id: userId,
          provider: platform,
          platform,
          url: webhookUrl,
          is_active: true,
          metadata: { url: webhookUrl, label, builderId: userId },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-integrations', roomId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add integration');
    },
  });
}

export function useRemoveIntegration(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('room_integrations')
        .delete()
        .eq('id', integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-integrations', roomId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to remove integration');
    },
  });
}
