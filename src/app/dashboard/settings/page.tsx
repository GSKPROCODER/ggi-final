'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, User, Bell, Shield, Database, Moon, Sun, Monitor, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(
    user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  const handleSaveProfile = async () => {
    if (activeTab !== 'profile') { toast.success('Settings saved'); return; }
    setIsSaving(true);
    try {
      const [first, ...rest] = fullName.trim().split(' ');
      await user?.update({ firstName: first, lastName: rest.join(' ') || undefined });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => signOut({ redirectUrl: '/sign-in' });

  return (
    <div className="p-6 w-full space-y-8 pb-20">
      <div className="flex flex-col md:flex-row rounded-3xl border border-border/40 bg-glass shadow-soft min-h-[600px] relative overflow-hidden">
        {/* Subtle top glare */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

        {/* Sidebar */}
        <div className="w-full md:w-72 shrink-0 flex flex-col border-r border-border/40 bg-background/20 relative z-10">
          <div className="p-6 space-y-2 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'text-primary bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
                )}
              >
                {isActive && (
                  <div layoutId="active-tab" className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                )}
                <tab.icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                {tab.label}
              </button>
            );
          })}
          </div>
          <div className="p-6 border-t border-border/40 bg-background/20">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all">
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            <div
              key={activeTab}
              className="p-5 md:p-10 space-y-8 md:space-y-10"
            >

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold">Personal Information</h3>
                  <p className="text-sm text-muted-foreground mt-1">Update your personal details here.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2 relative group">
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground ml-1">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 hover:border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2 relative group">
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <input type="email" value={user?.emailAddresses[0]?.emailAddress ?? ''} disabled
                        className="w-full bg-secondary/30 border border-border/30 rounded-xl pl-11 pr-4 py-3 text-sm opacity-90 cursor-not-allowed shadow-inner text-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-1">Verified and managed securely by Clerk.</p>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <h3 className="text-lg font-semibold mb-1">Appearance</h3>
                  <p className="text-sm text-muted-foreground mb-4">Customize how Nexus AI looks on your device.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {mounted && (
                      <>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 overflow-hidden group",
                            theme === 'dark' ? "border-primary/30 bg-primary/10 text-primary" : "border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                          )}
                    >
                      {theme === 'dark' && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />}
                      <div initial={{ rotate: 0 }} animate={{ rotate: theme === 'dark' ? 0 : -15 }} transition={{ duration: 0.5, type: 'spring' }} 
                        className={cn("relative z-10 p-3 rounded-full border transition-all", theme === 'dark' ? "bg-primary/20 border-primary/30" : "bg-background border-border/50")}
                        style={theme === 'dark' ? { boxShadow: 'var(--shadow-glow)' } : {}}
                      >
                        <Moon size={24} />
                      </div>
                      <span className="relative z-10 text-sm font-semibold tracking-wide">Dark</span>
                      {theme === 'dark' && <CheckCircle2 size={16} className="absolute top-3 right-3 z-10 text-primary" />}
                    </button>
                    
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 overflow-hidden group",
                        theme === 'light' ? "border-primary/30 bg-primary/10 text-primary" : "border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      {theme === 'light' && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />}
                      <div initial={{ rotate: 0 }} animate={{ rotate: theme === 'light' ? 0 : 15 }} transition={{ duration: 0.5, type: 'spring' }} 
                        className={cn("relative z-10 p-3 rounded-full border transition-all", theme === 'light' ? "bg-primary/20 border-primary/30" : "bg-background border-border/50")}
                        style={theme === 'light' ? { boxShadow: 'var(--shadow-glow)' } : {}}
                      >
                        <Sun size={24} />
                      </div>
                      <span className="relative z-10 text-sm font-semibold tracking-wide">Light</span>
                      {theme === 'light' && <CheckCircle2 size={16} className="absolute top-3 right-3 z-10 text-primary" />}
                    </button>

                    <button 
                      onClick={() => setTheme('system')}
                      className={cn(
                        "relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 overflow-hidden group",
                        theme === 'system' ? "border-primary/30 bg-primary/10 text-primary" : "border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      {theme === 'system' && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />}
                      <div initial={{ scale: 1 }} animate={{ scale: theme === 'system' ? 1.1 : 1 }} transition={{ duration: 0.5, type: 'spring' }} 
                        className={cn("relative z-10 p-3 rounded-full border transition-all", theme === 'system' ? "bg-primary/20 border-primary/30" : "bg-background border-border/50")}
                        style={theme === 'system' ? { boxShadow: 'var(--shadow-glow)' } : {}}
                      >
                        <Monitor size={24} />
                      </div>
                      <span className="relative z-10 text-sm font-semibold tracking-wide">System</span>
                      {theme === 'system' && <CheckCircle2 size={16} className="absolute top-3 right-3 z-10 text-primary" />}
                    </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4 shadow-inner">
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <Info size={18} className="text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-primary mb-1">AI Processing is Secure</p>
                    <p className="text-foreground/70 text-xs leading-relaxed">Your data parsing falls back securely to OpenRouter or Groq based on strict routing policies.</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-border/40 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-60 disabled:hover:scale-100">
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground mt-1">Control exactly what we alert you about.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Email Alerts', desc: 'Receive daily summary reports via email.', active: true },
                    { title: 'Push Notifications', desc: 'Get instant alerts for high-risk anomalies.', active: false },
                    { title: 'Weekly Digest', desc: 'A weekly overview of your data insights.', active: true },
                  ].map((item, i) => (
                    <div key={i} className="group flex items-center justify-between p-5 rounded-2xl border border-border/40 hover:border-primary/30 bg-background/30 hover:bg-secondary/20 transition-all duration-300 shadow-sm cursor-pointer">
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-6 rounded-full flex items-center px-1 border transition-colors shadow-inner",
                        item.active ? "bg-primary/20 border-primary/30 justify-end" : "bg-secondary border-border/50 justify-start"
                      )}>
                        <div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={cn(
                          "w-4 h-4 rounded-full shadow-md",
                          item.active ? "bg-primary shadow-primary/40" : "bg-muted-foreground"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold">Security Settings</h3>
                  <p className="text-sm text-muted-foreground mt-1">Manage your authentication and sessions.</p>
                </div>
                <div className="p-6 rounded-2xl border border-border/40 bg-background/30 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-full bg-secondary text-muted-foreground">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Identity Management</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                      Password, 2FA, and identity are securely managed off-site by our authentication provider Clerk.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold">Data Management</h3>
                  <p className="text-sm text-muted-foreground mt-1">Control your active session and workspace data.</p>
                </div>
                <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-destructive">Sign Out of Workspace</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        This will securely end your session. Your processed datasets and AI insights will remain securely encrypted on the server.
                      </p>
                    </div>
                  </div>
                  <div className="pl-16">
                    <button onClick={() => setShowConfirmModal(true)}
                      className="px-6 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl border border-destructive/20 w-full max-w-md p-6 flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Sign Out?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You will be logged out. Your data remains securely stored on the server.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={() => { setShowConfirmModal(false); handleLogout(); }}
                  className="px-6 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
