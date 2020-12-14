import TIM from 'tim-js-sdk';
import TRTC from "trtc-js-sdk";
import COS from 'cos-js-sdk-v5';

class initSDK {
    constructor(options){
        this.self = options.self
        this.sdkAppId = options.sdkAppId;
        this.userId = options.userId; //用户昵称
        this.memberId = options.memberId; //用户id
        this.roomID = options.roomID;
        this.userSig = options.userSig;
        this.tim = null; //即时通讯对象
        this.trtcClient = null;//实时音视频客户端对象
        this.msgs = []; //消息
    }

    // 初始化IM SDK
    async initTIM(callback) {

        window.timInit = this.tim = await TIM.create({ SDKAppID:this.sdkAppId });
        
        callback()
    }

    // IM登录
    imLogin() {
        this.tim.registerPlugin({'cos-js-sdk': COS}); // 在 login 前调用，以支持文件上传腾讯云对象存储
        let promise = this.tim.login({userID: this.memberId, userSig: this.userSig});

        promise.then(function(imResponse) {
            if (imResponse.data.repeatLogin === true) {
                // 标识账号已登录，本次登录操作为重复登录。v2.5.1 起支持
                // console.log(imResponse.data.errorInfo);
                this.self.$message('账号已登录，本次登录操作为重复登录');
            }
        })
        .catch(function(imError) {
            this.self.$message('登录失败');
        });
    }

    // 初始化TRTC SDK 并加入音视频房间
    async initTRTC(callback){
        let trtcClient = TRTC.createClient({
            sdkAppId: this.sdkAppId,
            userId: this.memberId,
            userSig: this.userSig,
            mode: 'rtc'
        })
        
        window.trtcClient = this.trtcClient = trtcClient

        // 加入一个音视频通话房间
        trtcClient.join({ roomId: this.roomID}).then(() => {
            callback()
          }).catch(error => {
            console.error('Join room failed: ' + error);
          });
    }

    showTip(text){
        this.self.$message(text);
    }
}

export default initSDK