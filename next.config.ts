import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["maps.googleapis.com"],
  },
  // Configure allowed development origins for cross-origin requests
  allowedDevOrigins: ["10.0.0.151", "10.0.1.14", "10.0.0.154"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; connect-src 'self' http://10.0.0.151:8080 http://10.0.1.14:8080 http://10.0.0.154:8080; img-src *; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://www.google.com https://www.youtube.com https://www.facebook.com https://www.instagram.com https://www.linkedin.com; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
