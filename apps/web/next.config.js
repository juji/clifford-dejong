import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  devIndicators: false,
  pwa: {
    dest: 'public',
    disable: !isProd,
    register: true,
    skipWaiting: true,
    // You can add more options here if needed
  },
});

export default nextConfig;