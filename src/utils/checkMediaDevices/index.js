const TRTC =  window.TRTC;

/**
 * @param media 可选值 'getCameras','getMicrophones','getSpeakers'
 */
export const checkDevicesEnv = function checkDevicesEnv(media,self){
    return new Promise((resolve, reject) =>{
        TRTC.checkSystemRequirements().then(result => {
            if(!result){
                self.$confirm('您的浏览器不兼容此应用！\n建议下载最新版Chrome浏览器，是否跳转至下载页面？', '系统提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    window.location.href = 'http://www.google.cn/chrome/';
                })
            }else{
                // 用户授权摄像头、麦克风设备
                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                })
                .then(() =>{

                    // 获取媒体输入输出设备列表。
                    TRTC.getDevices()
                    .then(devices => {
                        devices.forEach(item => {
                            // console.log('媒体输入输出设备列表↓↓↓: ',item);
                        });
                    })
                    .catch(error => console.error('TRTC.getDevices() Error', error));

                    let getCameras = TRTC.getCameras(); // 获取摄像头设备列表。
                    let getMicrophones = TRTC.getMicrophones(); //获取麦克风设备列表

                    // 返回检测到的对应媒体设备
                    if(media === '摄像头'){
                        getCameras.then(res => {
                            //摄像头设备列表
                            let camerasArr = res;
                            resolve(camerasArr)
                        })
                    }else if(media === '麦克风'){
                        getMicrophones.then(async res => {
                            //麦克风设备列表
                            let MicrophonesArr = res; 
                            resolve(MicrophonesArr)
                        })
                    }
                })
                .catch(error=>{
                    console.warn(`FPZ错误===>：${error}用户授权摄像头、麦克风设备失败`)
                    reject(error)
                })
            }
        })

        TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.DEBUG);
        TRTC.Logger.enableUploadLog();
    })
}