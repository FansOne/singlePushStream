<template>
    <div class="container">
        <el-row class="live-region-box">
            <el-col :span="24">
                <!--视频直播-->
                <div v-show="LIVE_MODE_INDEX===0" class="live-region">
                    <div class="live-viewport" ref="liveViewPort"></div>
                </div>

                <!--课件直播-->
                <div v-show="LIVE_MODE_INDEX===1" class="live-region" ref="region">
                    
                    <div class="prompt-text" v-if="!HAVE_COURSEWARE"><div v-if="!IS_PPT_FILE"><i class="el-icon-warning"></i> 请选择/上传直播课件</div></div>

                    <el-carousel v-else :autoplay='false' indicator-position='none' :loop='false' ref="carousel" arrow='never' @change="carouselChange">
                        <el-carousel-item v-for="item in currentSeeFile" :key="item.url">
                            <el-image fit='contain' :src='item.url'/>
                        </el-carousel-item>
                        <!--自定义幻灯片切换-->
                        <div class="prev" @click="prev"><i class="el-icon-arrow-left"></i></div>
                        <div class="next" @click="next"><i class="el-icon-arrow-right"></i></div>
                    </el-carousel>
                </div>

                <!--屏幕共享直播-->
                <div v-show="LIVE_MODE_INDEX===2" class="live-region">
                    <div class="screen-share-viewport" id='screen-share-viewport' ref="screenShareViewPort"></div>
                </div>
            </el-col>
        </el-row>

        <el-row class="live-bottom-region-box">
            <el-col :span="24">
                <slot name="liveFooter" :data="liveMode"></slot>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import { mapState,mapMutations } from 'vuex'
import EventBus from '../../utils/eventBus'
import { publishStream,unpublishStream,createShareStream } from '../../utils/TRTC/index'
import { getGroupProfile,sendCustomMessage }  from '../../utils/TIM/index'

