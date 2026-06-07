import { motion } from "motion/react";
import { Shield, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-8 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Terms of Service
              </h1>
              <p className="text-zinc-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-12 text-zinc-300 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. 
                In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                2. User License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website;</li>
                <li>Remove any copyright or other proprietary notations from the materials;</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                3. Disclaimer
              </h2>
              <p>
                The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
