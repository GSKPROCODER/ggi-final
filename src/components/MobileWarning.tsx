import { useState, useEffect } from 'react';
import { MonitorSmartphone, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the screen is mobile sized on mount
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center md:hidden"
        >
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mb-8 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <MonitorSmartphone size={40} />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight mb-4">Desktop Optimized</h2>
          
          <p className="text-muted-foreground mb-8 max-w-[320px] text-lg leading-relaxed">
            Nexus AI is a powerful data intelligence platform designed for larger screens. For the best experience, please open this application on a PC or tablet.
          </p>
          
          <div className="flex items-center gap-3 text-sm text-amber-500 bg-amber-500/10 px-5 py-3 rounded-full border border-amber-500/20">
            <AlertTriangle size={18} />
            <span className="font-medium">Some features may be limited on mobile</span>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="mt-12 text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Continue anyway
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
