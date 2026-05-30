import Layout from '@/components/layout/Layout';

/**
 * Dashboard route segment. Clerk middleware in src/proxy.ts already protects
 * every /dashboard route, so this layout is a pure server-rendered shell that
 * delegates the interactive sidebar to the client Layout component.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
