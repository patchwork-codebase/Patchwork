import React from 'react';
import { useParams, Link } from 'react-router';
import { Award, Download, Copy, Linkedin, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { HammerIcon } from '../layout/LayoutIcons';
import { useQuery } from '@tanstack/react-query';
import { supabase, useAuth } from '../auth/AuthContext';
import { UserBadge } from '../../types/pow';
import { getAvatarUrl, generateLinkedInCertUrl } from '../../utils/helpers';
import { useProfile } from '../../hooks/useProfile';
import { useState } from 'react';

export default function CredentialPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: authProfile } = useProfile(user?.id);
  
  // Fetch the credential (user_badge) by ID
  const { data: credential, isLoading: loadingCred } = useQuery({
    queryKey: ['credential', id],
    queryFn: async () => {
      // Mock fallback if it's the hardcoded demo ID
      if (id === 'minutes-1000-0f8922') {
        return null;
      }
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as UserBadge;
    },
    enabled: !!id
  });

  // Fetch the profile of the user who owns this credential
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['credential_profile', credential?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', credential!.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!credential?.user_id
  });

  const certId = credential?.id || "minutes-1000-0f8922";
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Allow state to update and UI to reflect downloading state if needed
    setTimeout(() => {
      window.print();
      setIsDownloading(false);
    }, 500);
  };

  if (loadingCred || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Use real data if available, otherwise fallback to the authenticated user's profile for the demo view
  const actualProfile = profile || authProfile;
  const recipientName = actualProfile?.full_name || "Akinrodolu Seun";
  const recipientRole = actualProfile?.bio?.slice(0, 50) || "Senior Product Manager";
  const avatarId = credential?.user_id || user?.id || "default";
  const avatarUrl = actualProfile?.avatar_url || getAvatarUrl(avatarId);

  const certificateDate = credential ? new Date(credential.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "February 23, 2026";
  const certificateTitle = credential?.badge?.title || "Complete 1000 mentorship minutes";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <style>{`
        @media print {
          @page { margin: 0; size: landscape; }
          body * { visibility: hidden; }
          #certificate-container, #certificate-container * { visibility: visible; }
          #certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 40px !important;
            margin: 0;
            border: none;
            border-radius: 0;
            box-shadow: none;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-black text-[22px] tracking-tight text-slate-900 group">
          <div className="bg-primary-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-white">
            <HammerIcon />
          </div>
          Patchwork
        </Link>
        <div className="h-6 w-px bg-slate-300"></div>
        <span className="text-slate-500 font-medium text-sm">Community Achievement</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Certificate View */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Certificate Container */}
          <div id="certificate-container" className="bg-white border-4 border-slate-100 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-5 md:p-8 lg:p-12 relative flex-1 min-h-[600px] flex flex-col justify-between overflow-hidden">
            {/* Subtle Watermark/Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-[2px] border-slate-900/5 rounded-full pointer-events-none blur-[1px]"></div>
            
            {/* Top Left Logo */}
            <div className="flex items-center gap-2.5 font-black text-3xl tracking-tight text-slate-900 mb-12">
              <div className="bg-primary-500 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white">
                <HammerIcon />
              </div>
              Patchwork
            </div>

            {/* Content */}
            <div className="max-w-xl md:pr-64 relative z-10">
              <div className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">{certificateDate}</div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 font-display tracking-tight break-words">
                {recipientName}
              </h1>
              <p className="text-slate-500 text-[17px] leading-relaxed mb-12 max-w-[500px]">
                is hereby awarded this certificate of achievement in recognition of:<br/>
                <strong className="text-slate-900 font-bold text-lg inline-block mt-1">{certificateTitle}</strong><br/>
                authorized by the Patchwork Team.
              </p>

              {/* Signature */}
              <div className="mt-12">
                <div className="w-56 h-14 border-b border-slate-300 mb-2 relative">
                  <svg className="absolute bottom-1 left-2 w-full h-16 opacity-80" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
                    <path 
                      d="M 10 40 C 15 20, 25 15, 30 20 C 35 25, 30 40, 35 45 C 40 50, 45 40, 50 30 C 55 10, 65 15, 60 40 C 55 60, 40 55, 55 35 C 70 15, 80 15, 90 25 C 100 35, 105 25, 115 15 C 120 10, 125 10, 130 20 C 135 30, 125 45, 130 50 C 135 55, 145 40, 150 30 C 160 10, 175 10, 170 30 C 165 50, 180 50, 190 35" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-slate-800" 
                    />
                  </svg>
                </div>
                <div className="text-xs text-slate-400 font-bold">Akinrodolu Oluwaseun</div>
                <div className="text-[10px] text-slate-400">Founder</div>
              </div>
            </div>

            {/* Right Ribbon Graphic */}
            <div className="hidden md:flex print:flex absolute top-0 right-8 w-56 h-3/4 bg-slate-50 border-x border-b border-slate-200 shadow-sm flex-col items-center pt-16 z-0" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)", WebkitPrintColorAdjust: "exact" }}>
              <div className="text-slate-400 text-xs font-bold tracking-widest mb-12 text-center px-4">MILESTONE CERTIFICATE</div>
              
              {/* 3D Gold Ribbon Graphic */}
              <div className="relative w-32 h-32 flex items-center justify-center mt-4">
                 <div className={`absolute inset-0 bg-gradient-to-br ${credential?.badge?.badge_type === 'recognition' ? 'from-amber-200 via-amber-400 to-amber-600' : 'from-blue-200 via-blue-400 to-blue-600'} rounded-full shadow-lg border-4 border-white flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer group`}>
                    <Award className="w-14 h-14 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                 </div>
              </div>
            </div>

            <div className="mt-16 text-right text-[10px] text-slate-400 relative z-10">
              Verified Certificate ID: <span className="font-bold text-slate-500">{certId}</span>
            </div>
          </div>

          <div className="mt-4">
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF certificate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Sidebar Options */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Recipient info */}
          <section>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Certificate recipient</h3>
            <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl p-4 flex items-center gap-4 transition-shadow hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)]">
              <img src={avatarUrl} alt={recipientName} className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{recipientName}</h4>
                <p className="text-xs text-slate-500 truncate">{recipientRole}</p>
              </div>
            </div>
          </section>

          {/* About certificate */}
          <section>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">About certificate</h3>
            <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl p-5 min-h-[120px] transition-shadow hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-slate-600 leading-relaxed">
                {certificateTitle}
              </p>
            </div>
          </section>

          {/* Share options */}
          <section>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Share certificate</h3>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://patchwork.app/credentials/${certId}`}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-600 shadow-sm focus:outline-none focus:border-teal-500 transition"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-50 rounded-lg transition group">
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => window.open(generateLinkedInCertUrl(certificateTitle, certificateDate, window.location.href), '_blank')}
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm">
                  <Linkedin className="w-4 h-4 fill-current" /> Add to Profile
                </button>
                <button className="bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm">
                  <span className="font-serif italic text-base leading-none">X</span> Share on X
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