var loading;
export default {
    components: {},
    data() {
        return {
            liveMode:1,
            localStream:null,
            shareStream:null, //屏幕分享流对象
            ready:false,
            currentSeeFile:[],//当前查看文件
        };
    },
    computed: {
        ...mapState(['LIVING','CODE','OPERATING_SWITCH','LIVE_MODE_INDEX','IM_IS_READY','IS_SHARE_SCREENING','HAVE_COURSEWARE','IS_PPT_FILE','CURRENT_SEE_FILE','CURRENT_SEE_FILE_IDX']),
    },
    watch: {
        // 监听IM ready
        'IM_IS_READY'(status){
            if(status){
                // 获取群资料
                getGroupProfile( groupInfo =>{
                    this.SET_GROUP_INFO(groupInfo)
                    loading.close()
                })
            }
        },

        // 监听直播模式改变
        'LIVE_MODE_INDEX'(model){
            this.liveMode = model

            if(!this.IS_SHARE_SCREENING){
                if(model === 0 && this.ready){
                    this.localStream.stop()
                    unpublishStream(this.localStream,()=>{
                        // 发布并播放
                        publishStream(this.localStream,this.$refs.liveViewPort,()=>{
                            //本地流播放成功回调
                            this.$refs.liveViewPort.children[0].children[0].style.left = 0
                        })
                    })
                }else if(model === 1){
                    this.localStream.stop()
                    unpublishStream(this.localStream,()=>{
                        // 切换至白板时通知RightChat组件播放本地流
                        EventBus.$emit('smallViewportPlay',this.localStream)  
                    })
                }
            }
        },

        // 监听直播状态
        'LIVING'(status){
            if(status === 1){

               if(this.OPERATING_SWITCH){
                    this.localStream.stop()
                    // 发布本地流
                    if(this.liveMode === 0 && this.ready){
                        // 发布并播放
                        publishStream(this.localStream,this.$refs.liveViewPort,()=>{
                            //本地流播放成功回调
                            this.$refs.liveViewPort.children[0].children[0].style.left = 0
                        })
                    }else if(this.liveMode === 1){
                        // 切换至白板时通知RightChat组件播放本地流
                        EventBus.$emit('smallViewportPlay',this.localStream)  
                    }
               }
            }
        },
        
        //监听展示课件文件
        'CURRENT_SEE_FILE'(file){
            if(file.length) this.currentSeeFile = file, this.SET_CURRENT_SEE_FILE_IDX(0);           
        },

        // 切换幻灯片到指定页
        'CURRENT_SEE_FILE_IDX'(index){
            try {
                this.$refs.carousel.setActiveItem(index)
            } catch (error) {
                return
            }
        }
    },
    methods: {
        ...mapMutations(['SET_GROUP_INFO','SET_JOIN_ROOM_SUCCESS','SET_IS_SHARE_SCREENING','SET_BOARD_FILE_LIST','SET_LIVE_MODE_INDEX','SET_CURRENT_SEE_FILE_IDX']),

        // 播放并发布本地屏幕分享流
        publishshareStream(shareStream){
            publishStream(shareStream,'screen-share-viewport',()=>{
                // 屏幕分享流播放、发布成功回调
                this.$refs.screenShareViewPort.children[0].children[0].style.left = 0
            })
        },
        // 幻灯片切换事件
        carouselChange(index){
            this.SET_CURRENT_SEE_FILE_IDX(index)

            // 发送自定义消息通知学员端切换课件
            let params = {
                description:'coursewareSwitch',
                index:index + 1
            };
            sendCustomMessage('group',params)
        },
        // 翻页swiper
        prev() {
            this.$refs.carousel.prev();
        },
        next(){
            this.$refs.carousel.next();
        },

        handleCloseLoading(){ loading.close() }
    },
    created() {
        loading = this.$loading({
            customClass: 'create-isLoading',
            lock: true,
            background: 'rgba(0, 0, 0, .7)'
        });

        this.liveMode = this.LIVE_MODE_INDEX

        // 发布本地流
        EventBus.$on('publishStream', (stream,haveNewStream = false,currentModelIdx) =>{
            if(!haveNewStream){
                this.localStream = stream
                this.ready = true

                if(currentModelIdx != undefined){
                    if(currentModelIdx === 0){
                        publishStream(stream,this.$refs.liveViewPort,()=>{
                            this.SET_IS_SHARE_SCREENING(false)
                            //本地流播放成功回调
                            this.$refs.liveViewPort.children[0].children[0].style.left = 0
                        })
                    }else if(currentModelIdx === 1){
                        // 通知RightChat组件播放新创建的本地流
                        EventBus.$emit('smallViewportPlay',this.localStream)
                    }
                }else{
                    // 发布本地流
                    publishStream(stream,this.$refs.liveViewPort,()=>{
                        //本地流播放成功回调
                        this.$refs.liveViewPort.children[0].children[0].style.left = 0
                    })
                }
            }else{
                //更新本地流 讲师在设置弹窗已创建新的流 
                this.localStream.stop()
                // 取消之前发布的流
                unpublishStream(this.localStream,()=>{
                    this.localStream = stream
                    if(this.liveMode === 0){
                        // 发布并播放新创建的本地流
                        publishStream(stream,this.$refs.liveViewPort,()=>{
                            //本地流播放成功回调
                            this.$refs.liveViewPort.children[0].children[0].style.left = 0
                        })
                    }else if(this.liveMode === 1){
                        // 通知RightChat组件播放新创建的本地流
                        EventBus.$emit('smallViewportPlay',this.localStream)  
                    }
                })
            }
        })

        // 取消发布本地音频流(用户选择分享屏幕流)
        EventBus.$on('unpublishStream',shareStream =>{
            this.shareStream = shareStream
            this.localStream.stop()
            unpublishStream(this.localStream,()=>{
                // 已取消发布本地音视频流 通知leftControl组件关闭弹窗 切换分享视口操作
                EventBus.$emit('alreadyUnpublishStream')

                // 播放并发布本地屏幕分享流
                this.publishshareStream(shareStream)
            })
        })

        // 取消发布分享流
        EventBus.$on('unpublishShareStream',() =>{
            this.shareStream.stop()
            unpublishStream(this.shareStream)
        })

        // 切换分享流窗口
        EventBus.$on('switchShareStream',() =>{
            // 获取当前已发布本地流的视频统计数据
            window.trtcClient.getLocalVideoStats().then( stats =>{
                for (let userId in stats) {
                    let streamStatus = stats[userId]
                    if(streamStatus.bytesSent){
                        // 本地流已发布
                        this.shareStream.stop()
                        unpublishStream(this.shareStream,()=>{

                            let params = {};
                            params.microphoneId = this.localStream.getAudioTrack().id

                            createShareStream(params, shareStream =>{
                                this.shareStream = shareStream
                                // 播放并发布本地屏幕分享流
                                this.publishshareStream(shareStream)
                            })
                        })
                    }else{
                        // 本地流未发布
                        let params = {};
                        params.microphoneId = this.localStream.getAudioTrack().id

                        createShareStream(params, shareStream =>{
                            this.shareStream = shareStream
                            // 播放并发布本地屏幕分享流
                            this.publishshareStream(shareStream)
                        })
                    }
                }
            })
            
        })

        // 取消已经发布的本地流
        EventBus.$on('unpublishLiveStream',()=>{
            let currentMode = this.liveMode;
            switch (currentMode) {
                case 0: //摄像头直播
                    window.trtcClient.unpublish(this.localStream)
                    break;
                case 1: //课件直播
                    window.trtcClient.unpublish(this.localStream)
                    break;
                case 2: //屏幕共享直播
                    window.trtcClient.unpublish(this.shareStream)
                    break;
            }
        })

    },
    beforeDestroy(){
        loading.close()
        EventBus.$off('smallViewportPlay')
        EventBus.$off('alreadyUnpublishStream')
    }
}
</script>

