module.exports = {
  publicPath: '/cilliandevops/',
  devServer: {
    port: 10086
    // proxy: {
    //   '/api': {
    //     target: '',
    //     // 允许跨域
    //     changeOrigin: true,
    //     ws: true,
    //     pathRewrite: {
    //       '^/api': ''
    //     }
    //   }
    // }
  }
}
