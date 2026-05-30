import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  UploadCloud,
  FileText,
  Bell,
  Settings,
  Menu,
  X,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Bot,
  PieChart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Command,
  PanelLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClerk, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { datasetsApi } from '@/lib/api';

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

const contactNav = [
  { name: 'Esther Howard', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', status: 'online' },
  { name: 'Jacob Jones',   avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d', status: 'offline' },
  { name: 'Cody Fisher',   avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d', status: 'online' },
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
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  // Zustand background processing states
  const {
    isBatchProcessing,
    batchProgress,
    batchStatus,
    batchError,
    processingDatasetId,
    setBatchProcessing,
    setDatasets,
  } = useStore();

  const [showFloatingDone, setShowFloatingDone] = useState(false);
  const [lastProgress, setLastProgress] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Global Polling Engine
  useEffect(() => {
    if (processingDatasetId) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await datasetsApi.getStatus(processingDatasetId);
          const statusMsg = `Analyzed ${status.processed_count} of ${status.row_count} records`;
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            
            if (status.status === 'failed') {
              setBatchProcessing(false, batchProgress, status.error_message || 'Analysis failed due to an error.', null, status.error_message || 'Analysis failed due to an error.');
            } else {
              setBatchProcessing(false, 100, '', null, null);
            }
            
            // Refresh dataset lists
            const list = await datasetsApi.list();
            setDatasets(list);
          } else {
            setBatchProcessing(true, status.percent, statusMsg, processingDatasetId, null);
          }
        } catch (err) {
          console.error('Global status poll failed:', err);
        }
      }, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [processingDatasetId]);

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

  const handleLogout = () => signOut({ redirectUrl: '/sign-in' });
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress : 'User';
  const displayEmail = user?.emailAddresses[0]?.emailAddress ?? '';

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
          x: isMobile ? (isSidebarOpen ? 0 : -SIDEBAR_W) : 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'h-[calc(100vh-2rem)] my-4 ml-4 flex flex-col shrink-0 z-30 overflow-visible relative',
          'rounded-[32px] border border-glass-border bg-glass shadow-soft',
          isMobile ? 'fixed top-0 left-0' : 'relative'
        )}
        style={{ minWidth: isMobile ? SIDEBAR_W : (isSidebarOpen ? SIDEBAR_W : COLLAPSED_W) }}
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

        {/* Search Bar */}
        <div className="px-4 pb-4 shrink-0">
          <div className={cn("flex items-center gap-2 rounded-[14px] bg-secondary/50 border border-glass-border transition-all", isSidebarOpen ? "px-3 py-2" : "p-2 justify-center")}>
            <Search size={16} className="text-muted-foreground shrink-0" />
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-sm text-muted-foreground font-medium">Search</span>
                  <div className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/40 shadow-sm">
                    <Command size={10} /> S
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide pb-4">
          
          {/* MAIN SECTION */}
          <div className="space-y-1">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 pb-2">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">Main</p>
                </motion.div>
              )}
            </AnimatePresence>
            {mainNav.map(item => {
              const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path}
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
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">Workspace</p>
                </motion.div>
              )}
            </AnimatePresence>
            {workspaceNav.map(item => {
              const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path}
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

          {/* MESSAGES SECTION */}
          <div className="space-y-1">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 pb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">Messages</p>
                  <span className="text-muted-foreground/60 hover:text-foreground cursor-pointer">+</span>
                </motion.div>
              )}
            </AnimatePresence>
            {contactNav.map(contact => (
              <div key={contact.name} className={cn('flex items-center gap-3 px-3 py-2 rounded-[14px] transition-all duration-200 cursor-pointer group hover:bg-secondary/40', !isSidebarOpen && 'justify-center')}>
                <div className="relative shrink-0">
                  <img src={contact.avatar} alt={contact.name} className="w-6 h-6 rounded-full border border-border/50" />
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", contact.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                </div>
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap overflow-hidden">
                      {contact.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            ))}
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5 truncate">Designer</p>
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
        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-5 border-b border-border/30 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
                "fixed bottom-6 right-6 z-[999] w-80 p-4 rounded-2xl cursor-pointer select-none border transition-all duration-300",
                "bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl hover:scale-[1.02]",
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
    </div>
  );
}
