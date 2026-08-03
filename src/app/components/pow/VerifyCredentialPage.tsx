import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ShieldCheck, Search, ArrowRight } from 'lucide-react';
import { HammerIcon } from '../layout/LayoutIcons';

export default function VerifyCredentialPage() {
  const [certId, setCertId] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      navigate(`/credentials/${certId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-black text-[22px] tracking-tight text-slate-900 group">
            <div className="bg-primary-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-white">
              <HammerIcon />
            </div>
            Patchwork
          </Link>
          <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
          <span className="text-slate-500 font-medium text-sm hidden sm:inline">Credential Verification</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Verify a Credential</h1>
            <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
              Enter the unique Certificate ID found on the bottom right of the certificate to verify its authenticity.
            </p>

            <form onSubmit={handleVerify} className="space-y-4 text-left">
              <div>
                <label htmlFor="certId" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Certificate ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="certId"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono shadow-sm dark:shadow-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!certId.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                Verify Credential
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-8">
          Secure verification powered by Patchwork
        </p>
      </main>
    </div>
  );
}
