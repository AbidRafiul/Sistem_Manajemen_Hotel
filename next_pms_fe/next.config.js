/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const assetOrg = (process.env.PUBLIC_ASSET_ORG || 'http://127.0.0.1:8000').replace(/\/+$/, '');
        return [
            {
                source: '/api/assets/:path*',
                destination: `${assetOrg}/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${assetOrg}/uploads/:path*`,
            },
        ];
    }
}

module.exports = nextConfig
