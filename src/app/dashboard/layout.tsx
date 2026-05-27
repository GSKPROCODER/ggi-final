'use client';

import Layout from '@/components/layout/Layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Clerk middleware already protects all /dashboard routes — no manual redirect needed.
  return <Layout>{children}</Layout>;
}
