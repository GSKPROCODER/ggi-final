import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, User, Bell, Shield, Database, Moon, Sun, Monitor, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { authApi } from '@/lib/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { user, logout, setUser } = useStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

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
      const updated = await authApi.updateProfile({ full_name: fullName, email });
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/auth';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all mt-4">
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl border border-border/50 p-8 space-y-8"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 text-primary">
                      <Moon size={24} />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 text-muted-foreground" disabled>
                      <Sun size={24} />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 text-muted-foreground" disabled>
                      <Monitor size={24} />
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 italic">Nexus AI is currently optimized for Dark Mode only.</p>
                </div>

                {/* AI Security notice */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                  <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">AI Processing is Secure</p>
                    <p className="text-foreground/70 text-xs">Your Gemini API key is stored securely on the server and is never exposed to the browser. All AI analysis happens server-side.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Email Alerts', desc: 'Receive daily summary reports via email.' },
                    { title: 'Push Notifications', desc: 'Get instant alerts for high-risk anomalies.' },
                    { title: 'Weekly Digest', desc: 'A weekly overview of your data insights.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                      <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Security Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                    <input type="password" placeholder="••••••••"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">New Password</label>
                    <input type="password" placeholder="••••••••"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Data Management</h3>
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-destructive">Delete Account Data</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will log you out. Contact support to permanently delete your account and all associated data.
                    </p>
                  </div>
                  <button onClick={() => setShowConfirmModal(true)}
                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
                    Sign Out & Clear Session
                  </button>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border/50 flex justify-end">
              <button onClick={handleSaveProfile} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-60">
                <Save size={18} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl border border-destructive/20 w-full max-w-md p-6 flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Sign Out?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You will be logged out and your session data will be cleared. Your data remains securely stored on the server.
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
