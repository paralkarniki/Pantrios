/** @type {import('next').NextConfig} */
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig = {
	distDir: process.env.NEXT_DIST_DIR || '.next',
	reactStrictMode: true,
	poweredByHeader: false,
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	basePath: repoName,
	assetPrefix: repoName,
	async headers() {
		const securityHeaders = [
			{ key: 'X-Content-Type-Options', value: 'nosniff' },
			{ key: 'X-Frame-Options', value: 'DENY' },
			{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
			{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
			{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
			{ key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
			{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
		]

		return [
			{
				source: '/:path*',
				headers: securityHeaders,
			},
		]
	},
};

module.exports = nextConfig;
