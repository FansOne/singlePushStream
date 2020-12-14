<template>
    <div class="container" v-if="!netWorkError">
        <!--NAV-->
        <el-row>
            <el-col :span="24">
                <div class="nav-component">
                    <Nav/>
                </div>
            </el-col>
        </el-row>
        
        <!--content-->
        <el-row class="row-two">

            <!--左侧TAB-->
            <el-col :span="1">
                <div class="content-left-component">
                    <LeftControl/>
                </div>
            </el-col>
            
            <!--中间直播区域-->
            <el-col :span="19">
                <div class="content-middle-component">
                    <!--直播区域（视频、白板/课件、桌面分享）-->
                    <MiddleLive ref="MiddleLive">
                        <!--直播区域底部展示组件-->
                        <template slot="liveFooter" slot-scope="liveMode">
                            <LiveBottomControl :liveMode='liveMode.data'/>
                        </template>
                    </MiddleLive>
                </div>
            </el-col>

            <!--右侧 主讲信息、群组聊天区域-->
            <el-col :span="4">
                <div class="content-right-component">
                    <RightChat/>
                </div>
            </el-col>
        </el-row>
        
    </div>
    <div class="error-box" v-else>
        <div class="err-top">
            <i class="el-icon-circle-close"></i>
            <span>服务器异常</span>
        </div>
        <div class="err-bottom">
            <div>连接网络服务器失败</div>
            <div>错误代码：500</div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Nav from './nav'
import LeftControl from './leftControl'
import MiddleLive from './middleLive'
import LiveBottomControl from '../../components/liveRegionMode/liveBottomControl'
import RightChat from './rightChat'

export default {
    components: {
        Nav,
        LeftControl,
        MiddleLive,
        LiveBottomControl,
        RightChat
    },
    data() {
        return {
            netWorkError:false
        };
    },
    computed: {
        ...mapState(['NET_WORK_ERROR'])
    },
    watch: {
        'NET_WORK_ERROR'(status){
            if(status) this.netWorkError=true,this.$refs.MiddleLive.handleCloseLoading();
        }
    },
    methods: {},
    created() {
    },
}
</script>

<style lang='less' scoped>
    .container{
        overflow: hidden;
        .nav-component{
            padding: 0 12px;
            height: 50px;
            line-height: 50px;
            background-color: #202124;
        }
        .row-two{
            height: calc(100vh - 50px);
            .el-col{
                height: 100%;
            }
            .content-left-component{
                height: 100%;
                background-color: #202124;
                border-top: 1px solid #000;
            }
            .content-middle-component{
                height: 100%;
                background-color: #000;
            }
            .content-right-component{
                height: 100%;
                background-color: #181a1f;
            }
        }
    }

    .error-box{
        width: 100vw;
        height: 100vh;
        .err-top{
            height: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #409eff;
            color: #fff;
            font-size: 25px;
            i{
                margin-right: 10px;
                font-size: 45px;
            }
        }
        .err-bottom{
            height: 60%;
            padding-top: 80px;
            div:nth-child(1){
                font-size: 25px;
                letter-spacing: 3px;
                color: #f40;
            }
            div:nth-child(2){
                margin-top: 10px;
                color: gray;
                font-size: 12px;
            }
        }
    }
</style>