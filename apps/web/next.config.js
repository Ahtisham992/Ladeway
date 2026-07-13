/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Transpile the shared types package within the monorepo */
  transpilePackages: ['@ladeway/types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
