import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/applications", destination: "/saved-patrons", permanent: true }];
  },
};

export default nextConfig;
