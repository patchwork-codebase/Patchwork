import { motion } from "motion/react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/10 blur-[120px]" />
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
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Privacy Policy
              </h1>
              <p className="text-zinc-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-12 text-zinc-300 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2>
              <p>
                We collect information to provide better services to all our users. The types of information we collect include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                <li>Information you provide to us directly (e.g., account creation details).</li>
                <li>Information we get from your use of our services (e.g., device information, log information).</li>
                <li>Cookies and similar technologies to improve user experience.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">2. How We Use Information</h2>
              <p>
                We use the information we collect from all our services to provide, maintain, protect, and improve them, to develop new ones, and to protect our users. We also use this information to offer you tailored content.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">3. Information Security</h2>
              <p>
                We work hard to protect our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use encryption to keep your data private while in transit and review our information collection, storage, and processing practices regularly.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
