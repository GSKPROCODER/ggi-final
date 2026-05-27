import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldAlert, Zap, Database } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 dark overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Logo className="w-5 h-5" />
            </div>
            Nexus AI
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/auth" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-[100%] blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20"
          >
            <Logo className="w-4 h-4" />
            <span>Introducing Nexus AI 2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
          >
            Intelligence that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              understands your data.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The enterprise-grade platform for modern teams. Analyze sentiment, detect anomalies, and generate actionable reports in real-time with advanced AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center justify-center gap-2 group">
              Start Free Trial
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full bg-secondary/50 text-foreground font-medium hover:bg-secondary transition-colors border border-border/50 flex items-center justify-center">
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="max-w-6xl mx-auto mt-24 relative z-10"
        >
          <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-secondary/30 to-background flex items-center justify-center relative overflow-hidden">
               {/* Abstract representation of dashboard */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-8 w-full h-full relative z-10">
                  <div className="md:col-span-2 space-y-6">
                    <div className="h-32 rounded-xl bg-white/5 border border-white/10 flex items-center px-6 gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"><BarChart3 className="text-primary" size={24}/></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-24 bg-white/10 rounded" />
                        <div className="h-8 w-32 bg-white/20 rounded" />
                      </div>
                    </div>
                    <div className="h-64 rounded-xl bg-white/5 border border-white/10 p-6">
                       <div className="h-4 w-32 bg-white/10 rounded mb-6" />
                       <div className="flex items-end gap-2 h-40">
                         {[40, 70, 45, 90, 65, 85, 50, 75].map((h, i) => (
                           <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h}%` }} />
                         ))}
                       </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-48 rounded-xl bg-white/5 border border-white/10 p-6">
                      <div className="h-4 w-24 bg-white/10 rounded mb-6" />
                      <div className="space-y-4">
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-4/5 bg-white/10 rounded" />
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="h-48 rounded-xl bg-white/5 border border-white/10 p-6">
                      <div className="h-4 w-24 bg-white/10 rounded mb-6" />
                      <div className="flex items-center justify-center h-24">
                        <div className="w-24 h-24 rounded-full border-4 border-primary/40 border-t-primary" />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-secondary/20 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to scale</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Powerful features designed to give you complete visibility into your unstructured data.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Real-time Analysis",
                description: "Process thousands of text records instantly with our optimized AI pipeline."
              },
              {
                icon: ShieldAlert,
                title: "Anomaly Detection",
                description: "Automatically flag critical issues, negative sentiment, and emerging risks."
              },
              {
                icon: Database,
                title: "Batch Processing",
                description: "Upload massive CSV datasets and extract structured insights in minutes."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 bg-background text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-lg tracking-tight mb-4 text-muted-foreground">
          <Logo className="w-5 h-5" />
          Nexus AI
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Nexus AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
