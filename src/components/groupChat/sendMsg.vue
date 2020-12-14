<template>
    <div class="containers">
        <div class="emjio">
            <!--发送表情-->
            <el-popover 
                placement="top-start" 
                width="330" 
                trigger="click" 
                ref="emojiPopper" 
                popper-class="emoji-replay"
            >
                <div class="content-box">
                    <div
                        v-for="(item,index) in emojiChar"
                        :key="index"
                        class="fast-replay"
                        @click="handlerSendEmojiMsg(item)"
                    >{{item}}</div>

                    <div class="space-between" v-for="(item,index) in (9-40%9)" :key="index+Math.random()"></div>
                </div>

                <span class="iconfont icon-biaoqing" style="font-size:21px;transform:translateY(-1px);" slot="reference"/>
            </el-popover>
            
            <!--发送图片-->
            <span class="iconfont icon-tupian1" @click="sendImgMsg" style="margin:0 13px;font-size:18px;"/>

            <!--快捷回复-->
            <el-popover 
                placement="top-start" 
                width="300" 
                trigger="click" 
                ref="popover"
                popper-class="quickly-replay"
            >
                <div
                    v-for="(item,index) in fastReply"
                    :key="index"
                    class="fast-replay"
                    style="cursor: pointer;line-height:25px;"
                    @click="handlerFastReplay(item)"
                >{{item}}</div>

                <span class="iconfont icon-kuaijiehuifu" slot="reference" style="font-size:23px;"/>

            </el-popover>
            
            <!--编辑群资料（公告）-->
            <el-tooltip class="item" effect="dark" content="编辑群公告" placement="top">
                <div class="edit-notice"><span class="iconfont icon-notice" style="font-size:22px" @click="editNotice"/></div>
            </el-tooltip>
            
            <input
                style="display:none"
                ref="file_input"
                id="file_input"
                type="file"
                multiple
                accept="image/*"
                @change="fileInfo()"
            >

        </div>

        <div class="form-box">
            <el-form :model="chatForm" class="demo-form-inline">
                <el-form-item label="">
                    <el-input
                        type="textarea"
                        ref="sendMsgInput"
                        :rows="3"
                        v-model="chatForm.msg"
                        :disabled="stopSpeak?true:false"
                        :placeholder="stopSpeak?'禁言中...':(isAnswer?`回复${replayUserInfo.send}：${replayUserInfo.content}`:'输入讨论内容')"
                        @keydown.enter.native='handlerSendMsg'
                    ></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button
                        type="primary"
                        @click="handlerSendMsg"
                        size="small"
                        :disabled="stopSpeak?true:false"
                    >{{stopSpeak?'禁言中':'发送'}}</el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script>
import { sendImgMsg,sendGroupTextMessage } from '../../utils/TIM/index'
import { throttle } from '../../utils/pollingUtils'
import EventBus from '../../utils/eventBus'
export default {
    data(){
        return{
            fastReply: [
                "今天的课程马上开始，大家都准备下。",
                "大家复习的怎么样了？",
                "加油！",
                "大家视频卡顿吗？"
            ],
            emojiChar: [
                "😁", "😋", "😜", "😘","😂","😹","😉", "😌", "😅", "😳", "😊", "😝", "😰", "😠", "😩", "😷","😲", "😞", "😭", "😍", "😖", "😱", "😡", "😚", "😤","👿","👍","🙋","🌹","🍌","☔","🌂","💩","🌈","🌊","🌛","⏰","⏳","👀","🍏"
            ],
            chatForm: {
                msg: ""
            },
            stopSpeak: false,
            loading:true,
            replayUserInfo:{},
            isAnswer:false
        }
    },
    created(){
        // 处理学生提问 --回复问题
        EventBus.$on('ReplyQuestion', options => {
            this.replayUserInfo = options;
            this.isAnswer = true;
            this.chatForm.msg = "";

        })
    },
    methods: {
        handlerSendEmojiMsg(item){
            this.chatForm.msg = `${this.chatForm.msg}${item}`;
            this.$refs.emojiPopper.showPopper = false
            this.$refs.sendMsgInput.focus()
        },
        // 发送图片
        sendImgMsg(){
            this.$refs.file_input.click();
        },
        // 快捷回复
        handlerFastReplay(itemText){
            let params = {
                message: itemText,
                type: 0, // 聊天:0 问答：1 公告：2
                identity: this.$store.state.USER.IDENTITY
            };
            sendGroupTextMessage(params,()=>{
                this.$refs.popover.showPopper = false;
            })
        },
        // 编辑公告
        editNotice(){
            this.$parent.noticeDialogShow()
        },
        // 监听input change事件
        fileInfo() {
            let resultFile = this.$refs.file_input.files[0];
            // 如果文件存在
            if (resultFile) {
                sendImgMsg(resultFile, () => {
                    this.loading = false;
                    this.$refs.file_input.value  = ''; //重置input file
                });
            }
        },
        // 发送消息
        handlerSendMsg:throttle(function(){
            if (!this.chatForm.msg) {
                this.$message({
                    message: "不能发送空消息",
                    type: "error"
                });
            } else {
                // C2C 文本
                let params = {
                    message: this.chatForm.msg,
                    type: 0, // 聊天:0 问答：1 公告：2
                    identity: this.$store.state.USER.IDENTITY
                };

                if(this.isAnswer) params.type = 1,params.qs = `${this.replayUserInfo.send}：${this.replayUserInfo.content}`;

                sendGroupTextMessage(params,()=>{
                    this.chatForm.msg = "";
                    this.isAnswer = false
                })
            }
        })
    }
}
</script>
<style lang='less' scoped>
    .containers{
        height: 100%;
        .emjio {
            height: 40px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            background-color: #2b2f38;
            span {
                font-size: 19px;
                color: #C3C3C3;
                display: inline-block;
                cursor: pointer;
            }
            span:hover{
                color: #409EFF;
            }
        }
    }
    /deep/ .el-form,
    .demo-form-inline {
        .el-form-item {
            margin-bottom: 0 !important;
            .el-textarea__inner {
                background-color: rgba(0, 0, 0, 0);
                border: none;
                color: #fff;
            }
            .el-textarea__inner:hover {
                border-color: rgba(0, 0, 0, 0);
            }
            .el-form-item__content {
                display: flex;
                justify-content: flex-end;
                .el-button {
                    margin-top: 15px;
                    width: 60px;
                    margin-right: 15px;
                }
            }
        }
    }
    .edit-notice{
        margin-left: 9px;
        transform:translateY(-1.1px);
    }
</style>