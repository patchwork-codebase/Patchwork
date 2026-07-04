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
        .from('users')
        .select('*')
        .eq('id', credential!.user_id)
        .maybeSingle();
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
  const recipientName = actualProfile?.name || actualProfile?.full_name || "Akinrodolu Seun";
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
          <div id="certificate-container" className="bg-white border-[8px] md:border-[12px] border-slate-50 p-2 md:p-5 relative flex-1 min-h-[600px] flex flex-col overflow-hidden shadow-sm">
            <div className="border-[2px] border-slate-200 relative flex-1 flex flex-col justify-between p-6 sm:p-8 md:p-16 overflow-hidden items-center text-center bg-white">
              
              {/* Subtle geometric background pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
              
              {/* Top Section */}
              <div className="w-full flex flex-col items-center relative z-10 mb-12">
                <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-6">Patchwork Community Achievement</div>
                <h2 className="text-4xl md:text-5xl font-serif text-slate-800 italic" style={{ letterSpacing: '-0.02em' }}>Certificate of Recognition</h2>
              </div>

              {/* Main Content */}
              <div className="max-w-3xl relative z-10 flex-1 flex flex-col justify-center items-center mb-12">
                <div className="w-12 h-[2px] bg-slate-200 mb-8"></div>
                <p className="text-slate-500 text-sm md:text-[15px] mb-8 tracking-[0.2em] uppercase">This is to certify that</p>
                <h1 className="text-4xl sm:text-5xl md:text-[5.5rem] font-serif text-slate-900 mb-10 leading-none break-words text-center" style={{ letterSpacing: '-0.03em', wordBreak: 'break-word' }}>
                  {recipientName}
                </h1>
                <p className="text-slate-600 text-base md:text-xl leading-relaxed font-serif italic mb-8 max-w-xl mx-auto px-4 md:px-0">
                  Has successfully achieved the milestone of
                </p>
                <strong className="text-slate-900 font-bold text-lg md:text-xl inline-block px-10 py-4 bg-slate-50/80 border border-slate-200 uppercase tracking-widest shadow-sm">{certificateTitle}</strong>
              </div>

              {/* Bottom Section */}
              <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end relative z-10 mt-auto px-2 md:px-8 gap-8 md:gap-0">
                <div className="text-center md:text-left w-full md:w-48 order-2 md:order-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Awarded On</div>
                  <div className="text-sm md:text-base font-serif text-slate-800">{certificateDate}</div>
                </div>

                {/* Foil Stamp */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center shrink-0 order-1 md:order-2">
                  <div className={`absolute inset-0 bg-gradient-to-br ${credential?.badge?.badge_type === 'recognition' ? 'from-amber-200 via-amber-400 to-amber-600' : 'from-slate-200 via-slate-400 to-slate-700'} rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-2 border-white/50 flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer group`} style={{ WebkitPrintColorAdjust: "exact" }}>
                    <div className="absolute inset-2 border-[1px] border-dashed border-white/60 rounded-full"></div>
                    <Award className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>

                {/* Signature */}
                <div className="text-center md:text-right flex flex-col items-center md:items-end w-full md:w-48 order-3 md:order-3">
                  <div className="w-48 h-12 border-b border-slate-300 mb-3 relative flex items-end justify-center md:justify-end">
                    <svg className="absolute bottom-1 w-32 h-16 opacity-80" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
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
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Akinrodolu Oluwaseun</div>
                  <div className="text-[11px] text-slate-400 italic font-serif">Founder, Patchwork</div>
                </div>
              </div>

              {/* ID Bottom edge */}
              <div className="absolute bottom-4 left-0 w-full text-center text-[9px] text-slate-300 tracking-[0.2em] font-mono">
                CERTIFICATE ID: {certId}
              </div>
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
            <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl p-5 min-h-[120px] flex flex-col gap-3 transition-shadow hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)]">
              <h4 className="font-bold text-slate-900 text-sm">{certificateTitle}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {credential?.badge?.description || "This certificate represents a significant milestone within the Patchwork ecosystem, recognizing outstanding contribution, consistent participation, and proven expertise in collaborative building environments. Verified through cryptographic proof-of-work, it stands as a testament to the recipient's dedication."}
              </p>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                  <CheckCircle className="w-3 h-3" />
                  Verified Credential
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {credential?.badge?.points_required ? `${credential.badge.points_required} Points` : 'Milestone'}
                </span>
              </div>
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
                  className="bg-[#3065C4] hover:bg-[#2552a1] text-white flex items-center justify-center gap-3 py-2 px-4 rounded-[8px] text-[14px] font-bold transition shadow-sm">
                  <div className="bg-white rounded-[4px] p-0.5 flex items-center justify-center shrink-0">
                    <Linkedin className="w-[18px] h-[18px] text-[#3065C4] fill-current stroke-[0.5]" />
                  </div>
                  Add to Profile
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
