import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
    // 登录code
    CODE:'',
    // 全局限制操作开关
    OPERATING_SWITCH: false, //通过轮询接口获取到该值
    // 用户信息
    USER:{
        USER_ID: '', //昵称
        ROOM_ID: '',
        MEMBER_ID:'', //用户ID
        GROUP_NUM:'',
        SHUT_UP_ALL_MEMBER:'',  // 群全员禁言状态
        TITLE:'',
        IDENTITY:'', //身份
    },
    //IM SDK是否Ready状态
    IM_IS_READY:false, 

    //已成功加入房间
    JOIN_ROOM_SUCCESS:false,

    //群组(房间)信息
    GROUP_INFO:null,

    // 直播状态 1:直播中 3:未开始
    LIVING:3,

    // 开始直播时间戳
    LIVE_START_TIME:0,

    //直播模式选项 0 摄像头 1 课件 2屏幕分享
    LIVE_MODE_INDEX:0,

    // 群组消息
    GROUP_MSG:[],

    // 分享屏幕中
    IS_SHARE_SCREENING:false,

    // 是否有课件展示
    HAVE_COURSEWARE:false,

    // 是否为PPT类型文件
    IS_PPT_FILE:false,

    //服务器响应状态
    NET_WORK_ERROR:false,

    // 当前查看的课件
    CURRENT_SEE_FILE:[],
    
    //课件当前页索引
    CURRENT_SEE_FILE_IDX:0
};

const mutations = {
    SET_CODE(state,options){
        state.CODE = options
    },
    SET_USER_INFO(state,options){
        if(options.userId) state.USER.USER_ID = options.userId
        if(options.roomId) state.USER.ROOM_ID = options.roomId
        if(options.memberId) state.USER.MEMBER_ID = options.memberId
        if(options.groupNum) state.USER.GROUP_NUM = options.groupNum
        if(options.shutUpAllMember) state.USER.SHUT_UP_ALL_MEMBER = options.shutUpAllMember
        if(options.title) state.USER.TITLE = options.title
        if(options.identity) state.USER.IDENTITY = options.identity
    },
    SET_IM_IS_READY(state,options){
        state.IM_IS_READY = options
    },
    SET_JOIN_ROOM_SUCCESS(state,options){
        state.JOIN_ROOM_SUCCESS = options
    },
    SET_GROUP_INFO(state,options){
        state.GROUP_INFO = options
    },
    SET_LIVING(state,options){
        state.LIVING = options
    },
    SET_LIVE_MODE_INDEX(state, options) {
        state.LIVE_MODE_INDEX = options
    },
    SET_GROUP_MSG(state, options) {
        state.GROUP_MSG = options
    },
    SET_IS_SHARE_SCREENING(state, options) {
        state.IS_SHARE_SCREENING = options
    },
    SET_HAVE_COURSEWARE(state, options) {
        state.HAVE_COURSEWARE = options
    },
    SET_IS_PPT_FILE(state, options) {
        state.IS_PPT_FILE = options
    },
    SET_NET_WORK_ERROR(state, options) {
        state.NET_WORK_ERROR = options
    },
    SET_LIVE_START_TIME(state, options) {
        state.LIVE_START_TIME = options
    },
    SET_CURRENT_SEE_FILE(state, options) {
        state.CURRENT_SEE_FILE = options
    },
    SET_CURRENT_SEE_FILE_IDX(state, options) {
        state.CURRENT_SEE_FILE_IDX = options
    },
    SET_OPERATING_SWITCH(state, options) {
        state.OPERATING_SWITCH = options
    },
};

const actions = {
    syncUpdateGroupMsg(context,options){
        let groupMsgArr = context.state.GROUP_MSG;
        groupMsgArr.push(options)

        context.commit('SET_GROUP_MSG',groupMsgArr)
    }
}

export default new Vuex.Store({
    state,
    mutations,
    actions
})