<template>
    <div class="chat-group-box">
        <div class="top">
            <div class="no-chat" @click="handlerMuteAllMembers">
                <span class="iconfont icon-jinyan"></span>
                <span>{{speakContorlText}}</span>
            </div>
            <div class="title" @click="test">聊天</div>
            <div class="font-size-box">
                <img src="../../assets/img/chat2.png">
                <el-select v-model="fontSizeValue" placeholder="请选择" size='mini'>
                    <el-option
                        v-for="item in fontSize"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    ></el-option>
                </el-select>
            </div>
        </div>

        <div class="chat-content-box" id="chat-content-box" ref="chatBox" @scroll="scrollToTop">
            <!--系统提示-->   
            <div class="platform-prompt" v-show="noticeAlert" ref="platformPrompt">
                <el-alert
                    title="群公告"
                    type="warning"
                    :description="noticeAlert"
                    @close='handleCloseAlert'
                >
                </el-alert>
            </div>
            
            <!--消息-->
            <div
                v-for="item in msgs"
                :key="item.time"
                class="user-prompt-box"
                :class="{'own-right':item.send == account,'other-left':item.send != account&&item.send !='群消息'&&!isSpeakControl(item.content)}"
            >
                <div
                    class="user-prompt"
                    v-if="item.send ==='群消息' || isSpeakControl(item.content)"
                >
                    <span>{{item.time}}</span>
                    <span>{{item.content | filtersPromptText(that,item.send)}}</span>
                </div>

                <!--我的发言-->
                <div class="own-chat" v-if="item.send == account">
                    <div>
                        <span>{{item.time}}</span>
                        <span>·我</span>
                    </div>

                    <!-- 文本类消息 -->
                    <div v-if="!item.img" :style="{'font-size': computedFontSize(fontSizeValue)}">
                        <div v-if="item.type === 1 && item.qs" class="anwser-msg" >
                            <div>
                                <span class="iconfont icon-wenq"/>{{item.qs}}
                            </div>
                            <div><span class="iconfont icon-huidaa"/>{{item.content}}</div>
                        </div>
                        <span v-else>{{item.content}}</span>
                    </div>

                    <!-- 图片消息 -->
                    <div v-else v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.5)" style="border-radius:0;padding: 3px;">
                        <viewer :images="[item.img]" style="margin-bottom:0">
                            <img :src="item.img" ref="ownSendImg" style="cursor: pointer;">
                        </viewer>
                    </div>
                </div>
                <!--其他成员发言-->
                <div class="other-chat" v-if="item.send != account&&item.send !='群消息'&& !isSpeakControl(item.content)">
                    <div>
                        <span>{{item.send}}·</span>
                        <span>{{item.time}}</span>
                    </div>

                    <!-- 文本类消息 -->
                    <div v-if="!item.img" :style="{'font-size': computedFontSize(fontSizeValue)}">
                        <div v-if="item.type === 1 && !item.qs" class="question-msg" @click="handleReplyQuestion(item)">
                            <span class="iconfont icon-wenq" style="color: rgb(234 168 100);display:inline-block;margin-right:5px"></span>
                            <span>{{item.content}}</span>
                        </div>
                        <div v-if="item.type === 1 && item.qs" class="anwser-msg" >
                            <div>
                                <span class="iconfont icon-wenq"/>{{item.qs}}
                            </div>
                            <div><span class="iconfont icon-huidaa"/>{{item.content}}</div>
                        </div>
                        <span v-if='item.type != 1'>{{item.content}}</span>
                    </div>

                    <!-- 图片消息 -->
                    <div v-else style="border-radius:0;padding: 3px;">
                        <viewer :images="[item.img]" style="margin-bottom:0">
                            <img :src="item.img" style="cursor: pointer;">
                        </viewer>
                    </div>
                </div>
            </div>
        </div>

        <!--编辑群资料-->
        <el-dialog :visible.sync="noticeDialogVisible" width="30%">
            <div slot="title" class="header-title">
                <span><i class="el-icon-edit-outline"></i>编辑群公告</span>
            </div>

            <el-input
                type="textarea"
                placeholder="请输入公告内容"
                v-model="editNoticeValue"
                maxlength="150"
                :rows=6
                show-word-limit
            >
            </el-input>
            
            <div slot="footer" class="dialog-footer">
                <el-button @click="noticeDialogVisible = false" size="small">取 消</el-button>
                <el-button type="primary" @click="handleReleaseNotice" size="small">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { mapState,mapActions } from 'vuex';
