import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Add any custom Next.js config here if needed
  devIndicators: false,
  // Note: With output: 'export', the headers won't be automatically applied to the static files.
  // You'll need to configure these headers in your hosting provider/server instead.
  async headers() {
    return [
      {
        // Apply to all paths
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);
