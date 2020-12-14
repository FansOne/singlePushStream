<template>
    <div class="container">
        <el-tabs type="border-card" :closable='closable' :class="{'tap-tabs':closable}" @tab-remove="removeTab">
            <el-tab-pane
                v-for="item in editableTabs"
                :key="item.type"
                :label="item.name"
                >
                <div class="content-box">
                    <div class="content-item" v-if="item.type==0">
                        <div class="content-content-item">
                            <span  class="iconfont icon-monitor"></span>  
                        </div>
                    </div>

                    <div class="content-item open-courseware-box" v-if="item.type==1 && !HAVE_COURSEWARE" @click="handlerSelectCourseware">
                        <div class="content-content-item">
                            <div class="open-courseware">
                                <i class="el-icon-plus"></i>
                                <div>打开课件</div>
                            </div>
                        </div>
                    </div>

                    <div class="content-item" v-if="item.type==2">
                        <div class="content-content-item">
                            <span class="iconfont icon-pingmugongxiangkai"></span>
                        </div>
                    </div>
                
                    <div class="all-file-list" v-if="closable && HAVE_COURSEWARE">
                        <div class="content-content-item">
                            <div v-for="(item,index) in currentExhibitionFile.boardInfoList" :key="index" @click="handleSwitchBoard(index)" class="item-box" :class="{'current-file-style':CURRENT_SEE_FILE_IDX === index}">
                                <el-image fit="scale-down" :src="item.url"/>
                                <div class="num">{{index+1}}/{{currentExhibitionFile.pageCount}}</div>
                            </div>
                        </div>
                    </div>

                    <div class="prompt-text"><img src="../../assets/img/logo-kaoshidian.png"/><div>西安考试点提供技术支持</div></div>
                </div>
            </el-tab-pane>
        </el-tabs>
        
        <!-- 课件选择弹窗 -->
        <el-dialog 
            custom-class='dialog-select-courseware'
            title="添加课件" 
            :visible.sync="dialogCoursewareVisible"
            width="30%"
            >

            <input
                style="display:none"
                ref="file_input"
                id="file_input"
                type="file"
                multiple
                accept="application/pdf, application/vnd.ms-powerpoint, .ppt, .pptx"
                @change="fileInfo()"
            >
            <!-- 上传课件 -->
            <div class="undate-file-box">
                <el-button type="primary" size="small" @click="handleUploadCourseware">上传课件<i class="el-icon-upload el-icon--right"></i></el-button>
                <el-button type="info" size="small" plain @click="handleRefreshList">刷新列表<i class="el-icon-refresh-right el-icon--right"></i></el-button>
            </div>
            <!-- 课件列表 -->
            <el-table :data="boardList" empty-text='暂无课件'>
                <el-table-column label="课件名称">
                    <template slot-scope="scope"> 
                        <span class="iconfont icon-class-style" :class="{'icon-ppt':scope.row.attachments[0].type.indexOf('powerpoint')!=-1,'icon-pdf':scope.row.attachments[0].type.indexOf('pdf')!=-1}" :style="{'color':scope.row.attachments[0].type.indexOf('pdf')!=-1?'#f56c6c':'#67c23a'}"></span>
                        <span style="margin-left: 10px">{{ scope.row.attachments[0].title.substring(0,scope.row.attachments[0].title.indexOf('.')) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="课件状态">
                    <template slot-scope="scope" class="file-status">
                        <!---<i class="el-icon-success"></i>
                        <span>完成</span>--->
                        <el-progress :percentage="scope.row.attachments[0].uploadProgress" :color="progressColors" :status="scope.row.attachments[0].uploadProgress?(scope.row.attachments[0].uploadProgress===100?'success':''):'exception'"></el-progress>
                    </template>
                </el-table-column>
                <el-table-column
                    label="操作"
                    width="150"
                    fixed="right"
                    >
                    <template slot-scope="scope">
                        <el-button @click="handleSelectCurrentFile(scope.row.attachments[0])" type="text" size="small">使用</el-button>
                        <el-button @click="handleDeleteFile(scope.row.attachments[0])" type="text" size="small">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

    </div>
</template>

<script>
import { mapState,mapMutations } from 'vuex'
import { uploadMinFile,removeFile } from '../../utils/cosFile/index'
import { createTranscode } from '../../api/upload/index'
import { Message } from 'element-ui';
import { coursewareList,queryTranscodeFile,deleteCourseData } from '../../api/courseware/index'
import { sendCustomMessage } from '../../utils/TIM/index'

export default {
    components: {},
    data() {
        return {
            closable:false,
            editableTabs:[
                { 
                    type:0,
                    name:'摄像头直播'
                }
            ],
            dialogCoursewareVisible:false,
            userSelectFile:null,
            fileTypes:'',
            fileName:'', 
            boardList: [],
            currentExhibitionFile:{},//底部展示文件
            progressColors:[
                {color: '#f56c6c', percentage: 20},
                {color: '#e6a23c', percentage: 40},
                {color: '#6f7ad3', percentage: 60},
                {color: '#1989fa', percentage: 80},
                {color: '#67c23a', percentage: 100}
            ],
            loading:true
        };
    },
    props:{
        liveMode:{
            type:Number,
            default:''
        }
    },

    computed:{
        ...mapState(['OPERATING_SWITCH','HAVE_COURSEWARE','BOARD_FILE_LIST','LIVING','USER','CURRENT_SEE_FILE','CURRENT_SEE_FILE_IDX'])
    },

    watch:{
        'BOARD_FILE_LIST'(arr){
            arr.forEach((element,index) => {
                if(element.fid === "#DEFAULT"){
                    arr.splice(index,1)
                    this.boardList = arr
                }
            });
        },
        'liveMode'(type){
            this.editableTabs = [{
                type:type,
                name:type===0?'摄像头直播':(type===1?'暂未选择课件':'屏幕共享中')
            }];
            if(type === 0) this.closable = false
        },
        'LIVING'(status){
            if(this.liveMode === 2)
            if(status != 1) this.editableTabs[0].name = '已停止屏幕共享';
            else this.editableTabs[0].name = '屏幕共享中';
        }
    },

    created(){
        
    },

    methods:{
        ...mapMutations(['SET_HAVE_COURSEWARE','SET_JOIN_ROOM_SUCCESS','SET_HAVE_COURSEWARE','SET_IS_PPT_FILE','SET_CURRENT_SEE_FILE','SET_CURRENT_SEE_FILE_IDX']),
        // 课件选择上传弹窗
        handlerSelectCourseware(){
            if(!this.OPERATING_SWITCH && this.LIVING == 1){
                this.$alert('当前直播间已有其他讲师在授课中，您无法进行此操作，如有疑问请联系平台管理员。', '操作限制', {
                    confirmButtonText: '知道了',
                    type: 'warning'
                });
            }else{
                this.dialogCoursewareVisible = true
                coursewareList({ roomId:this.USER.ROOM_ID }).then(res=>{
                    this.boardList =  res;
                })
            }
        },
        // 上传课件
        handleUploadCourseware(){
            this.$refs.file_input.value = null;
            this.$refs.file_input.click();
        },

        // 监听input change事件
        fileInfo() {
            let resultFile = this.$refs.file_input.files[0];
            // 如果文件存在
            if (resultFile) {
                this.userSelectFile = resultFile;
                // 获取文件名
                this.fileName = resultFile.name;
                if(this.fileName){
                    // 白板上传文件事件
                    this.uploadFiles(this.userSelectFile)
                }
            }
        },

        // 使用当前课件 根据taskId查询转码文件
        handleSelectCurrentFile(rowData){
            if(!rowData.taskId) return Message.warning('等待课件转码TASKID UNDEFINED')
            queryTranscodeFile({taskId:rowData.taskId}).then(res=>{

                let currentExhibitionFile = {
                    boardInfoList:[],
                    pageCount:''
                }
                currentExhibitionFile.pageCount = res.pages

                for (var i = 1; i <= Number(res.pages); i++) {
                    currentExhibitionFile.boardInfoList.push( {url:`${res.resultUrl}${i}.jpg`,currentShowFile:false,taskId:rowData.taskId} ) 
                }
                currentExhibitionFile.boardInfoList[0].currentShowFile = true //默认展示所打开课件的第一章
                this.currentExhibitionFile = currentExhibitionFile
                this.SET_CURRENT_SEE_FILE(currentExhibitionFile.boardInfoList)
                this.editableTabs[0].name = rowData.title
                this.dialogCoursewareVisible = false
                this.closable = true
                this.SET_HAVE_COURSEWARE(true)
                this.SET_IS_PPT_FILE(true)

                // 发送自定义消息通知学员端切换课件
                
                sendCustomMessage('group',{
                    index:1,
                    id:rowData.taskId,
                    description:'coursewareSwitch'
                })
            })
        },

        // 删除当前课件
        handleDeleteFile(rowData){
            if(!rowData.taskId) return Message.warning('等待课件转码TASKID UNDEFINED')

            this.$confirm("此操作将永久删除该文件, 是否继续?", `删除提示(${rowData.title})`, {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning"
            }).then(() => {
                // deleteCourseData
                let params = [rowData.taskId];

                deleteCourseData(params).then(res=>{
                    this.removeTab()
                    coursewareList({ roomId:this.USER.ROOM_ID }).then(res=>{
                        this.boardList = res;
                    })
                })
                
            });
        },

        // 上传文件到云存储
        uploadFiles(file){
            // /\.(bmp|jpg|jpeg|png|gif|webp|svg|psd|ai)/i.test(file.name)
            var currentFile = [{
                roomId:this.USER.ROOM_ID,
                id:new Date().getTime(),
                title:file.name,
                type:file.type,
                uploadProgress:0,
                locationUrl:'', //线上文件地址
                key:''
            }];

            this.boardList.push({ attachments: currentFile }) 

            uploadMinFile(file,(err, data) => {

                if (err) {
                    Message.error('上传失败，请刷新重试！')
                } else {

                    let str = data.Location;
                    let key = str.substring(str.indexOf('live/upload/'))
                    this.boardList.forEach(item =>{
                        if(item.attachments[0].id === currentFile[0].id)
                            item.attachments[0].locationUrl = data.Location,
                            item.attachments[0].key = key,

                            // 创建课件转码任务
                            createTranscode(item.attachments[0]).then(res=>{
                                // 获取课件列表
                                coursewareList({ roomId:this.USER.ROOM_ID }).then(res=>{
                                    this.boardList = res;
                                })
                            });
                        else
                            return
                    })
                }
            },progress =>{
                this.boardList.forEach( item =>{
                    if(item.attachments[0].id === currentFile[0].id)
                        item.attachments[0].uploadProgress = progress*100;
                    else
                        return
                })
            })
        },

        // 刷新列表
        handleRefreshList(){
            coursewareList({ roomId:this.USER.ROOM_ID }).then(res=>{
                this.boardList =  res;
            })
        },

        removeTab(){
            this.closable = false
            this.editableTabs = [{
                type:1,
                name:'暂未选择课件'
            }];
            this.currentExhibitionFile = {}
            this.SET_CURRENT_SEE_FILE([])
            this.SET_HAVE_COURSEWARE(false)
            this.SET_IS_PPT_FILE(false)
        },

        handleSwitchBoard(index){
            this.SET_CURRENT_SEE_FILE_IDX(index)
        }
    },
    beforeDestroy(){
        this.SET_JOIN_ROOM_SUCCESS(false)
    }
}
</script>

<style lang='less' scoped>
    .container{
        height: 100%;
        overflow: hidden;
        .content-box{
            display: flex;
            flex-direction: column;
            height: 100%;
            .content-item{
                flex: 1;
                padding-top: 7px;
                .content-content-item{
                    width: 128px;
                    height: 72px;
                    background-color: #2b2f38;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    span{
                        font-size: 33px;
                        color: #5c5c5c;
                    }
        
                    .icon-pingmugongxiangkai{
                        font-size: 30px;
                        color: rgba(255,255,255,.2);
                    }
                }
            }
            .open-courseware-box{
                cursor: pointer;
                .open-courseware{
                    height: 100%;
                    padding: 10px 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    color: rgba(255,255,255,.5);
                    i{
                        font-size: 25px;
                        color: rgba(255,255,255,.7);
                    }
                }
            }
            .all-file-list{
                padding-top: 0;
                flex: 1;
                .content-content-item{
                    min-width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    overflow-x: auto;
                    overflow-y: hidden;
                    .item-box{
                        margin-bottom: 5px;
                        flex-shrink: 0;
                        cursor: pointer;
                        width: 128px;
                        height: calc(100% - 5px);
                        position: relative;
                        margin-right: 20px;
                        /deep/ .el-image{
                            width: 100%;
                            height: 100%;
                        }
                        div{
                            position: absolute;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, .6);
                            padding: 2px 4px;
                        }
                    }
                    .current-file-style{
                        border: 2px solid #2460F2;
                    }
                }
            }
            ::-webkit-scrollbar {
                /*滚动条整体样式*/
                width: 10px;
                /*高宽分别对应横竖滚动条的尺寸*/
                height: 5px;
            }
            ::-webkit-scrollbar-thumb {
                /*滚动条里面小方块*/
                border-radius: 10px;
                background-color: rgb(98, 98, 98);
                // background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, .2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .2) 50%, rgba(255, 255, 255, .2) 75%, transparent 75%, transparent);
            }
            ::-webkit-scrollbar-track {
                /*滚动条里面轨道*/
                -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 1);
                background: #000;
            }
            .prompt-text{
                display: flex;
                align-items: center;
                justify-content: center;
                img{
                    height: 17px;
                }
                div{
                    text-align: center;
                    color: #666666;
                    font-size: 12px;
                    height: 23px;
                    line-height: 23px;
                }
            }
        }
    }

    /deep/.el-tabs--border-card{
        height: 100%;
        display: flex;
        flex-direction: column;
        border: none !important;
        background-color: #181a1f !important;
        .el-tabs__header .is-top{
            background-color: #2b2f38 !important;
        }
        .el-tabs__content{
            flex: 1;
            padding: 7px 0;
            .el-tab-pane{
                height: 100%;
            }
        }
        .el-tabs__nav .is-top{
            cursor: default;
            background-color: #181a1f !important;
            color: rgba(255, 255, 255, .6);
            margin-top: 0 !important;
        }
        .el-tabs__item,.is-active{
            border: none !important;
        }
        .el-tabs__header .el-tabs__item:not(.is-disabled):hover{
            color: rgba(255, 255, 255, .6) !important;
        }
    }

    /deep/.tap-tabs{
        .el-tabs__nav .is-top{
            cursor: pointer;
        }
        .el-tabs__header .el-tabs__item:not(.is-disabled):hover{
            color: #409EFF !important;
        }
    }

    /deep/.dialog-select-courseware{
        .el-dialog__header{
            text-align: left;
            font-weight: bold;
        }
        .el-dialog__body{
            .undate-file-box{
                display: flex;
                align-content: center;
                justify-content: flex-start;
                .el-button--primary{
                    margin-right: 10px;
                }
            }
            .el-table{
                border: 1px solid #E5E5E5;
                margin-top: 20px;
                .el-table__header-wrapper{
                    background-color: #F5F6F9;
                    th{
                        color: #000;
                        background-color: #F5F6F9;
                    }
                    
                }
                .is-leaf{
                    color: #000;
                    background-color: #F5F6F9;
                }
                td,th.is-leaf{
                    border-bottom: 0;
                }
                .el-table__fixed-right::before, .el-table__fixed::before{
                    display: none;
                }
                .el-table__row{
                    .el-table_2_column_5{
                        i{
                            display: inline-block;
                            margin-right: 5px;
                        }
                        span{
                            margin-left: 0 !important;
                        }
                    }
                }
            }
            .el-table::before{
                height: 0;
            }
        }
        .el-button--info.is-plain{
            background-color: #f4f4f5;
            color: #909399;
        }
        .el-button--info.is-plain:active,.el-button--info.is-plain:hover{
            background-color: #f4f4f5;
            color: #636363;
        }
    }
    .icon-class-style{
        font-size: 19px;
    }
</style>