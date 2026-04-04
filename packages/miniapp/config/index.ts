import { defineConfig } from '@tarojs/cli'

// 读取环境变量，构建时注入到小程序代码中
// 开发时在 .env.dev 中设置 TARO_APP_API_URL=http://localhost:3000
// 生产构建时设置 TARO_APP_API_URL=https://chenhanwen.site:3000
const apiUrl = process.env.TARO_APP_API_URL || 'https://chenhanwen.site:3000'

export default defineConfig({
  projectName: 'smart-shop',
  date: '2024-01-01',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-framework-react',
  ],
  // 编译时将常量注入到小程序 bundle，替换源码中的 TARO_APP_API_URL
  defineConstants: {
    TARO_APP_API_URL: JSON.stringify(apiUrl),
  },
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: [],
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
})
