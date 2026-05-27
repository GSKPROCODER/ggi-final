'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Database,
  Bot,
  PieChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClerk, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const navItems = [
  { name: 'Dashboard',   path: '/dashboard',           icon: LayoutDashboard, exact: true },
  { name: 'Analyze',     path: '/dashboard/analyze',   icon: BarChart3 },
  { name: 'EDA & Insights', path: '/dashboard/eda',    icon: PieChart },
  { name: 'Upload Data', path: '/dashboard/upload',    icon: UploadCloud },
  { name: 'Nexus Agent', path: '/dashboard/agent',     icon: Bot },
  { name: 'History',     path: '/dashboard/history',   icon: Database },
  { name: 'Reports',     path: '/dashboard/reports',   icon: FileText },
  { name: 'Alerts',      path: '/dashboard/alerts',    icon: Bell },
  { name: 'Settings',    path: '/dashboard/settings',  icon: Settings },
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

  const currentPageName = navItems.find(item =>
    item.exact ? currentPath === item.path : currentPath.startsWith(item.path)
  )?.name || 'Overview';

  const handleLogout = () => signOut({ redirectUrl: '/sign-in' });
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress : 'User';
  const displayEmail = user?.emailAddresses[0]?.emailAddress ?? '';

  const SIDEBAR_W = 220;
  const COLLAPSED_W = 68;

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden dark">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? SIDEBAR_W : (isSidebarOpen ? SIDEBAR_W : COLLAPSED_W),
          x: isMobile ? (isSidebarOpen ? 0 : -SIDEBAR_W) : 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'h-full flex flex-col shrink-0 z-30 overflow-hidden',
          'border-r border-border/40 bg-card/60 backdrop-blur-2xl',
          isMobile ? 'fixed top-0 left-0' : 'relative'
        )}
        style={{ minWidth: isMobile ? SIDEBAR_W : (isSidebarOpen ? SIDEBAR_W : COLLAPSED_W) }}
      >
        {/* Logo row */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border/30 shrink-0">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <Logo className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm tracking-tight whitespace-nowrap">Nexus AI</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto"
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
            </button>
          )}
          {isMobile && isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative min-w-0',
                  isActive
                    ? 'bg-primary/12 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={cn('shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                />
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 p-2 border-t border-border/30">
          <div className={cn('flex items-center gap-2.5 px-2 py-2 rounded-xl', isSidebarOpen && 'hover:bg-secondary/60 transition-colors')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0 uppercase">
              {displayName?.charAt(0) || 'U'}
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[13px] font-medium truncate leading-tight">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {isSidebarOpen && (
              <button onClick={handleLogout} title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                <LogOut size={14} />
              </button>
            )}
          </div>
          {!isSidebarOpen && (
            <button onClick={handleLogout} title="Sign out"
              className="w-full flex justify-center p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-1">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-5 border-b border-border/30 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 -ml-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Menu size={18} />
              </button>
            )}
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
      </div>
    </div>
  );
}
