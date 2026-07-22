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
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  labels: string[];
  created_at: string;
  updated_at: string;
  // Relationships
  roadmap_assignees?: { user_id: string; users: { name: string; avatar: string | null } }[];
  roadmap_comments?: { count: number }[];
}

export interface RoadmapAssignee {
  item_id: string;
  user_id: string;
  created_at: string;
  users: {
    name: string;
    avatar: string | null;
  };
}

export interface RoadmapComment {
  id: string;
  item_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    avatar: string | null;
  };
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
        .select(`
          *,
          roadmap_assignees(user_id, users(name, avatar)),
          roadmap_comments(count)
        `)
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
// Hooks for Assignees
export function useAssignRoadmapItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item_id, user_id }: { item_id: string; user_id: string }) => {
      // 1. Insert assignee
      const { data, error } = await supabase
        .from('roadmap_assignees')
        .insert({ item_id, user_id })
        .select()
        .single();
      if (error) throw error;

      try {
        // 2. Fetch Item & Room details
        const { data: item } = await supabase
          .from('roadmap_items')
          .select('title, room_id, builder_id, rooms(title)')
          .eq('id', item_id)
          .single();

        // 3. Fetch Assignee user details
        const { data: assigneeUser } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user_id)
          .single();

        const { data: authUserData } = await supabase.auth.getUser();
        const currentUserId = authUserData?.user?.id;
        const roomTitle = (item?.rooms as any)?.title || 'Build Room';
        const itemTitle = item?.title || 'Ticket';

        let isRoomMember = false;
        if (item?.builder_id === user_id) {
          isRoomMember = true;
        } else if (item?.room_id) {
          const { data: obs } = await supabase
            .from('room_observers')
            .select('id')
            .eq('room_id', item.room_id)
            .eq('observer_id', user_id)
            .maybeSingle();
          if (obs) isRoomMember = true;
        }

        let inviteToken: string | null = null;

        // If not a room member, trigger room invitation RPC
        if (!isRoomMember && item?.room_id && assigneeUser?.email) {
          const { data: tokenData } = await supabase.rpc('invite_user_to_room', {
            p_room_id: item.room_id,
            p_email: assigneeUser.email.trim().toLowerCase(),
            p_role: 'team_member',
          });
          inviteToken = tokenData;

          // Dispatch room invitation email
          if (inviteToken) {
            await supabase.functions.invoke('room-invitations', {
              body: {
                record: {
                  email: assigneeUser.email,
                  role: 'team_member',
                  token: inviteToken,
                  room_id: item.room_id,
                  origin: window.location.origin,
                },
              },
            }).catch(() => {});
          }
        }

        // 4. Insert in-app notification
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id,
          actor_id: currentUserId || item?.builder_id,
          type: isRoomMember ? 'ticket_assigned' : 'ticket_assigned_invite',
          reference_id: item_id,
          metadata: {
            item_id,
            ticket_title: itemTitle,
            room_id: item?.room_id,
            room_title: roomTitle,
            is_room_member: isRoomMember,
          },
        });
        if (notifErr) console.warn('In-app notification insert warning:', notifErr);

        // 5. Invoke ticket-notifications Edge function for email
        await supabase.functions.invoke('ticket-notifications', {
          body: {
            record: {
              user_id,
              metadata: {
                item_id,
                ticket_title: itemTitle,
                room_id: item?.room_id,
                room_title: roomTitle,
                is_room_member: isRoomMember,
              },
              origin: window.location.origin,
            },
            type: 'ticket_assigned',
          },
        }).catch(() => {});

      } catch (notifyErr) {
        console.warn('Notification/Email dispatch warning:', notifyErr);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_items'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnassignRoadmapItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item_id, user_id }: { item_id: string; user_id: string }) => {
      const { data, error } = await supabase
        .from('roadmap_assignees')
        .delete()
        .eq('item_id', item_id)
        .eq('user_id', user_id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_items'] });
    },
  });
}

// Hooks for Comments
export function useRoadmapComments(itemId: string) {
  return useQuery({
    queryKey: ['roadmap_comments', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_comments')
        .select(`*, users(name, avatar)`)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as RoadmapComment[];
    },
    enabled: !!itemId,
  });
}

export function useAddRoadmapComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item_id, user_id, content }: { item_id: string; user_id: string; content: string }) => {
      const { data, error } = await supabase
        .from('roadmap_comments')
        .insert({ item_id, user_id, content })
        .select()
        .single();
      if (error) throw error;

      try {
        // Fetch item details & assignees
        const { data: item } = await supabase
          .from('roadmap_items')
          .select('title, room_id, builder_id, rooms(title)')
          .eq('id', item_id)
          .single();

        const { data: assignees } = await supabase
          .from('roadmap_assignees')
          .select('user_id')
          .eq('item_id', item_id);

        const roomTitle = (item?.rooms as any)?.title || 'Build Room';
        const itemTitle = item?.title || 'Ticket';
        const notifyUsers = new Set<string>();

        if (item?.builder_id && item.builder_id !== user_id) {
          notifyUsers.add(item.builder_id);
        }
        (assignees || []).forEach(a => {
          if (a.user_id !== user_id) notifyUsers.add(a.user_id);
        });

        for (const targetUserId of Array.from(notifyUsers)) {
          try {
            await supabase.from('notifications').insert({
              user_id: targetUserId,
              actor_id: user_id,
              type: 'ticket_comment',
              reference_id: item_id,
              metadata: {
                item_id,
                ticket_title: itemTitle,
                room_id: item?.room_id,
                room_title: roomTitle,
                comment_text: content.substring(0, 100),
              },
            });
          } catch (_) {}

          await supabase.functions.invoke('ticket-notifications', {
            body: {
              record: {
                user_id: targetUserId,
                metadata: {
                  item_id,
                  ticket_title: itemTitle,
                  room_id: item?.room_id,
                  room_title: roomTitle,
                  comment_text: content.substring(0, 100),
                },
                origin: window.location.origin,
              },
              type: 'ticket_comment',
            },
          }).catch(() => {});
        }
      } catch (commentNotifyErr) {
        console.warn('Comment notification dispatch warning:', commentNotifyErr);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_comments', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['roadmap_items'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
