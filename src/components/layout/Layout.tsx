'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  UploadCloud,
  FileText,
  Bell,
  Settings,
  X,
  MessageSquare,
  ChevronLeft,
  Database,
  Bot,
  PieChart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PanelLeft,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { datasetsApi } from '@/lib/api';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const mainNav = [
  { name: 'Dashboard',   path: '/dashboard',           icon: LayoutDashboard, exact: true },
  { name: 'Analyze',     path: '/dashboard/analyze',   icon: BarChart3, exact: false },
  { name: 'EDA & Insights', path: '/dashboard/eda',    icon: PieChart, exact: false },
  { name: 'Nexus Agent', path: '/dashboard/agent',     icon: Bot, exact: false },
];

const workspaceNav = [
  { name: 'Upload Data', path: '/dashboard/upload',    icon: UploadCloud, exact: false },
  { name: 'History',     path: '/dashboard/history',   icon: Database, exact: false },
  { name: 'Reports',     path: '/dashboard/reports',   icon: FileText, exact: false },
  { name: 'Alerts',      path: '/dashboard/alerts',    icon: Bell, exact: false },
  { name: 'Settings',    path: '/dashboard/settings',  icon: Settings, exact: false },
];

/**
 * Main dashboard layout. Provides the premium responsive glassmorphic sidebar sidebar
 * along with active route indications and persistent AI quick chat links.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname || '';
  const { user } = useUser();
  const router = useRouter();
  const reduce = useReducedMotion();

  // Fine-grained Zustand selectors — unrelated slice updates don't re-render the layout.
  const isBatchProcessing = useStore((s) => s.isBatchProcessing);
  const batchProgress = useStore((s) => s.batchProgress);
  const batchStatus = useStore((s) => s.batchStatus);
  const batchError = useStore((s) => s.batchError);
  const processingDatasetId = useStore((s) => s.processingDatasetId);
  const setBatchProcessing = useStore((s) => s.setBatchProcessing);
  const setDatasets = useStore((s) => s.setDatasets);
  const alerts = useStore((s) => s.alerts);

  // Count unread medium/high alerts for the sidebar badge
  const urgentAlertCount = alerts.filter(
    (a) => !a.is_read && (a.severity === 'high' || a.severity === 'medium'),
  ).length;

  const [showFloatingDone, setShowFloatingDone] = useState(false);
  const [lastProgress, setLastProgress] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Streamed dataset status — server pushes only when state changes,
  // closes automatically when complete/failed, suspends while tab is hidden.
  useEffect(() => {
    if (!processingDatasetId) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    let cancelled = false;
    let es: EventSource | null = null;

    const open = () => {
      if (cancelled || eventSourceRef.current) return;
      es = new EventSource(`/api/v1/datasets/${processingDatasetId}/stream`);
      eventSourceRef.current = es;

      es.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as {
            status?: string;
            processed_count?: number;
            row_count?: number;
            percent?: number;
            error_message?: string;
            type?: string;
          };
          if (data.type === 'not_found') {
            es?.close();
            eventSourceRef.current = null;
            return;
          }
          if (data.status === 'completed' || data.status === 'failed') {
            if (data.status === 'failed') {
              const msg = data.error_message || 'Analysis failed due to an error.';
              setBatchProcessing(false, batchProgress, msg, null, msg);
            } else {
              setBatchProcessing(false, 100, '', null, null);
            }
            es?.close();
            eventSourceRef.current = null;
            const list = await datasetsApi.list();
            setDatasets(list);
            return;
          }
          if (typeof data.percent === 'number') {
            const statusMsg = `Analyzed ${data.processed_count ?? 0} of ${data.row_count ?? 0} records`;
            setBatchProcessing(true, data.percent, statusMsg, processingDatasetId, null);
          }
        } catch (err) {
          console.error('Stream parse failed:', err);
        }
      };

      es.onerror = () => {
        // EventSource auto-reconnects; only close if processing is done.
        // Otherwise leave it to retry.
      };
    };

    const close = () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      es = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        close();
      } else if (processingDatasetId) {
        open();
      }
    };

    open();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      close();
    };
    // batchProgress intentionally not in deps — it would re-open the stream on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingDatasetId, setBatchProcessing, setDatasets]);

  // Floating done/error card transitions
  useEffect(() => {
    if (isBatchProcessing) {
      setShowFloatingDone(false);
      setLastProgress(batchProgress);
    } else if ((lastProgress > 0 && lastProgress < 100) || batchError) {
      setShowFloatingDone(true);
      setLastProgress(0);
      const timer = setTimeout(() => setShowFloatingDone(false), batchError ? 12000 : 8000);
      return () => clearTimeout(timer);
    }
  }, [isBatchProcessing, batchProgress, lastProgress, batchError]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [pathname, isMobile]);

  const currentPageName = [...mainNav, ...workspaceNav].find(item =>
    item.exact ? currentPath === item.path : currentPath.startsWith(item.path)
  )?.name || 'Overview';

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress : 'User';

  const SIDEBAR_W = 220;
  const COLLAPSED_W = 68;

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/70 backdrop-blur-md z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Capsule */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? SIDEBAR_W : (isSidebarOpen ? SIDEBAR_W : COLLAPSED_W),
          x: isMobile ? (isSidebarOpen ? 0 : -(SIDEBAR_W + 40)) : 0,
        }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'flex flex-col shrink-0 z-30 overflow-hidden',
          'border border-glass-border bg-glass',
          isMobile
            ? 'fixed top-0 left-0 h-screen rounded-r-[28px] rounded-l-none shadow-2xl'
            : 'relative h-[calc(100vh-2rem)] my-4 ml-4 rounded-[32px] shadow-soft'
        )}
        style={{
          minWidth: isMobile ? SIDEBAR_W : (isSidebarOpen ? SIDEBAR_W : COLLAPSED_W),
          // Kill shadow bleed when fully off-screen so it doesn't show on the left edge
          boxShadow: isMobile && !isSidebarOpen ? 'none' : undefined,
        }}
      >
        {/* Logo row (No border bottom, bold text instead of logo icon) */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between shrink-0">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center"
              >
                <span className="font-bold text-[22px] tracking-tight">NEXUS AI</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex justify-center"
              >
                <span className="font-bold text-lg">N</span>
              </motion.div>
            )}
          </AnimatePresence>
          {isMobile && isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full bg-secondary/50 text-muted-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-6 scrollbar-hide pb-4">
          
          {/* MAIN SECTION */}
          <div className="space-y-1">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 pb-2">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">Main</p>
                </motion.div>
              )}
            </AnimatePresence>
            {mainNav.map(item => {
              const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all duration-200 group relative', isActive ? 'bg-secondary/80 border border-glass-border text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent')}
                >
                  <item.icon size={18} className={cn('shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] whitespace-nowrap overflow-hidden">
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>

          {/* WORKSPACE SECTION */}
          <div className="space-y-1">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 pb-2">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">Workspace</p>
                </motion.div>
              )}
            </AnimatePresence>
            {workspaceNav.map(item => {
              const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all duration-200 group relative', isActive ? 'bg-secondary/80 border border-glass-border text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent')}
                >
                  <item.icon size={18} className={cn('shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] whitespace-nowrap overflow-hidden flex-1">
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.name === 'Alerts' && urgentAlertCount > 0 && (
                    <span className={cn(
                      'min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0',
                      !isSidebarOpen && 'absolute top-1 right-1',
                    )}>
                      {urgentAlertCount > 9 ? '9+' : urgentAlertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

        </div>

        {/* User footer Pill */}
        <div className="shrink-0 p-4">
          <div className={cn('flex items-center gap-3 p-2 rounded-[20px] border border-glass-border bg-background/50 shadow-sm transition-all', isSidebarOpen ? 'hover:bg-secondary/50 cursor-pointer' : 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-[12px] font-bold text-white shrink-0 uppercase shadow-inner">
              {displayName?.charAt(0) || 'U'}
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col min-w-0 pr-2">
                    <p className="text-[13px] font-semibold truncate leading-tight">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user?.primaryEmailAddress?.emailAddress ?? 'Member'}
                    </p>
                  </div>
                  <ChevronLeft size={14} className="text-muted-foreground -rotate-90 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar — padded for iOS notch when installed as PWA */}
        <header
          className="shrink-0 flex items-center justify-between px-4 md:px-5 border-b border-border/30 bg-background/80 backdrop-blur-xl z-10"
          style={{ minHeight: '3.5rem', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 -ml-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Sidebar"
            >
              <PanelLeft size={18} />
            </button>
            <h1 className="text-[15px] font-semibold truncate">{currentPageName}</h1>
          </div>
          <Link
            href="/dashboard/agent"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all',
              currentPath === '/dashboard/agent'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
            )}
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-14 md:pb-0 scroll-touch min-h-0">
          {children}
        </main>

        {/* Persistent background process tracker (Amazon style) */}
        <AnimatePresence>
          {(isBatchProcessing || showFloatingDone) && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={() => {
                if (processingDatasetId || currentPath !== '/dashboard/upload') {
                  router.push('/dashboard/upload');
                }
              }}
              className={cn(
                "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[999] w-[calc(100vw-2rem)] md:w-80 p-4 rounded-2xl cursor-pointer select-none border transition-all duration-300",
                "bg-card/95 backdrop-blur-xl shadow-2xl hover:scale-[1.02]",
                isBatchProcessing 
                  ? "border-primary/40 shadow-primary/10" 
                  : batchError
                    ? "border-destructive/40 shadow-destructive/10"
                    : "border-emerald-500/40 shadow-emerald-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isBatchProcessing 
                    ? "bg-primary/20 text-primary" 
                    : batchError
                      ? "bg-destructive/20 text-destructive"
                      : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {isBatchProcessing ? (
                    <Loader2 size={16} className="animate-spin text-primary" />
                  ) : batchError ? (
                    <AlertCircle size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[10px] font-bold tracking-wider uppercase",
                    batchError ? "text-destructive/80" : "text-muted-foreground"
                  )}>
                    {isBatchProcessing ? "Analyzing Dataset" : batchError ? "Analysis Failed" : "Analysis Complete"}
                  </p>
                  <p className="text-[12px] font-semibold text-foreground truncate mt-0.5">
                    {isBatchProcessing 
                      ? (batchStatus || "Processing records...") 
                      : batchError 
                        ? batchError 
                        : "All records successfully processed!"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBatchProcessing) {
                      router.push('/dashboard/upload');
                    } else {
                      setShowFloatingDone(false);
                      if (batchError) setBatchProcessing(false, 0, '', null, null); // Clear error on dismiss
                    }
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {isBatchProcessing && (
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-primary">
                    <span>Progress</span>
                    <span>{batchProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                      animate={{ width: `${batchProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <MobileBottomNav onMenuOpen={() => setIsSidebarOpen(true)} />
    </div>
  );
}
