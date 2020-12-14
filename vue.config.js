const path = require('path');
function resolve(dir){
    return path.join(__dirname,dir)
}



module.exports = {
    // assetsDir: 'static',  // *仅本地开发打开 build时注掉
    publicPath: process.env.VUE_APP_PUBLIC_PATH, // *仅发布生产环境打开 本地开发时注掉
    filenameHashing:false,
    lintOnSave:false,
    devServer: {
        host: '0.0.0.0',
        port: "8081",
        disableHostCheck: true,
        open: true,
        proxy: {
            "/api": {
                target: "http://sit-wx.xuefu.com/front",
                changeOrigin: true,
                secure: false,
                pathRewrite:{
                    '^/api': ''
                }
            }
        }
    },
    // 适配
    chainWebpack: config => {        
        config.module
            .rule('less','css')

            .oneOf('vue')

            .use('px2rem-loader')

            .loader('px2rem-loader')

            .before('postcss-loader') // this makes it work.

            .options({
                remUnit: 192, //代表的是 1rem = ？px  设计稿是 1920px ，那么这里的比例就是 1/10
                remPrecision: 5
            })
            .end()
    },

    chainWebpack: config=>{
        config.resolve.alias.set('@',resolve('src'))
    }

};