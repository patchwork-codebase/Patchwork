import { Lock } from "lucide-react";
import { IntegrationsBar } from "./IntegrationsBar";

export function RoomWorkspaceTab({ roomId, builderId, user }: any) {
  return (
    <div className="mb-8 p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
      <div className="text-center mb-8">
        <h3 className="text-[18px] font-bold text-slate-900 mb-2">Product Workspace</h3>
        <p className="text-[14px] text-slate-500 max-w-[400px] mx-auto">
          Connect your Notion PRDs, Linear Roadmaps, and GitHub repos to maintain a single source of truth.
        </p>
      </div>
      
      <div className="max-w-[800px] mx-auto mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[13px] font-bold text-slate-700 mb-1">Privacy & Security</h4>
          <p className="text-[12px] text-slate-500 leading-relaxed font-medium">Patchwork only stores reference URLs to your documents. We do not store your private code or PRD content. Observers can only view documents you have explicitly made public in the source application.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="text-[14px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-400"></span>
            Linked Artifacts
          </h4>
          <IntegrationsBar roomId={roomId} builderId={builderId} isOwner={!!(user && user.id === builderId)} />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
            <div className="px-3 py-1 bg-primary-400/10 border border-primary-400/20 text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3">
              Coming Soon
            </div>
            <span className="text-[14px] font-semibold text-slate-900">Native Artifacts</span>
            <p className="text-[12px] text-slate-500 mt-2 px-6 font-medium">
              Create and edit PRDs and Roadmaps directly inside Patchwork.
            </p>
          </div>
          <div className="opacity-40 pointer-events-none w-full">
            <div className="w-full h-8 bg-slate-200 rounded-md mb-2"></div>
            <div className="w-3/4 h-8 bg-slate-200 rounded-md mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
