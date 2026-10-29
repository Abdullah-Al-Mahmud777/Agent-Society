import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ["@libsql/client", "libsql"],
  /* config options here */
  reactCompiler: true,
  // Suppress hydration warnings in development (usually from fonts or browser extensions)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
