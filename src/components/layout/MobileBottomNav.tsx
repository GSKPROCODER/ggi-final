'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Bot, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const TABS = [
  { name: 'Home',    path: '/dashboard',        icon: LayoutDashboard, exact: true },
  { name: 'Analyze', path: '/dashboard/analyze', icon: BarChart3,       exact: false },
  { name: 'Agent',   path: '/dashboard/agent',   icon: Bot,             exact: false },
  { name: 'Alerts',  path: '/dashboard/alerts',  icon: Bell,            exact: false },
] as const;

interface Props {
  onMenuOpen: () => void;
  isSidebarOpen: boolean;
}

export function MobileBottomNav({ onMenuOpen, isSidebarOpen }: Props) {
  const pathname = usePathname();
  const alerts = useStore((s) => s.alerts);
  const urgentCount = alerts.filter(
    (a) => !a.is_read && (a.severity === 'high' || a.severity === 'medium'),
  ).length;

  return (
    <nav
      aria-label="Bottom navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-glass-border bg-card/95 backdrop-blur-xl transition-transform duration-300',
        isSidebarOpen ? 'translate-y-full' : 'translate-y-0',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map(({ name, path, icon: Icon, exact }) => {
          const isActive = exact ? pathname === path : pathname.startsWith(path);
          const isAlerts = name === 'Alerts';
          return (
            <Link
              key={path}
              href={path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                {isAlerts && urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {urgentCount > 9 ? '9+' : urgentCount}
                  </span>
                )}
              </div>
              <span>{name}</span>
            </Link>
          );
        })}

        <button
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <Menu size={20} strokeWidth={1.75} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
