import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // pg bundled for server; serverExternalPackages caused runtime module-not-found
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    return config;
  },
};

export default nextConfig;