import EventBus from '../../utils/eventBus'
import { getMessageList,getGroupMemberProfile,getGroupProfile,groupEstoppel,addTIMEventListener,releaseGroupNotice,sendCustomMessage,getGroupMemberList } from '../../utils/TIM/index'

export default {
    data() {
        return {
            account:'',
            msgs: [],
            imMsg: {
                common: {},
                custom: {}
            },

            fontSize: [
                {
                    value: 0,
                    label: "常规"
                },
                {
                    value: 1,
                    label: "中等"
                },
                {
                    value: 2,
                    label: "加大"
                },
                {
                    value: 3,
                    label: "特大"
                }
            ],
            fontSizeValue: 0,
            chatForm: {
                msg: ""
            },
            speakContorlText: "全体禁言",
            stopSpeak: false,
            loading: true,
            that:this,
            isMsgCompleted:undefined,
            nextReqMessageID:'',
            noticeDialogVisible:false,
            editNoticeValue:'',
            noticeAlert:''
        };
    },
    computed: {
        ...mapState(['GROUP_MSG','USER','IM_IS_READY','OPERATING_SWITCH','LIVING']),
        isSpeakControl: function() {
            return function(content) {
                if (content.indexOf("muteAllMembers") != -1 &&content.indexOf("userID") != -1) {
                    let contentType = typeof JSON.parse(content);
                    if (contentType === "object") {
                        if (JSON.parse(content).userID) {
                            return true; //代表禁言
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
        },
        // 调整聊天字体大小
        computedFontSize: function() {
            return function(fontLevel) {
                switch (fontLevel) {
                    case 0:
                        return '14px'
                        break;
                    case 1:
                        return '16px' 
                        break;
                    case 2:
                        return '18px'
                        break;
                    case 3:
                        return '22px'
                        break;
                }
            };
        },
    },
    watch: {
        'GROUP_MSG'(arr){
            this.msgs = arr
            this.$nextTick(()=>{
                let height = this.$refs.chatBox.scrollHeight;
                this.$refs.chatBox.scrollTop = height;
            })
        },
        'IM_IS_READY'(status){
            if(status)
            this.account = this.USER.USER_ID
            //打开会话时，第一次拉取消息列表
            getMessageList({ type:0 },(messageList,nextReqMessageID,isMsgCompleted)=>{
                this.loading = false
                this.nextReqMessageID = nextReqMessageID
                this.isMsgCompleted = isMsgCompleted;
            });

            getGroupProfile(groupInfo => {
                this.noticeAlert = this.editNoticeValue = groupInfo.notification
            })
        }
    },
    filters: {

        /**
         * @param content 消息内容;
         * @param that this;
         * @param send 消息发送者;
        */
        filtersPromptText(content,that,send) {
            if (content.indexOf("muteAllMembers") != -1 && content.indexOf("userID") != -1) {
                let contentType = typeof JSON.parse(content);
                if (contentType === "object") {
                    if (JSON.parse(content).userID) {
                        let promptContent = JSON.parse(content);
                        if (promptContent.muteAllMembers) {
                            if(promptContent.userID==send){
                                return `管理员${promptContent.userID}开启全员禁言`;
                            }else{
                                if(that.account == promptContent.userID){
                                    return `你已被${send} 老师限制发言`
                                }else{
                                    return `${promptContent.userID}已被管理员禁言`
                                }
                            }
                        } else {
                            if(promptContent.userID==send){
                                return `管理员${promptContent.userID}已解除全员禁言`;
                            }else{
                                if(that.account == promptContent.userID){
                                    return `你的禁言已解除 请妥善发言`
                                }else{
                                    return `管理员已解除${that.account}禁言`
                                }
                            }
                        }
                    } else {
                        return content;
                    }
                } else {
                    return content;
                }
            } else {
                return content;
            }
        }
    },
    methods: {
        ...mapActions(['syncUpdateGroupMsg']),
        test(){
            // getGroupMemberProfile(['1282977013296009218'],userInfo =>{
            //     debugger
            // })

            // getGroupProfile(groupInfo => {
            //     debugger
            // })

            // getGroupMemberList(memberList => {
            //     debugger
            // })
        },
        // 禁言
        handlerMuteAllMembers(){
            if(!this.OPERATING_SWITCH && this.LIVING == 1){
                this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                    confirmButtonText: '知道了',
                    type: 'warning'
                });
            }else{
                //true 全体禁言，false 取消全体禁言
                if (this.speakContorlText === "全体禁言") {
                    groupEstoppel(true, () => {

                    this.speakContorlText = "解除禁言";
                    this.syncUpdateGroupMsg({send:'群消息',content:'全员禁言中'})
        
                    });
                } else if (this.speakContorlText === "解除禁言") {
                    groupEstoppel(false, () => {
                        this.speakContorlText = "全体禁言";
                        this.syncUpdateGroupMsg({send:'群消息',content:'已解除禁言'})
                    });
                }
            }
        },

        scrollToTop(e){
            let scrollTop = e.srcElement.scrollTop;
            if(scrollTop<50){
                
            }
        },

        // 公告弹窗展示(兄弟组件调用sendmsg)
        noticeDialogShow(){
            this.noticeDialogVisible = true
        },

        // 发布群公告
        handleReleaseNotice(){
            if(!this.OPERATING_SWITCH && this.LIVING == 1){
                this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                    confirmButtonText: '知道了',
                    type: 'warning'
                });
            }else{
                if(this.editNoticeValue === '') return this.$message.error('公告内容不能为空');

                releaseGroupNotice(this.editNoticeValue, newGroupInfo =>{
                    this.noticeDialogVisible = false
                    
                    // 通知学员端已发布公告
                    sendCustomMessage('group',{
                        description:'editNotice'
                    })

                    getGroupProfile(groupInfo => {
                        this.noticeAlert = this.editNoticeValue = groupInfo.notification
                    })

                    this.$refs.platformPrompt.childNodes[0].style.display = 'block'
                })
            }

        },

        handleCloseAlert(){
            this.$refs.platformPrompt.childNodes[0].style.display = 'none'
        },

        // 回复问答
        handleReplyQuestion(item){
            EventBus.$emit('ReplyQuestion',item)
        }

    },
    created() {
        EventBus.$on('TIMEventListener',()=>{
            /**
             * 添加TIM监听事件
             * IM消息监听
             * IM状态监听
            */
            addTIMEventListener(this)

            this.account = this.USER.USER_ID

            this.USER.SHUT_UP_ALL_MEMBER === 'Off' ? this.speakContorlText = '全体禁言' : this.speakContorlText = '解除禁言'
        })
    },
    updated() {
        setTimeout(()=>{
            if(this.$refs.chatBox){
                let height = this.$refs.chatBox.scrollHeight;
                this.$refs.chatBox.scrollTop = height;
            }
           
        },100)
    },
}
</script>

