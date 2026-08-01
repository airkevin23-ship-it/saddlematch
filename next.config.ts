import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep Next.js inside this project when other package lockfiles exist on the
  // computer. Without this, local builds can accidentally try to scan a parent
  // directory that the app does not need.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
