<template>
    <div class="contoiner">
        <div class="flex-top">
            <!--摄像头-->
            <div class="control-item" :class="{'control-item-select':LIVE_MODE_INDEX===0}" @click="handlerSwitchMode(0)">
                <span class="iconfont icon-shexiangtou1" style="font-size:30px;"></span>
                <div>摄像头</div>
            </div>
            <!--课件-->
            <div class="control-item" :class="{'control-item-select':LIVE_MODE_INDEX===1}" @click="handlerSwitchMode(1)">
                <span class="iconfont icon-bianzubeifen"></span>
                <div>课件</div>
            </div>
            <!--屏幕共享-->
            <div class="control-item" :class="{'control-item-select':LIVE_MODE_INDEX===2}" @click="handlerSwitchMode(2)">
                <span class="iconfont icon-pingmugongxiangkai"></span>
                <div>屏幕共享</div>
            </div>
        </div>

        <div class="flex-bottom">
            <!--疑问-->
            <el-tooltip class="item" effect="dark" content="使用指引" placement="right">
                <div class="control-item">
                    <span class="iconfont icon-yiwen"></span>
                </div>
            </el-tooltip>
            <!--设置-->
            <el-tooltip class="item" effect="dark" content="设备检测/切换媒体设备" placement="right">
            <div class="control-item" @click="handlerSettingDialog">
                <i class="el-icon-setting"></i>
            </div>
            </el-tooltip>
        </div>

        <!-- 设备检测弹窗 -->
        <el-dialog
            custom-class='check-media-dialog'
            :visible.sync="dialogVisible"
            width="25%"
            center
            top='20vh'
            :show-close='false'
            :close-on-click-modal='false'
            :close-on-press-escape='false'
            simple>
            
            <div class="el-step">
                <Step ref="step"/>
            </div>
            <div class="step-content">
                <div v-show="stepCurrentIdx===1" class="content-item">
                    <div class="title">您是否能看到自己的摄像头画面？</div>
                    <div class="select-box">
                        <div class="select-title">摄像头</div>
                        <el-select v-model="currentCamerasDeviceId" placeholder="未检测到摄像头" size='small' :disabled='selectDisabled'>
                            <el-option
                            v-for="item in camerasArr"
                            :key="item.deviceId"
                            :label="item.label"
                            :value="item.deviceId">
                            </el-option>
                        </el-select>
                    </div>
                    <!-- Live Viewport -->
                    <div class="live-viewport" id='live-viewport' v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.5)" ref="liveViewport"></div>
                </div>
                <div v-show="stepCurrentIdx===2" class="content-item">
                    <div class="title">对着麦克风喊话，能看到绿条滚动吗？</div>
                    <div class="select-box">
                        <div class="select-title">麦克风</div>
                        <el-select v-model="currentMicrophonesDeviceId" placeholder="未检测到麦克风" size='small'>
                            <el-option
                            v-for="item in microphonesArr"
                            :key="item.deviceId"
                            :label="item.label"
                            :value="item.deviceId">
                            </el-option>
                        </el-select>
                    </div>
                    <!-- 滚动音条 -->
                    <div class="spectrum">
                        <div class="spectrum-item">
                            <span :class="{green:this.voice>=1}"></span>
                            <span :class="{green:this.voice>=2}"></span>
                            <span :class="{green:this.voice>=3}"></span>
                            <span :class="{green:this.voice>=4}"></span>
                            <span :class="{green:this.voice>=5}"></span>
                            <span :class="{green:this.voice>=6}"></span>
                            <span :class="{green:this.voice>=7}"></span>
                            <span :class="{green:this.voice>=8}"></span>
                            <span :class="{green:this.voice>=9}"></span>
                            <span :class="{green:this.voice>=10}"></span>
                        </div>
                    </div>
                </div>
                <div v-show="stepCurrentIdx===3" class="content-item" style="width:100%">
                    <el-table
                        :data="checkTableData"
                        style="width: 100%"
                    >
                        <el-table-column 
                            prop="title" 
                            label="检测项目" 
                            align="center" 
                            header-align="center"
                        ></el-table-column>
                        <el-table-column
                            prop="result"
                            label="检测结果"
                            align="center"
                            header-align="center"
                        ></el-table-column>
                        <el-table-column
                            prop="details"
                            label="检测详情"
                            align="center"
                            header-align="center"
                        ></el-table-column>
                    </el-table>
                </div>
            </div>

            <span slot="footer" class="dialog-footer">
                <el-button size="small" @click="stepFail">{{stepCurrentIdx>=3?'重新检测':'不可以看到'}}</el-button>
                <el-button type="primary" @click="nextStep"  size="small">{{stepCurrentIdx>=3?'进入课堂':'可以看到'}}</el-button>
            </span>
        </el-dialog>
        
        <!-- 跳转屏幕分享确认弹窗 -->
        <el-dialog
            custom-class='jump-tips-dialog'
            :visible.sync="screenShareDialog"
            width="27%"
            top='30vh'
            center
            :show-close='false'
            >

            <i class="el-icon-warning"></i>
            <p class="title">提示</p>
            <p class="prompt">切换成屏幕共享模式后，将停止摄像头以及课件的直播，是否继续？</p>

            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="screenShareDialog = false">取 消</el-button>
                <el-button size="medium" type="primary" @click="handlerShareScreenConfirm">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 跳出屏幕分享确认弹窗 -->
        <el-dialog
            custom-class='jump-tips-dialog'
            :visible.sync="leaveShareDialog"
            width="27%"
            top='30vh'
            center
            :show-close='false'
            >

            <i class="el-icon-warning"></i>
            <p class="title">提示</p>
            <p class="prompt">切换成摄像头模式后，将停止屏幕共享以及使用课件直播，是否继续？</p>

            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="leaveShareDialog = false">取 消</el-button>
                <el-button size="medium" type="primary" @click="handlerleaveShareDialog">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 跳出课件直播确认弹窗 -->
        <el-dialog
            custom-class='jump-tips-dialog'
            :visible.sync="leaveCourseWareDialog"
            width="27%"
            top='30vh'
            center
            :show-close='false'
            >

            <i class="el-icon-warning"></i>
            <p class="title">提示</p>
            <p class="prompt">切换成摄像头模式后，将停止使用课件直播，是否继续？</p>

            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="leaveCourseWareDialog = false">取 消</el-button>
                <el-button size="medium" type="primary" @click="handlerleaveCourseWareDialog">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { Login } from '../../api/login/index'

