/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Disabled for Vercel dynamic routing
    // images: {
    //     unoptimized: true, // Disabled for Vercel
    // },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
