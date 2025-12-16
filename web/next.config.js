/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用静态导出，使用服务端渲染
  // output: 'standalone', // 暂时禁用，因为会导致预渲染问题
  
  // 启用严格模式
  reactStrictMode: true,
  
  // 允许外部图片
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

