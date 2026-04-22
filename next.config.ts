import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Producerar .next/standalone/ vid build — en självgående Node-server med minimala
  // produktionsdeps. Krävs för .deb-paketeringen (se packaging/nfpm.yaml).
  output: "standalone",
};

export default nextConfig;
