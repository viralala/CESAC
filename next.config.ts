import type { NextConfig } from "next";

import { ACTION_BODY_LIMIT_BYTES } from "./src/lib/console/limits";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * Certificate uploads go through a server action, and the default here is
       * 1MB. A scan or a phone photo of a certificate is routinely several
       * times that, and the request is rejected by Next.js before any of our
       * own code runs, so the student sees the error page rather than a
       * sentence about the file being too big.
       *
       * The number lives in src/lib/console/limits.ts, next to the limit the
       * form and the action enforce, because the three have to move together.
       */
      bodySizeLimit: ACTION_BODY_LIMIT_BYTES,
    },
  },
};

export default nextConfig;
