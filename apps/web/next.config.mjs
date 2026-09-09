/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@doorsignal/ui',
    '@doorsignal/arrival-schema',
    '@doorsignal/ring-client',
    '@doorsignal/ring-webhooks',
    '@doorsignal/case-engine',
    '@doorsignal/arrival-resolver',
    '@doorsignal/db',
    '@doorsignal/events'
  ],
  images: {
    domains: ['images.unsplash.com']
  }
};

export default nextConfig;