<style lang='less' scoped>
.chat-group-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        background-color: #2b2f38;
        .no-chat {
        cursor: pointer;
        color: #C3C3C3;
        font-size: 12px;
        span{
            display: inline-block;
        }
        span:nth-child(1){
            font-size: 13px;
            margin-right: 3px;
        }
        }
        .no-chat:hover{
            color: #409EFF;
        }
        .title {
            font-size: 13px;
            color: #C3C3C3;
        }
        .font-size-box {
        display: flex;
        align-items: center;
        img {
            width: 16px;
            height: 14px;
            margin-right: 5px;
        }
        .el-select {
            width: 75px;
            border-color: none;
            /deep/ .el-input__inner {
            padding-top: 0;
            padding-bottom: 0;
            background-color: #fff;
            border-radius: 25px;
            font-size: 11px;
            border-color: rgba(0, 0, 0, 0);
            color: rgb(109, 109, 109);
            }
        }
        }
    }

    .chat-content-box {
        flex: 1;
        overflow-y: scroll;
        overflow-x: hidden;
        padding: 10px 0;
        .platform-prompt{
            width: 100%;
            padding: 0 20px;
            margin-bottom: 10px;
            /deep/.el-alert{
                align-items: flex-start;
                i{
                    font-size: 16px;
                    transform: translateY(1px);
                }
                .el-alert__content{
                    text-align: left;
                }
            }
        }
        .user-prompt-box {
            display: flex;
            justify-content: center;
            align-items: center;
            .user-prompt {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 5px 10px;
                border-radius: 10px;
                font-size: 8px;
                color: #fff;
                margin-bottom: 10px;
                span:nth-child(1) {
                    display: inline-block;
                    margin-right: 5px;
                }
                span:nth-child(2) {
                    line-height: 14px;
                }
            }
            .own-chat,
            .other-chat {
                font-size: 14px;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                max-width: 100%;
                div:nth-child(1) {
                    color: #fff;
                    font-size: 14px;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    span {
                        display: inline-block;
                    }
                    span:nth-child(1) {
                        font-size: 11px;
                        transform: translateY(-1px);
                    }
                }
                div:nth-child(2) {
                    text-align: left;
                    background-color: #409EFF;
                    color: #fff;
                    border-radius: 25px 0 25px 25px;
                    padding: 7px 10px 7px 15px;
                    max-width: 100%;
                    word-wrap:break-word;
                    img {
                        width: 100px;
                        object-fit: contain;
                    }
                }
            }
            .own-chat{
                align-items: flex-end;
            }
            .other-chat {
                align-items: flex-start;
                div:nth-child(1) {
                    justify-content: flex-start;
                span:nth-child(1) {
                    font-size: 14px;
                }
                span:nth-child(2) {
                    font-size: 11px;
                    transform: translateY(-1px);
                }
                }
                div:nth-child(2) {
                    background-color: #424145;
                    color: #fff;
                    border-radius: 0px 25px 25px 25px;
                    padding: 5px 10px;
                }
            }
        }
    }
    .chat-content-box::-webkit-scrollbar {
        width: 5px;
        height: 10px;
    }
    .chat-content-box::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background-color: rgb(98, 98, 98);
    }
}
.own-right {
  justify-content: flex-end !important;
  align-items: flex-end !important;
  padding: 0 10px;
}
.other-left {
  justify-content: flex-start !important;
  align-items: flex-start !important;
  padding: 0 10px;
}

.header-title>span{
    color: #000;
    font-size: 18px;
    i{
        display: inline-block;
        margin-right: 3px;
        color: rgb(136, 136, 136);
        transform: translateY(1px);
    }
}

.question-msg{
    margin-bottom:0 !important;
    cursor: pointer;
    span:nth-child(1){
    }
    span:nth-child(2){
        font-size: 14px !important;
    }
}
.question-msg:hover{
    color: #409EFF !important;
}

.anwser-msg{
    margin-bottom:0 !important;
    flex-direction: column;
    align-items: flex-start !important;
    div{
        margin-bottom:0 !important;
        padding: 0 !important;
        font-size: 14px !important;
        span{
            font-size: 14px !important;
            margin-right: 5px;
        }
    }

    div:nth-child(1){
        border-bottom: 1px dashed #fff;
        padding-bottom: 8px !important;
    }

    div:nth-child(2){
        padding-top: 8px !important;
        span{
            color: #f2b6a1;
        }
    }
    
}
</style>