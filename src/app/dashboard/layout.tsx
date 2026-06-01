import Layout from '@/components/layout/Layout';

/**
 * Dashboard route segment. Clerk middleware in src/middleware.ts protects
 * every /dashboard route.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