import { mapState,mapMutations } from 'vuex'
import { checkDevicesEnv } from '../../utils/checkMediaDevices/index'
import Step from '../../components/UIComponents/step'
import EventBus from '../../utils/eventBus'

import initSDK from '../../utils/initSDK/index'
import { createStream,createShareStream } from '../../utils/TRTC/index'
import { sendCustomMessage } from '../../utils/TIM/index'
import { pollingCode } from '../../utils/pollingUtils'


var initSDKClass;
var voiceTimer;
var loading = null;

export default {
    components: {
        Step
    },
    data() {
        return {
            loading:true,
            selectDisabled:true,
            dialogVisible:false,
            screenShareDialog:false,
            leaveShareDialog:false,
            leaveCourseWareDialog:false,
            stepCurrentIdx:1,
            localStream:null,
            camerasArr:[],
            currentCamerasDeviceId:'',
            microphonesArr:[],
            currentMicrophonesDeviceId:'',
            level: 0,
            voice: 0,
            checkTableData: [
                {
                    title: "视频检测",
                    result: "",
                    details: ""
                },
                {
                    title: "麦克风检测",
                    result: "",
                    details: ""
                }
            ],
            haveNewStream:false, //是否在设置弹窗创建新的流
            isShareScreening:false,//记录当前是否在分享桌面
            currentClickIdx:0,
        };
    },

    computed: {
        ...mapState(['LIVING','LIVE_MODE_INDEX','JOIN_ROOM_SUCCESS','HAVE_COURSEWARE','IS_PPT_FILE','USER','CODE','OPERATING_SWITCH']),
    },

    watch: {
        // 摄像头切换
        'currentCamerasDeviceId'(deviceId){
            if(this.loading === false){
                this.loading = true
                this.localStream.switchDevice('video', deviceId).then(() => {
                    // camera切换成功
                    this.loading = false
                });
            }
        },
        
        // 麦克风切换
        'currentMicrophonesDeviceId'(deviceId){
            if(this.stepCurrentIdx === 2){
                this.localStream.switchDevice('audio', deviceId).then(() => {
                    // audio切换成功
                });
            }
        },

        'JOIN_ROOM_SUCCESS'(status){
            if(status){
                this.dialogVisible = true
                // 创建本地流并播放(不发布流 用于本地检测)
                this.createStream()
            }
        },

        // 监听麦克风声音
        level(value) {
            // console.log(value)
            if (value >= 200 && value <= 400) {
                // 显示一格音谱
                this.voice = 1;
            } else if (value >= 401 && value <= 600) {
                this.voice = 2;
                // 显示二格音谱
            } else if (value >= 601 && value <= 800) {
                this.voice = 3;
                // 显示三格音谱
            } else if (value >= 801 && value <= 1000) {
                this.voice = 4;
                // 显示四格音谱
            } else if (value >= 1001 && value <= 1200) {
                this.voice = 5;
                // 显示五格音谱
            } else if (value >= 1201 && value <= 1400) {
                this.voice = 6;
                // 显示六格音谱
            } else if (value >= 1401 && value <= 1600) {
                this.voice = 7;
                // 显示七格音谱
            } else if (value >= 1601 && value <= 1800) {
                this.voice = 8;
                // 显示八格音谱
            } else if (value >= 1801 && value <= 2000) {
                this.voice = 9;
                // 显示九格音谱
            } else if (value > 2001) {
                this.voice = 10;
                // 显示全部音谱
            } else {
                this.voice = 0;
            }
        },
    },

    async created() {
        await this.SET_CODE(this.$route.params.code)
        Login({'code':`${this.$route.params.code}`}).then(res=>{

            // 轮询发送code
            pollingCode({ code: this.CODE,roomNumber: String(res.roomId) },5000)

            this.SET_USER_INFO({userId: res.nickname, roomId: String(res.roomId),memberId: res.memberId,groupNum: res.memberNum,shutUpAllMember: res.shutUpAllMember,title: res.title,identity: res.identity})
            this.SET_LIVE_START_TIME(res.liveStartTime)

            if(res.shutUpAllMember == 'on') this.SET_GROUP_MSG([{send:'群消息',content:'全员禁言中'}]);
            
            let teacherInfo = {
                self: this,
                sdkAppId: res.sdkAppId,    
                userId: this.USER.USER_ID,
                memberId: this.USER.MEMBER_ID,
                roomID: this.USER.ROOM_ID,
                userSig:res.userSig
            };

            let checkCameras = checkDevicesEnv('摄像头',this);
            let checkMicrophones = checkDevicesEnv('麦克风',this);
            
            Promise.all([checkCameras,checkMicrophones]).then(result =>{
                this.camerasArr = result[0];
                this.currentCamerasDeviceId = result[0][0].deviceId;
                this.microphonesArr = result[1];
                this.currentMicrophonesDeviceId = result[1][0].deviceId;

                // 初始化init实例
                window.initSDKClass = initSDKClass = new initSDK(teacherInfo)
                
                // TIC登录成功回调
                initSDKClass.initTIM( async ()=>{
                    /*
                        添加TIM监听事件。
                        请在调用 login 接口前调用此接口监听事件，避免漏掉 SDK 派发的事件。
                    */
                    await EventBus.$emit('TIMEventListener')
                    
                    initSDKClass.imLogin()
                })

                // TRTC 初始化并进入房间回调
                initSDKClass.initTRTC(()=> {
                    
                    this.$store.dispatch('syncUpdateGroupMsg',{send:'群消息',content:`您已进入课堂`})
                    this.SET_JOIN_ROOM_SUCCESS(true)
                })
            }).catch(async err =>{
                await sessionStorage.setItem('errInfo', err.message)
                await sessionStorage.setItem('liveCode', this.$route.params.code)
                this.$router.replace({name:'deviceNothing',params:{code:this.$route.params.code}})
            })
        }).catch(err=>{
            this.SET_NET_WORK_ERROR(true)
        })
        
    },

    mounted(){
        window.onbeforeunload = function (e) {
           return (e || window.event).returnValue = '直播正在进行中，是否立即关闭？';
        };
    },

    methods: {
        ...mapMutations(['SET_CODE','SET_LIVING','SET_LIVE_START_TIME','SET_USER_INFO','SET_LIVE_MODE_INDEX','SET_IS_SHARE_SCREENING','SET_HAVE_COURSEWARE','SET_IS_PPT_FILE','SET_NET_WORK_ERROR','SET_GROUP_MSG','SET_JOIN_ROOM_SUCCESS']),

        // 切换直播模式
        handlerSwitchMode(liveMode){
            this.currentClickIdx = liveMode

            if(liveMode === 2){
                if(this.isShareScreening) return
                else if(this.LIVING === 3 || this.LIVING === 2){
                    this.$confirm('仅在直播开始后方可进行屏幕共享操作！', '操作限制', {
                        confirmButtonText: '知道了',
                        showCancelButton:false,
                        type: 'warning',
                    })
                }else{
                    if(this.OPERATING_SWITCH) this.screenShareDialog = true; // 跳转屏幕分享前弹窗确认
                    else this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                        confirmButtonText: '知道了',
                        type: 'warning'
                    });
                }
            }else if((liveMode === 0 || liveMode === 1) && this.isShareScreening){
                this.leaveShareDialog = true
            }else if(liveMode===0 && this.HAVE_COURSEWARE || liveMode===0 && this.IS_PPT_FILE){
                // 跳出课件直播确认弹窗
                this.leaveCourseWareDialog = true;
            }else{
                this.SET_HAVE_COURSEWARE(false)
                this.SET_IS_PPT_FILE(false)
                this.SET_LIVE_MODE_INDEX(liveMode)
            }

            // 通知学员端切换直播模式
            if(this.LIVING == 1 && this.OPERATING_SWITCH){
                // 发送群组自定义消息
                let parmas = {
                    type:liveMode,
                    description:'liveMode'
                };
                sendCustomMessage('group',parmas)
            } 
        },

        nextStep(){
            this.$refs.step.nextStep(currentIdx =>{
                if(currentIdx<4){
                    this.stepCurrentIdx = currentIdx
                    if(currentIdx ===2){
                        this.checkTableData[0].result = '正常'
                        this.checkTableData[0].details = '可以看到视频'
                    }else if(currentIdx===3){
                        this.checkTableData[1].result = '正常'
                        this.checkTableData[1].details = '可以看到绿条滚动'
                    }
                }else{
                    // 进入课堂
                    clearInterval(voiceTimer)
                    this.dialogVisible = false
                    this.localStream.stop()

                    // middleLive组件发布并播放本地流
                    EventBus.$emit('publishStream',this.localStream,this.haveNewStream)
                }
            })
        },
        stepFail(){
            this.$refs.step.stepFail(currentIdx =>{
                this.stepCurrentIdx = currentIdx
                if(currentIdx ===2){
                    this.checkTableData[0].result = '异常'
                    this.checkTableData[0].details = '不可以看到视频'
                }else if(currentIdx===3){
                    this.checkTableData[1].result = '异常'
                    this.checkTableData[1].details = '不可以看到绿条滚动'
                }
            })
        },

        // 创建本地流并播放(不发布流 用于本地检测)
        createStream(callback){
            let params = {
                microphoneId: this.currentMicrophonesDeviceId,
                cameraId: this.currentCamerasDeviceId
            };

            createStream(params, localStream =>{
                localStream.setVideoProfile('1080p'); 
                this.localStream = localStream

                callback && callback()

                localStream.play('live-viewport').then(() => {
                    this.loading = false;
                    this.selectDisabled = false;
                    this.macPhoneStreamVolume()
                }).catch((e) => {
                    const errorCode = e.getCode();
                    if (errorCode === 0x4043) {
                        // PLAY_NOT_ALLOWED,引导用户手势操作恢复音视频播放
                        localStream.resume()
                    }
                });
            })
        },

        // 音频采集 获取音频流麦克风输出音量
        macPhoneStreamVolume() {
            voiceTimer = setInterval(() => {
                const level = this.localStream.getAudioLevel();
                this.level = parseInt(level * 10000);
            }, 200);
        },

        // 设置弹窗
        handlerSettingDialog(){

            if(this.OPERATING_SWITCH || this.LIVING != 1) {
                this.$refs.step.activeIndex = 1
                this.stepCurrentIdx = 1
                this.dialogVisible = true
                this.loading = true
                this.createStream(()=>{
                    this.haveNewStream = true
                })
            }else{
                this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                    confirmButtonText: '知道了',
                    type: 'warning'
                });
            }
        },

        // 确认分享屏幕
        handlerShareScreenConfirm(){
            // 创建本地屏幕分享流对象
            let params = {};
            params.microphoneId = this.localStream.getAudioTrack().id
            createShareStream(params, shareStream =>{
                this.SET_IS_PPT_FILE(false)
                this.SET_HAVE_COURSEWARE(false)

                /**
                 * 创建本地分享流成功回调
                 * 通知middleLive组件取消发布当前本地流
                */
                EventBus.$emit('unpublishStream',shareStream)

                // 接收组件成功取消本地已经发布的音频流
                EventBus.$on('alreadyUnpublishStream',()=>{
                    this.screenShareDialog = false
                    this.isShareScreening = true
                    this.SET_IS_SHARE_SCREENING(true)
                    // 屏幕共享直播
                    this.SET_LIVE_MODE_INDEX(2)
                })
            })
        },
        // 离开屏幕分享视口前确认
        async handlerleaveShareDialog(){

            // 通知middleLive组件取消发布本地分享流
            await EventBus.$emit('unpublishShareStream')

            // middleLive组件发布并播放本地流
            await EventBus.$emit('publishStream',this.localStream,false,this.currentClickIdx)

            this.leaveShareDialog = false
            this.isShareScreening = false
            this.SET_LIVE_MODE_INDEX(this.currentClickIdx)
            this.SET_IS_SHARE_SCREENING(false)
        },
        // 离开课件直播视口前确认
        handlerleaveCourseWareDialog(){
            this.SET_IS_PPT_FILE(false)
            this.SET_HAVE_COURSEWARE(false)
            this.leaveCourseWareDialog = false
            this.SET_LIVE_MODE_INDEX(0)
        }
    },

    beforeDestroy(){
        EventBus.$off('publishStream')
        EventBus.$off('unpublishStream')
        EventBus.$off('unpublishShareStream')
        EventBus.$off('TIMEventListener')
    }
}
</script>

<style lang='less' scoped>
    .contoiner{
        height: 100%;
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        span{
            display: inline-block;
        }
        .control-item{
            cursor: pointer;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px 0;
            span{
                font-size: 25px;
                margin-bottom: 5px;
            }
            div{
                font-size: 12px;
            }
        }
        .control-item-select{
            background-color: #2C3038;
        }
        .flex-top{}
        .flex-bottom{
            .icon-yiwen{
                margin-bottom: 0;
            }
            .icon-yiwen,.el-icon-setting{
                font-size: 20px;
                color: gray;
            }
            .el-icon-setting{
                font-size: 21px;
            }
        }
    }

    .green {
        background-color:#37AC4F !important;
    }

    /deep/ .has-gutter .cell{
        color: #000;
        font-size: 12px;
    }
    /deep/ .el-table__row .cell{
        font-size: 12px;
    }
    /deep/ .el-table::before{
        z-index: -1;
    }
</style>