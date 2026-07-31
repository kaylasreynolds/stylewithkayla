import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1 MB, which is smaller than the 5 MiB event image cap
      // (see EVENT_IMAGE_MAX_BYTES in lib/event-editor-client.ts) and was
      // silently rejecting uploads with a generic 413 before they reached
      // /api/admin/events/assets. Give some headroom over 5 MiB for
      // multipart/form-data boundary overhead.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;