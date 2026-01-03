import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:5001/api";
const remotePatterns: RemotePattern[] = [];

try {
  const parsed = new URL(apiUrl);
  remotePatterns.push({
    protocol: parsed.protocol.replace(":", ""),
    hostname: parsed.hostname,
    port: parsed.port || undefined,
  });
} catch {
  // leave patterns empty if URL is invalid
}

// Allow common local hosts to avoid private IP blocking in dev
remotePatterns.push(
  { protocol: "http", hostname: "localhost" },
  { protocol: "https", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
  { protocol: "https", hostname: "127.0.0.1" }
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
