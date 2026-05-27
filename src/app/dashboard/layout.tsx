'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Layout from '@/components/layout/Layout';

/**
 * Enforces active authenticated state checking before displaying dashboard subroutes.
 * Wraps pages inside the standard navigation header/sidebar framework.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
