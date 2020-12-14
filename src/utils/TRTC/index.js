/**
 * @param Tips *在进行替换本地流A音视频轨道时（(async) replaceTrack(track)），替换成功后本地流A对象和多替换的流对象都不发生改变！
 *              所以如果需要在不同的 组件/DOM节点 中重新播放新替换后的音视频流时，建议不使用replaceTrack进行替换流操作，而是直接对本地流A进行取消订阅重新覆盖操作
*/

import $store from '../../store/index'
// 退出音视频直播间
export const leaveLiveRoom = function(callback){
    window.trtcClient.leave().then(() => {
        callback()
    }).catch(error => {
        console.error('leaving room failed: ' + error);
    });
}
// 创建本地流
export const createStream = function(options,callback){

    let streamConfig = {
        audio: true,
        video: true,
        microphoneId: options.microphoneId,
        cameraId: options.cameraId,
        mirror:false
    };

    const localStream = window.TRTC.createStream(streamConfig);

    localStream.initialize()
    .catch(error => {
        console.error('failed initialize localStream ' + error);
    }).then(() => {
        // 本地流初始化成功，可通过Client.publish(localStream)发布本地音视频流
        callback(localStream)
    });
}

// 创建本地屏幕分享流
export const createShareStream = async function(options,callback){

    // 从麦克风和摄像头采集本地音视频流
    let screenShareStream = await window.TRTC.createStream({
        audio: true,
        screen: true,
        microphoneId:options.microphoneId
    });

    // 设置视频分辨率等参数
    await screenShareStream.setScreenProfile({
        width: 1920,
        height: 1080,
        frameRate: 15,
        bitrate: 1600 /* kbps */
    });

    callback(screenShareStream)
}

// 发布本地流
export const publishStream = function(stream,domID,callback){
    //设置视频 Profile 该方法需要在调用 initialize() 之前调用
    stream.setVideoProfile('1080p'); 
    
    /**
     * 这里做是否发布本地流判断
     * 当讲师点击开始直播后，再发布本地流即LIVING = true
    */

    if($store.state.LIVING === 1){
        // 开始直播
        stream.initialize().then(() => {
            // 本地流初始化成功，发布本地流
            window.trtcClient.publish(stream).then(() => {
              // 本地流发布成功
              stream.play(domID)
                .then(() => {
                    callback()
                }).catch((e) => {
                    const errorCode = e.getCode();
                    if (errorCode === 0x4043) {
                        // PLAY_NOT_ALLOWED,引导用户手势操作恢复音视频播放
                        stream.resume()
                    }
                });
            })
        }).catch(err=>{
            console.error(`音视频流初始化失败${err}`)
        })
    }else{
        stream.play(domID)
        .then(() => {
            callback()
        }).catch((e) => {
            debugger
            const errorCode = e.getCode();
            if (errorCode === 0x4043) {
                // PLAY_NOT_ALLOWED,引导用户手势操作恢复音视频播放
                stream.resume()
            }
        });
    }
    
}

// 取消发布本地流
export const unpublishStream = function(stream,callback){
    /**
     * 这里需先做是否已经开始直播判断
     * 业务：开始直播后再发布本地流即LIVING = false 不必做取消发布本地流操作
    */
    if( $store.state.LIVING === 1 ){
        // 直播中 发布过本地流
        window.trtcClient.unpublish(stream).then(() => {
            // 取消发布本地流成功
            callback && callback()
        });
    }else{
        // 未发布过本地流所有不需进行取消发布操作
        callback && callback()
    }
}