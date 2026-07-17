import React from 'react';
import { useParams, Link } from 'react-router';
import { Award, Download, Copy, Linkedin, Link as LinkIcon, CheckCircle, Star, Calendar, BarChart2 } from 'lucide-react';
import { HammerIcon } from '../layout/LayoutIcons';
import { useQuery } from '@tanstack/react-query';
import { supabase, useAuth } from '../auth/AuthContext';
import { UserBadge } from '../../types/pow';
import { generateLinkedInCertUrl } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';
import { useProfile } from '../../hooks/useProfile';
import { useState } from 'react';
import * as htmlToImage from 'html-to-image';

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
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Allow state to update and UI to reflect downloading state if needed
    setTimeout(() => {
      window.print();
      setIsDownloading(false);
    }, 500);
  };

  const handleDownloadImage = async () => {
    setIsDownloadingImage(true);
    try {
      const element = document.getElementById('certificate-container');
      if (!element) return;
      
      const dataUrl = await htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 2 });
      
      const link = document.createElement('a');
      link.download = `patchwork-certificate-${certId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image', error);
    } finally {
      setIsDownloadingImage(false);
    }
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
  // avatarUrl removed

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
          {credential?.badge?.badge_type === 'recognition' ? (
            <div id="certificate-container" className="bg-[#111111] p-2 md:p-4 relative flex-1 min-h-[600px] flex flex-col overflow-hidden shadow-xl rounded-2xl print:p-0 print:border-none print:shadow-none print:rounded-none">
              <div className="bg-[#1E1E1E] border border-white/10 rounded-xl relative flex-1 flex flex-col md:flex-row overflow-hidden print:border-none print:rounded-none">
                
                {/* Left Side: Content */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-12">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                      <HammerIcon />
                    </div>
                    <span className="text-white font-bold tracking-tight text-lg">Patchwork</span>
                  </div>

                  <p className="text-slate-400 text-sm md:text-base tracking-wide mb-4">Certificate of Achievement</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 leading-tight">
                    {certificateTitle}
                  </h1>

                  <p className="text-teal-400/80 text-sm md:text-base tracking-wide mb-2">Awarded to</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{recipientName}</h2>

                  <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 max-w-lg">
                    Congratulations on reaching this significant award milestone. {credential?.badge?.description || "Recognized for exceptional mentorship and impactful contributions, embodying the spirit of guidance and inspiration within the Patchwork global community."}
                  </p>

                  <div className="mt-auto relative w-48">
                    <div className="w-full h-12 border-b border-slate-700 mb-3 relative flex items-end">
                      <svg className="absolute bottom-1 left-0 w-32 h-16 opacity-60" viewBox="0 0 200 60" preserveAspectRatio="xMinYMid meet">
                        <path 
                          d="M 10 40 C 15 20, 25 15, 30 20 C 35 25, 30 40, 35 45 C 40 50, 45 40, 50 30 C 55 10, 65 15, 60 40 C 55 60, 40 55, 55 35 C 70 15, 80 15, 90 25 C 100 35, 105 25, 115 15 C 120 10, 125 10, 130 20 C 135 30, 125 45, 130 50 C 135 55, 145 40, 150 30 C 160 10, 175 10, 170 30 C 165 50, 180 50, 190 35" 
                          fill="none" 
                          stroke="#ffffff" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Akinrodolu Oluwaseun, Founder</div>
                  </div>

                  {/* ID Bottom edge */}
                  <div className="absolute bottom-6 right-8 text-right text-[10px] text-slate-600 tracking-wider font-mono">
                    Verified Certificate ID: {certId}
                  </div>
                </div>

                {/* Right Side: Visuals */}
                <div className="hidden md:block w-[35%] relative bg-[#1A1A1A] border-l border-white/5 flex flex-col items-center justify-center">
                  <div className="absolute top-0 w-32 h-3/4 bg-black/60 shadow-2xl flex items-end justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%)' }}>
                  </div>
                  <div className="relative z-10 w-48 h-48 mt-[-15%] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 rounded-full shadow-[0_10px_40px_rgba(217,119,6,0.3)] border-4 border-[#1E1E1E] flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group">
                      <div className="absolute inset-2 border-[2px] border-dashed border-amber-800/40 rounded-full"></div>
                      <div className="absolute inset-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-inner">
                        <Award className="w-20 h-20 text-amber-100 drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-8">
              <div id="certificate-container" className="bg-white border-[1px] border-[#c7c6ff] p-2 relative flex flex-col overflow-hidden shadow-xl font-sans w-[900px] h-[640px] shrink-0 mx-auto rounded-md">
                <div className="border-[2px] border-[#5a5eea] relative flex-1 flex flex-col bg-[#fafafa] rounded-sm">
                  
                  <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                    .cursive-font { font-family: 'Dancing Script', cursive; }
                  `}</style>

                  {/* Header Logo */}
                  <div className="absolute top-10 left-12 flex items-center gap-3">
                     <div className="w-9 h-9 rounded-md bg-[#5a5eea] flex items-center justify-center text-white font-bold text-2xl leading-none shadow-sm">p</div>
                     <div className="flex flex-col">
                       <span className="font-extrabold text-[#0f172a] text-xl leading-tight tracking-tight">patchwork</span>
                       <span className="text-[10px] text-[#5a5eea] font-bold uppercase tracking-widest mt-[-2px]">The home for builders</span>
                     </div>
                  </div>

                  {/* Header Title */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-slate-200"></div>
                    <span className="text-[#5a5eea] font-bold text-[11px] tracking-[0.25em] uppercase">Milestone Certificate</span>
                    <div className="h-[1px] w-12 bg-slate-200"></div>
                  </div>

                  {/* Main Title */}
                  <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center w-full z-10">
                    <h1 className="text-[3.5rem] font-extrabold text-[#0f172a] mb-5 tracking-tight">Milestone Achieved!</h1>
                    <div className="mx-auto w-10 h-10 rounded-full bg-[#eef2ff] flex items-center justify-center text-[#5a5eea] shadow-sm">
                       <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                  {/* Left Badge */}
                  <div className="absolute top-[215px] left-12 w-56 h-64 flex items-center justify-center z-10">
                    <div className="absolute inset-0 bg-[#5a5eea] shadow-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                       <div className="absolute top-8 left-0 right-0 flex justify-center">
                          <Star className="w-5 h-5 text-white fill-current opacity-90" />
                       </div>
                       <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-center">
                          {credential?.badge?.points_required ? (
                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-md">{credential.badge.points_required}</span>
                          ) : (
                            <Award className="w-20 h-20 text-white fill-current drop-shadow-md opacity-90" />
                          )}
                       </div>
                       <div className="absolute bottom-12 left-0 right-0 h-12 bg-white/10 border-t border-white/20 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white text-center">
                             {credential?.badge?.badge_type === 'recognition' ? 'Recognition' : (credential?.badge?.badge_type === 'level' ? 'Level Unlocked' : 'Achievement')}
                          </span>
                       </div>
                    </div>
                  </div>

                  {/* Center Text */}
                  <div className="absolute top-[225px] left-1/2 -translate-x-1/2 w-[440px] text-center flex flex-col items-center z-10">
                     <p className="text-slate-500 text-[13px] mb-4">This is to certify that</p>
                     <h2 className="text-5xl md:text-6xl text-[#4f46e5] cursive-font mb-6 leading-tight max-w-[400px] break-words line-clamp-2">
                       {recipientName}
                     </h2>
                     <p className="text-slate-500 text-[13px] mb-2">has successfully achieved the milestone</p>
                     <p className="text-2xl font-bold text-[#4f46e5] mb-8">{certificateTitle}</p>
                     <p className="text-slate-400 text-[12px] max-w-sm mx-auto leading-relaxed">
                       You've reached an important milestone on your builder journey.<br/>Keep building, sharing, and inspiring!
                     </p>
                  </div>

                  {/* Right Info Box */}
                  <div className="absolute top-[215px] right-12 w-56 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6 z-10">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-[#eef2ff] flex items-center justify-center text-[#5a5eea] shrink-0">
                         <Calendar className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Achieved on</div>
                         <div className="text-[13px] font-bold text-slate-800">{certificateDate}</div>
                       </div>
                     </div>
                     <div className="w-full h-px bg-slate-100"></div>
                     {credential?.badge?.points_required ? (
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#eef2ff] flex items-center justify-center text-[#5a5eea] shrink-0">
                           <BarChart2 className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Points Value</div>
                           <div className="text-[13px] font-bold text-slate-800">{credential.badge.points_required} XP</div>
                         </div>
                       </div>
                     ) : (
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#eef2ff] flex items-center justify-center text-[#5a5eea] shrink-0">
                           <Award className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Category</div>
                           <div className="text-[13px] font-bold text-slate-800 capitalize">
                             {credential?.badge?.badge_type || 'Achievement'}
                           </div>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-10 left-12 right-12 flex justify-between items-end">
                    
                    {/* Signature */}
                    <div className="text-left w-64">
                      <div className="w-32 h-12 border-b border-slate-300 relative flex items-end justify-start mb-2">
                        <svg className="absolute bottom-1 w-24 h-12 opacity-80" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
                          <path 
                            d="M 10 40 C 15 20, 25 15, 30 20 C 35 25, 30 40, 35 45 C 40 50, 45 40, 50 30 C 55 10, 65 15, 60 40 C 55 60, 40 55, 55 35 C 70 15, 80 15, 90 25 C 100 35, 105 25, 115 15 C 120 10, 125 10, 130 20 C 135 30, 125 45, 130 50 C 135 55, 145 40, 150 30 C 160 10, 175 10, 170 30 C 165 50, 180 50, 190 35" 
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800" 
                          />
                        </svg>
                      </div>
                      <div className="text-[12px] font-bold text-slate-800 mb-0.5">Patchwork Team</div>
                      <div className="text-[11px] text-slate-500">Building the future, together.</div>
                    </div>

                    {/* QR Code Placeholder / Verification Block */}
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                             <rect x="0" y="0" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="8"/>
                             <rect x="12" y="12" width="16" height="16" fill="currentColor" />
                             
                             <rect x="60" y="0" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="8"/>
                             <rect x="72" y="12" width="16" height="16" fill="currentColor" />
                             
                             <rect x="0" y="60" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="8"/>
                             <rect x="12" y="72" width="16" height="16" fill="currentColor" />

                             <rect x="60" y="60" width="12" height="12" fill="currentColor" />
                             <rect x="76" y="76" width="24" height="24" fill="currentColor" />
                             <rect x="84" y="56" width="16" height="16" fill="currentColor" />
                             <rect x="52" y="80" width="16" height="16" fill="currentColor" />
                          </svg>
                       </div>
                       <div>
                         <div className="text-[12px] font-bold text-slate-800 mb-0.5">Verify Credential</div>
                         <div className="text-[11px] text-slate-500">patchwork.xyz/verify</div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button 
              onClick={handleDownload} 
              disabled={isDownloading || isDownloadingImage}
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
            <button 
              onClick={handleDownloadImage} 
              disabled={isDownloading || isDownloadingImage}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
            >
              {isDownloadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                  Generating Image...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download as Image
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
              <UserAvatar userId={avatarId} name={recipientName} avatarUrl={actualProfile?.avatar_url || actualProfile?.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm" />
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

              <div className="flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      const text = `I just earned the ${certificateTitle} milestone on Patchwork! Check out my builder profile and journey:\n\n${window.location.href}`;
                      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[13px] font-bold transition shadow-sm">
                    <Linkedin className="w-4 h-4 fill-current shrink-0" /> Share Post
                  </button>
                  <button 
                    onClick={() => {
                      const text = `I just earned the ${certificateTitle} milestone on @JoinPatchwork! Check out my builder journey:`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                    }}
                    className="bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[13px] font-bold transition shadow-sm">
                    <span className="font-serif italic text-base leading-none shrink-0">X</span> Share on X
                  </button>
                </div>
                <button 
                  onClick={() => window.open(generateLinkedInCertUrl(certificateTitle, certificateDate, window.location.href), '_blank')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-[#0A66C2] flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-[13px] font-bold transition shadow-sm">
                  <div className="bg-[#0A66C2] rounded-[4px] p-0.5 flex items-center justify-center shrink-0">
                    <Linkedin className="w-[14px] h-[14px] text-white fill-current stroke-[0.5]" />
                  </div>
                  Add to LinkedIn Profile
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