<style lang='less' scoped>
    .container{
        height: 100%;
        color: #fff;
        .live-region-box{
            height: 82%;
            .el-col{
                height: 100%;
                .live-region{
                    position: relative;
                    overflow: hidden;
                    height: 100%;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    .live-viewport{
                        height: 100%;
                        width: 65%;
                    }
                    .prompt-text{
                        position: absolute;
                        color: rgb(116, 115, 115);
                        height: 80px;
                        line-height: 50px;
                        left: 0;
                        right: 0;
                        top: 0;
                        bottom: 0;
                        margin: auto;
                        i{
                            font-size: 14px;
                            display: inline-block;
                            transform: translateY(1px);
                        }
                    }
                    /deep/.el-carousel{
                        width: 100%;
                        height: 100%;
                        background-color: #000;

                        .el-carousel__container{
                            height: 100%;
                        }
                        .el-carousel__arrow{
                            height: 40px;
                            width: 40px;
                            background-color: rgba(255, 255, 255, .1);
                        }
                        .el-carousel__arrow:hover{
                            background-color: rgba(255, 255, 255, .3);
                        }
                    }
                }
            }
        }
        .live-bottom-region-box{
            height: 18%;
            .el-col{
                height: 100%;
            }
        }
    }

    /deep/.el-image{
        height: 100%;
    }

    .prev,.next{
        z-index: 10;
        cursor: pointer;
        position: absolute;
        width: 50px;
        height: 50px;
        text-align: center;
        line-height: 50px;
        border-radius: 50%;
        font-size: 20px;
        color: gray;
        top: 0;
        bottom: 0;
        margin: auto;
        background-color: rgba(255, 255, 255, .1);
    }
    .prev{
        left: 30px;
    }
    .next{
        right: 30px;
    }
    .prev:hover,.next:hover{
        background-color: rgba(255, 255, 255, .2);
        color: #fff;
    }

    .screen-share-viewport{
        width: 100%;
        height: 100%;
    }
</style>