<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import { quitLiveGroup } from './utils/TIM/index'
export default {
    name: "App",
    created() {

        if (sessionStorage.getItem("store")) {
            this.$store.replaceState(Object.assign({},this.$store.state,JSON.parse(sessionStorage.getItem("store"))));
        }

        window.addEventListener("beforeunload", () => {
            // 将im sdk初始未ready状态
            this.$store.commit('SET_IM_IS_READY',false)

            this.$store.commit('SET_JOIN_ROOM_SUCCESS',false)

            this.$store.commit('SET_IS_PPT_FILE',false)

            this.$store.commit('SET_IS_SHARE_SCREENING',false)

            this.$store.commit('SET_GROUP_MSG',[])

            this.$store.commit('SET_NET_WORK_ERROR',false)

            // 初始化左侧tab
            this.$store.commit('SET_LIVE_MODE_INDEX',0)
            
            sessionStorage.setItem("store", JSON.stringify(this.$store.state));

            quitLiveGroup(this.$store.state.USER.ROOM_ID)
        });

    }
};
</script>

<style lang='less'>

#app {
  font-size: 14px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

div{
    box-sizing: border-box;
}

.el-button--primary{
    background-color: #2460F2 !important;
    border-color: #2460F2 !important;
}

.check-media-dialog{
    .el-dialog__header{
        padding: 0 !important;
    }
    .el-dialog__body{
        padding: 0 !important;
        .el-step{
            background-color: #ECF1FE;
            padding:30px 30px 10px 30px;
        }
        .step-content{
            padding: 10px 0 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            .content-item{
                display: flex;
                flex-direction: column;
                align-items: center;
                .title{
                    font-weight: bold;
                    font-size: 13px;
                }
                .select-box{
                    display: flex;
                    align-items: center;
                    margin-top: 25px;
                    .select-title{
                        margin-right: 7px;
                        font-size: 13px;
                    }
                    .el-input__inner{
                        border-radius: 0 !important;
                    }
                }
                .live-viewport{
                    margin-top: 20px;
                    margin-bottom: 10px;
                    width: 230px;
                    height: 160px;
                    transform: translateX(4px);
                    background-color: #000;
                }
                .spectrum {
                    margin-top: 30px;
                    transform: translateX(4px);
                    .spectrum-item {
                        span {
                        display: inline-block;
                        width: 13px;
                        height: 40px;
                        border-radius: 10px;
                        margin-right: 10px;
                        background-color: #cacaca;
                        }
                    }
                }
            }
        }
    }
    .el-button{
        width: 123px;
    }
}

.jump-tips-dialog{
    border-radius: 7px !important;
    .el-dialog__header{
        padding: 0;
    }
    .el-dialog__body{
        display: flex;
        flex-direction: column;
        align-items: center;
        i{
            color: #2460F2;
            font-size: 60px;
        }
        .title{
            font-weight: bold;
            font-size: 18px;
        }
        .prompt{
            color: #000;
        }
    }
    .el-dialog__footer{
        display: flex;
        justify-content: center;
        .el-button--primary{
            margin-left: 25px !important;
        }
        .el-button--default{
            margin-left: 0 !important;
        }
    }
}

.create-isLoading{
    .el-loading-spinner{
        .circular{
            display: none;
        }
        background: url(./assets/img/vloading.gif) no-repeat;
        background-size: 135px 135px;
        width: 100%;
        height: 100%;
        position: relative;
        top: 40% !important;
        left: 45%;
    }
    .el-loading-spinner:after{
        content: '连接教室中...';
        color: #fff;
        position: absolute;
        left: 35px;
        top: 135px;
    }
}

.share-popover{
    display: flex;
    justify-content: center;
    align-items: center;
    img{
        width: 180px;
        height: 180px;
    }
}

.emoji-replay{
    .content-box{
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        .space-between{
            content: '';
            width: 30px;
        }
        .fast-replay{
            font-size: 20px;
            width: 30px;
            text-align: center;
        }
    }
    .fast-replay:hover{
        cursor: pointer;
        font-size: 25px;
    }
}

.quickly-replay{
    padding-left: 0 !important;
    padding-right: 0 !important;
    .fast-replay{
        padding: 2px 10px;
    }
    .fast-replay:hover{    
        background-color: #2460F2;
        color: #fff;
    }
}

.el-message-box__wrapper{
    top: 326px !important;
    bottom: initial !important;
}
</style>
