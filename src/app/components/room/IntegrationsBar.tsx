import { useState } from 'react';
import { Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useRoomIntegrations, useRemoveIntegration } from '../../hooks/useRoomIntegrations';
import { INTEGRATION_CONFIG, IntegrationPlatformIcon } from './IntegrationIcons';
import { AddIntegrationModal } from './AddIntegrationModal';
import type { RoomIntegration } from '../../hooks/useRoomIntegrations';

interface IntegrationsBarProps {
  roomId: string;
  builderId: string;
  isOwner: boolean;
}

function IntegrationPill({
  integration,
  isOwner,
  onRemove,
  removing,
}: {
  integration: RoomIntegration;
  isOwner: boolean;
  onRemove: (id: string) => void;
  removing: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = INTEGRATION_CONFIG[integration.platform];
  if (!cfg) return null;

  const displayLabel = integration.label || cfg.label;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={integration.url}
        target="_blank"
        rel="noopener noreferrer"
        title={displayLabel}
        aria-label={`Open ${displayLabel}`}
        className={`group flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.borderColor} ${cfg.bgColor} transition-all hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]`}
      >
        <IntegrationPlatformIcon platform={integration.platform} className="w-4 h-4 text-white shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-semibold text-white/90 max-w-[100px] truncate hidden sm:block leading-tight">
            {displayLabel}
          </span>
          {integration.platform === 'notion' && (
            <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono uppercase tracking-wider hidden sm:flex leading-tight opacity-90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Synced Live
            </span>
          )}
        </div>
        <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors shrink-0 hidden sm:block ml-1" />
      </a>

      {/* Builder-only remove button */}
      <AnimatePresence>
        {isOwner && hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            onClick={() => onRemove(integration.id)}
            disabled={removing}
            title="Remove integration"
            aria-label="Remove integration"
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-rose-500 hover:bg-rose-400 rounded-full text-white shadow-lg transition-colors z-10"
          >
            {removing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-2.5 h-2.5" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IntegrationsBar({ roomId, builderId, isOwner }: IntegrationsBarProps) {
  const { data: integrations = [], isLoading } = useRoomIntegrations(roomId);
  const removeIntegration = useRemoveIntegration(roomId);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await removeIntegration.mutateAsync(id);
      toast.success('Integration removed');
    } catch {
      toast.error('Failed to remove integration');
    } finally {
      setRemovingId(null);
    }
  }

  // Hide entirely if loading with no data yet and not owner
  if (isLoading && !isOwner) return null;

  // Hide if no integrations and not owner (nothing to show)
  if (integrations.length === 0 && !isOwner) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-3 border-t border-white/[0.05] mt-1">
        {/* Connected integrations */}
        <AnimatePresence initial={false}>
          {integrations.map(integration => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <IntegrationPill
                integration={integration}
                isOwner={isOwner}
                onRemove={handleRemove}
                removing={removingId === integration.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add button — builder only */}
        {isOwner && (
          <motion.button
            layout
            onClick={() => setAddModalOpen(true)}
            title="Add integration"
            aria-label="Add integration"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
              integrations.length === 0
                ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/20 text-[#8B7CF8]'
                : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[12px] font-semibold hidden sm:block">
              {integrations.length === 0 ? 'Add integration' : 'Add'}
            </span>
          </motion.button>
        )}

        {/* Empty state label for owner with no integrations */}
        {isOwner && integrations.length === 0 && (
          <p className="text-[11px] text-slate-600 ml-1">
            Connect GitHub, Figma, Notion, and more
          </p>
        )}
      </div>

      <AddIntegrationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        roomId={roomId}
        builderId={builderId}
      />
    </>
  );
}
