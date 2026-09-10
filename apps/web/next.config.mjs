import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** @type {import('next').NextConfig} */
export default {
  output: 'standalone', outputFileTracingRoot: root,
  images: { unoptimized: true },
  transpilePackages: ['@doorsignal/core'], poweredByHeader: false,
  serverExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-secrets-manager', '@aws-sdk/client-bedrock-runtime', '@aws-sdk/client-sesv2', 'aws-jwt-verify'],
  async redirects() { return [{ source: '/:path*', has: [{ type: 'host', value: 'www.doorsignal.site' }], destination: 'https://doorsignal.site/:path*', permanent: true }]; },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'same-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  ] }]; },
};
