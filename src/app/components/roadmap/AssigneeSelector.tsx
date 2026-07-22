import { useState, useRef, useEffect } from 'react';
import { useAuth, supabase } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { UserAvatar } from '../ui/UserAvatar';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Search } from 'lucide-react';
import { cn } from '../ui/utils';

interface SimpleMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isRoomMember?: boolean;
}

function useAssignableMembers(roomId?: string | null) {
  const { user } = useAuth();
  const builderId = user?.id;

  return useQuery({
    queryKey: ['assignable-members', builderId, roomId],
    queryFn: async (): Promise<SimpleMember[]> => {
      if (!builderId) return [];

      const members: SimpleMember[] = [];
      const memberIds = new Set<string>();

      // 1. Always include the builder themselves
      const { data: builderData } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .eq('id', builderId)
        .single();
      if (builderData?.id) {
        members.push({
          id: builderData.id,
          name: builderData.name || 'Builder',
          email: builderData.email || '',
          avatar: builderData.avatar || null,
          role: 'Builder',
          isRoomMember: true,
        });
        memberIds.add(builderData.id);
      }

      // 2. Fetch observers/members for room
      if (roomId) {
        const { data: observers } = await supabase
          .from('room_observers')
          .select(`role, users:observer_id(id, name, email, avatar)`)
          .eq('room_id', roomId);

        (observers || []).forEach((row: any) => {
          const u = Array.isArray(row.users) ? row.users[0] : row.users;
          if (u?.id && !memberIds.has(u.id)) {
            members.push({
              id: u.id,
              name: u.name || u.email || 'Team Member',
              email: u.email || '',
              avatar: u.avatar || null,
              role: row.role || 'observer',
              isRoomMember: true,
            });
            memberIds.add(u.id);
          }
        });
      }

      // 3. Also fetch all users from platform to allow assigning & inviting non-room members
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .limit(100);

      (allUsers || []).forEach((u: any) => {
        if (u?.id && !memberIds.has(u.id)) {
          members.push({
            id: u.id,
            name: u.name || u.email || 'User',
            email: u.email || '',
            avatar: u.avatar || null,
            role: 'User',
            isRoomMember: false,
          });
          memberIds.add(u.id);
        }
      });

      return members;
    },
    enabled: !!builderId,
  });
}

interface AssigneeSelectorProps {
  roomId: string | null;
  assignedUserIds: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  readonly?: boolean;
}

export function AssigneeSelector({ roomId, assignedUserIds, onAssign, onUnassign, readonly = false }: AssigneeSelectorProps) {
  const { data: teamMembers = [] } = useAssignableMembers(roomId);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const assignedMembers = teamMembers.filter(m => assignedUserIds.includes(m.id));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = teamMembers.filter(m => {
    const q = searchQuery.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      {/* Display Assigned Avatars */}
      <div className="flex -space-x-2 overflow-hidden">
        {assignedMembers.map(member => (
          <div key={member.id} className="relative inline-block rounded-full ring-2 ring-white" title={member.name}>
            <UserAvatar
              userId={member.id}
              avatarUrl={member.avatar}
              name={member.name}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Add Button */}
      {!readonly && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors ml-1 bg-white"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !readonly && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-slate-200 z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border-none rounded focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto p-1">
              {filteredMembers.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-500">
                  No members found
                </div>
              ) : (
                filteredMembers.map(member => {
                  const isAssigned = assignedUserIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        if (isAssigned) {
                          onUnassign(member.id);
                        } else {
                          onAssign(member.id);
                        }
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors text-left',
                        isAssigned && 'bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar userId={member.id} avatarUrl={member.avatar} name={member.name} className="w-6 h-6 rounded-full object-cover" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 truncate max-w-[140px]">{member.name}</span>
                          <span className="text-[11px] text-slate-500 capitalize">
                            {member.isRoomMember === false ? (
                              <span className="text-primary-600 font-semibold">Invites to Room</span>
                            ) : (
                              (member.role || '').replace('_', ' ')
                            )}
                          </span>
                        </div>
                      </div>
                      {isAssigned && (
                        <Check className="w-4 h-4 text-primary-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
