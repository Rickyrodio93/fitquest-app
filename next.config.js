/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Qui aggiungeremo i domini per le immagini/asset dell'avatar
      // es. { protocol: 'https', hostname: 'assets.fitquest.app' }
    ],
  },
};

module.exports = nextConfig;
