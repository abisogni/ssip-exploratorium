import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['rss-parser'],
  outputFileTracingIncludes: {
    '/api/turing/content': ['./turing/**/*'],
  },
};

export default nextConfig;
