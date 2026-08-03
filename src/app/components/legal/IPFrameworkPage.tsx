import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Shield, Lock, FileSignature, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function IPFrameworkPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0812] text-slate-300 font-sans selection:bg-primary-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-12 text-sm font-bold tracking-wide uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patchwork
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <Shield className="w-4 h-4" />
            Legal & Security
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Intellectual Property Protection Framework
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            How we use cryptographic hashing, digital agreements, and granular access controls to ensure your ideas remain yours when building in public.
          </p>
        </motion.div>

        <div className="prose prose-invert prose-slate max-w-none space-y-12">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-400" />
              1. Immutable Proof of Authorship
            </h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              When you create a Build Room and log decisions, Patchwork automatically generates an immutable cryptographic hash combining your identity, the room details, and the precise timestamp. This establishes a definitive, undeniable record that you were the originator of the idea at that specific point in time. 
            </p>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400 mt-4">
              This proof can be exported at any time from your Build Timeline and can serve as prior art or evidence of conception in intellectual property disputes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary-400" />
              2. Granular Access Controls
            </h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Building in public doesn't mean sharing your trade secrets. Patchwork provides five tiers of visibility for your Build Rooms:
            </p>
            <ul className="mt-4 space-y-2 text-slate-500 dark:text-slate-400 list-disc pl-6">
              <li><strong className="text-slate-900 dark:text-white">Public:</strong> Visible to everyone on the internet. Best for marketing and community building.</li>
              <li><strong className="text-slate-900 dark:text-white">Unlisted:</strong> Anyone with the link can view, but it's hidden from search and discoverability.</li>
              <li><strong className="text-slate-900 dark:text-white">Community Only:</strong> Restricted to logged-in users on the Patchwork platform.</li>
              <li><strong className="text-slate-900 dark:text-white">Protected:</strong> Requires an explicit invitation or an approved access request to view.</li>
              <li><strong className="text-slate-900 dark:text-white">Stealth (Private):</strong> Visible only to you and designated co-builders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <FileSignature className="w-6 h-6 text-amber-400" />
              3. Digital Non-Disclosure Agreements (NDAs)
            </h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              For highly sensitive projects, builders can enforce a Digital NDA. When a user requests access or accepts an invitation to a Protected or Stealth room, they are legally bound by a digital NDA before they can view the room's contents.
            </p>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400 mt-4">
              Patchwork logs the exact timestamp and IP address of the acceptance, providing you with a legally binding digital paper trail that protects your confidential information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-400" />
              4. Comprehensive Access Auditing
            </h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Every action taken within a private or protected room is logged. As a builder, you have access to a detailed Access Log that tracks:
            </p>
            <ul className="mt-4 space-y-2 text-slate-500 dark:text-slate-400 list-disc pl-6">
              <li>Who viewed your room and when.</li>
              <li>Who accepted your digital NDAs.</li>
              <li>Who attempted to download or export your timeline data.</li>
            </ul>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400 mt-4">
              This absolute transparency ensures you always know who has eyes on your intellectual property.
            </p>
          </section>

        </div>

        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/10 text-center">
          <p className="text-slate-500 text-sm">
            Last updated: June 2026. This framework is a core part of the Patchwork platform security architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
