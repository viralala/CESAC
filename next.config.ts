import type { NextConfig } from "next";

import { ACTION_BODY_LIMIT_BYTES } from "./src/lib/console/limits";
import { SUPABASE_URL } from "./src/lib/supabase/config";

const supabase = new URL(SUPABASE_URL);

const nextConfig: NextConfig = {
  /*
   * There is no sign-up page any more: the department makes every account
   * from the roster, and Supabase refuses self sign-up outright. Old links to
   * /signup land on the sign-in form rather than a 404.
   */
  async redirects() {
    return [{ source: "/signup", destination: "/signin", permanent: true }];
  },

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

  images: {
    /*
     * Photographs of people, and only from the two places they are kept. By
     * path and with no query string, so this site's optimiser cannot be used
     * to fetch anything else from either host. See src/lib/photos.ts.
     *
     * Going through the optimiser is also what keeps a visitor's browser from
     * contacting Supabase Storage or Google directly: the server fetches the
     * original and the page serves the copy, which is what the privacy page
     * promises.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabase.hostname,
        port: "",
        pathname: "/storage/v1/object/public/avatars/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/d/**",
        search: "",
      },
    ],
    qualities: [75],
    /*
     * Every photo address here is written once and never reused: a new
     * upload is a new file with a new id or name. So a resized copy can be
     * kept for a month, which is what keeps a busy page from sending a burst
     * of requests to Google's image host or spending the optimiser's quota.
     */
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
