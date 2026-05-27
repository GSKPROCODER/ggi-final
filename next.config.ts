import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg', 'bcryptjs'],
};

export default nextConfig;
