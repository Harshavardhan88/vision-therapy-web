/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Required for Capacitor
    images: {
        unoptimized: true, // Required for static export
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
