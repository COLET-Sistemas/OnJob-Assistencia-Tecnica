import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Proxy para evitar problemas de CORS
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "http://10.0.1.14:8080/:path*", 
      },
    ];
  },

  allowedDevOrigins: [
    "10.0.0.151",
    "10.0.1.14",
    "10.0.0.154",
    "10.0.1.10",
    "10.0.1.14",
    "10.0.1.6",
    "192.168.137.1",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; connect-src 'self' https://viacep.com.br https://maps.googleapis.com http://10.0.0.151:8080 http://10.0.1.14:8080 http://192.168.137.1:8080 http://172.18.112.1:8080 http://10.0.0.154:8080 http://10.0.1.10:8080 http://10.0.1.6:8080; img-src * data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://www.google.com https://www.youtube.com https://www.facebook.com https://www.instagram.com https://www.linkedin.com; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
