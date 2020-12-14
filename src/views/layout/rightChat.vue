<template>
    <div class="container">
        <div style="height:82%;display: flex;flex-direction: column;">
            <!--直播视口-->
            <div class="live-viewport" id="liveViewport" ref="liveViewPort" :class="{'live-height':LIVE_MODE_INDEX===1}"></div>

            <!--共享窗口切换-->
            <div class="switch-share" v-if="LIVE_MODE_INDEX===2" :class="{'live-height':LIVE_MODE_INDEX===2}">
                <span class="iconfont icon-pingmugongxiangkai"></span>
                <div>{{LIVING===1?'屏幕共享中...':'已停止屏幕共享'}}</div>
                <el-button size="mini" round @click="handlerSwitchShareStream" :disabled="LIVING!=1">窗口切换</el-button>
            </div>

            <!--Teacher Info-->
            <div class="user-info" :class="{'transtion-bottom':LIVE_MODE_INDEX!=0}">当前讲师：{{USER.USER_ID}}</div>

            <div class="im-group-chat-box">
                <!-- 聊天组件 -->
                <GroupChat ref="GroupChat"/>
            </div>
        </div>

        <div style="height:18%">
            <!-- 消息发送 -->
            <SendMsg/>
        </div>
    </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import EventBus from '../../utils/eventBus'
import { publishStream } from '../../utils/TRTC/index'
import GroupChat from '../../components/groupChat/index'
import SendMsg from '../../components/groupChat/sendMsg'

export default {
    components: {
        GroupChat,
        SendMsg
    },
    data() {
        return {
        };
    },
    computed: {
        ...mapState(['LIVE_MODE_INDEX','USER','LIVING'])
    },
    watch: {},
    methods: {
        ...mapMutations(['SET_IS_SHARE_SCREENING']),
        handlerSwitchShareStream(){
            EventBus.$emit('switchShareStream')
        },
        

        noticeDialogShow(){
            this.$refs.GroupChat.noticeDialogShow()
        }
    },
    created() {
        // 切换至白板时右侧小窗口播放本地流
        EventBus.$on('smallViewportPlay',stream =>{

            publishStream(stream,'liveViewport',()=>{
                this.SET_IS_SHARE_SCREENING(false)
                //本地流播放成功回调
                this.$refs.liveViewPort.children[0].children[0].style.left = 0
            })
        })
    },
    beforeDestroy(){
        EventBus.$off('switchShareStream')
    }
}
</script>

<style lang='less' scoped>
    .container{
        position: relative;
        border-left: 1px solid #000;
        height: 100%;
        color: #fff;
        display: flex;
        flex-direction: column;
        .live-viewport{
            background-color: #000;
        }
        .switch-share{
            background-color: #333;
            span{
                display: inline-block;
                margin-top: 35px;
                font-size: 30px;
                color: rgba(255,255,255,.9);
            }
            div{
                font-size: 12px;
                margin: 15px 0;
            }
            .el-button{
                background-color: #6c6c6e;
                border-color: #6c6c6e;
                color: #fff;
                padding: 7px 15px;
            }
        }
        .live-height{
            height: 230px;
        }
        .user-info{
            height: 47px;
            width: 100%;
            line-height: 47px;
            text-align: left;
            padding-left: 10px;
            background-color: #2b2f38;
        }
        .transtion-bottom{
            font-size: 11px;
            position: absolute;
            top: 195px;
            background-color: rgba(0, 0, 0, 0)
        }
        .im-group-chat-box{
            flex: 1;
            margin-top: .7px;
            min-height: 0;
        }
    }
</style>