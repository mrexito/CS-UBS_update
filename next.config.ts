import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Das Paket "typescript" ist auf die TS-6-API gealiast (siehe package.json),
    // liefert aber kein "tsc"-Binary. Darum den Typecheck ueber die JS-API laufen lassen.
    useTypeScriptCli: false,
  },
  images: {
    // Erlaube Avatare von GitHub & Google
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
