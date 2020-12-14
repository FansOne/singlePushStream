<template>
    <div class="container">
        <div class="start-btn-box">
            <el-button  :type="LIVING===3 || LIVING ===2 ?'primary':'warning'" round size="medium" @click="handleLiveStatus">{{ LIVING ===3 || LIVING ===2 ? '开始直播' : '结束直播' }}</el-button>
            <div>· {{LIVING === 3 || LIVING ===2 ?'待推流':'直播中'}}</div>
            <!-- 计时器 -->
            <div class="timer" v-show="LIVING === 1">
                <div ref="startTimer">00:00:00</div>
            </div>
        </div>

        <el-popover
            popper-class='share-popover'
            placement="bottom"
            width="200"
            trigger="hover">
            <div class="share-box" slot="reference">
                <div>{{liveTitle}} 直播室</div>
                <span class="iconfont icon-fenxiang"></span>
            </div>

            <img src="../../assets/img/shareERCode.png">
        </el-popover>
            
        <div class="user-info-box">
            <div class="user-nums">
                <span class="iconfont icon-qunzu"></span>
                <span>{{USER.GROUP_NUM >= 1 ? USER.GROUP_NUM : 1}}</span>
            </div>
            <div class="own">
                <span>{{USER.USER_ID}}</span>
            </div>
        </div>
    </div>
</template>

<script>
import EventBus from '../../utils/eventBus'

import { mapState,mapMutations } from 'vuex'

import { livingUpdate } from '../../api/liveStatus/index'

import { sendCustomMessage } from '../../utils/TIM/index'

export default {
    components: {},
    data() {
        return {
            liveTitle:'',
            timer: null,
            hour: 0,
            minutes: 0,
            seconds: 0,
        };
    },
    computed: {
        ...mapState(['CODE','USER','LIVING','LIVE_START_TIME','GROUP_INFO','LIVE_MODE_INDEX','OPERATING_SWITCH'])
    },
    watch:{
        'GROUP_INFO'(info){
            if(info) this.liveTitle = this.USER.TITLE
        }
    },
    created(){
        if(this.LIVE_START_TIME) this.addTimerInterval(this.LIVE_START_TIME);
    },
    methods: {
        ...mapMutations(['SET_LIVING','SET_OPERATING_SWITCH']),

        handleLiveStatus(){
            if(this.OPERATING_SWITCH || (!this.OPERATING_SWITCH && this.LIVING != 1) ){
                if(this.LIVING === 1){
                    this.$confirm('此操作将关闭当前直播, 是否继续?', 'Tips', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }).then(async () => {
                        await EventBus.$emit('unpublishLiveStream')
                        this.httpModifyLiveStatus()
                    })
                }else if(this.LIVING === 3 || this.LIVING === 2){
                    this.httpModifyLiveStatus()
                }
            }else{
                this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                    confirmButtonText: '知道了',
                    type: 'warning'
                });
            }            
        },
        
        httpModifyLiveStatus(){
            let params = {
                id: this.USER.ROOM_ID,
                userId: this.USER.MEMBER_ID,
                status: this.LIVING===3 || this.LIVING===2 ? 0 : 1, //0 开始直播 1 结束直播
                code: this.CODE
            }

            livingUpdate(params).then(res=>{

                // 设置直播状态

                if(this.LIVING===3 || this.LIVING === 2){
                    this.SET_OPERATING_SWITCH(true)
                    // 直播中
                    this.SET_LIVING(1)
                    // 直播计时
                    if(this.LIVE_START_TIME) this.addTimerInterval(this.LIVE_START_TIME)
                    else this.initTimerStart()

                    // 通知学员端直播开启(发送群组自定义消息)
                    sendCustomMessage('group',{type:this.LIVE_MODE_INDEX,description:'liveStart'})

                    this.$store.dispatch('syncUpdateGroupMsg',{send:'群消息',content:`直播已开启`})
                }else{
                    // 结束直播
                    this.SET_LIVING(3)
                    clearInterval(this.timer);

                    // 通知学员端直播结束(发送群组自定义消息)
                    sendCustomMessage('group',{description:'liveEnd'})

                    this.$store.dispatch('syncUpdateGroupMsg',{send:'群消息',content:`直播已结束（学生当前无法接收到您的音视频信息，如需继续直播请点击左上角开始直播按钮）`})
                }
            })
        },
        // 初始计时
        startTimer() {
            this.seconds += 1;
            if (this.seconds >= 60) {
                this.seconds = 0;
                this.minutes = this.minutes + 1;
            }

            if (this.minutes >= 60) {
                this.minutes = 0;
                this.hour = this.hour + 1;
            }

            this.$refs.startTimer.innerHTML = (this.hour < 10 ? "0" + this.hour : this.hour) + ":" + (this.minutes < 10 ? "0" + this.minutes : this.minutes) + ":" + (this.seconds < 10 ? "0" + this.seconds : this.seconds);
        },

        initTimerStart(){
            this.timer = setInterval(this.startTimer, 1000);
        },

        // 累加计时（后台有返回时间戳）
        addTimerInterval(initTimeStamp){
            let timestamp=new Date().getTime();
            
            let alreadyLiveTime = timestamp - initTimeStamp
            this.hour = parseInt((alreadyLiveTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            this.minutes = parseInt((alreadyLiveTime % (1000 * 60 * 60)) / (1000 * 60));
            this.seconds = parseInt((alreadyLiveTime % (1000 * 60)) / 1000);
            this.initTimerStart()
        }
    },

    beforeDestroy(){
        EventBus.$off('unpublishLiveStream')
        clearInterval(this.timer);
    }
}
</script>

<style lang='less' scoped>

    .container{
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #fff;
        span{
            display: inline-block;
        }
        .el-button{
            margin-right: 20px;
        }
        .start-btn-box{
            display: flex;
            align-items: center;
            color: #67696B;
            font-size: 12px;
            .timer{
                div{
                    font-size: 13px;
                    padding-left: 20px;
                    color: #fff;
                }
            }
        }
        .share-box{
            cursor: pointer;
            display: flex;
            align-items: center;
            div{
                color: rgba(255,255,255,.6);
                font-size: 12px;
            }
            span{
                padding-left: 7px;
                color: #67696B;
            }
        }
        .share-box:hover{
            div,span{
                color: #409EFF;
            }
        }
        .user-info-box{
            display: flex;
            align-items: center;
            .iconfont{
                color: #67696B;
                padding-right: 7px;
            }
            .user-nums{
                display: flex;
                align-items: center;
            }
            .own{
                margin-left: 13px;
            }
        }
    }

</style>