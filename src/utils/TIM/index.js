import TIM from 'tim-js-sdk';
import { Message } from 'element-ui';
import $store from '../../store/index'

// 获取群详细资料
export const getGroupProfile = function (callback) { 
    let promise = window.timInit.getGroupProfile({ groupID: $store.state.USER.ROOM_ID })
    promise.then(function(imResponse) {
        // console.log(imResponse.data.group);
        callback(imResponse.data.group)
    }).catch(function(imError) {
        console.warn('getGroupProfile error:', imError); // 获取群详细资料失败的相关信息
    });
}

// 获取群成员资料
export const getGroupMemberProfile = function (userIDList,callback){
    let promise = window.timInit.getGroupMemberProfile({
        groupID: $store.state.USER.ROOM_ID,
        userIDList:userIDList,
    });

    promise.then(function(imResponse) {
        callback(imResponse.data.memberList); // 群成员列表
    }).catch(function(imError) {
        console.warn('getGroupMemberProfile error:', imError);
    });
}
//获取群成员列表
export const getGroupMemberList  = function getGroupMemberList(callback){
    let promise = window.timInit.getGroupMemberList({ groupID: $store.state.USER.ROOM_ID, count: 30, offset:0 }); // 从0开始拉取30个群成员
    promise.then(function(imResponse) {
    //   console.log(imResponse.data.memberList); // 群成员列表
      callback(imResponse.data.memberList)
    }).catch(function(imError) {
      console.warn('getGroupMemberList error:', imError);
    });
}

// IM监听事件 事件列表 https://imsdk-1252463788.file.myqcloud.com/IM_DOC/Web/module-EVENT.html
export const addTIMEventListener = function (self) {

    // SDK 进入 ready 状态
    window.timInit.on(window.TIM.EVENT.SDK_READY, function imReadyHandler(){
        // tim 已经准备好了
        $store.commit('SET_IM_IS_READY',true)
    });

    // SDK 收到推送的单聊、群聊、群提示、群系统通知的新消息
    window.timInit.on(window.TIM.EVENT.MESSAGE_RECEIVED, function onMessageReceived(event){
        // 接收到学生进入房间通知
        if(event.data[0].payload.description === "joinLive" &&  $store.state.LIVING == 1){
            sendCustomMessage('group',{
                toUserId: event.data[0].from,
                liveMode: String($store.state.LIVE_MODE_INDEX),
                haveCourseware:  $store.state.HAVE_COURSEWARE,
                currentFileIdx: $store.state.LIVE_MODE_INDEX === 1 ? $store.state.CURRENT_SEE_FILE_IDX : '',
                taskId: $store.state.CURRENT_SEE_FILE[0].taskId,
                description: 'updateLiveMode'
            }) 
        }

        // 接收到群组文本消息/开播/关播
        if(event.data[0].payload.text || event.data[0].payload.description === "liveMode" || event.data[0].payload.description === "liveEnd" ){
            if(event.data[0].payload.text){
                let fromUserId = event.data[0].nick || event.data[0].from;
                let msg = JSON.parse(event.data[0].payload.text)
                _showMessageInBox(fromUserId, msg,'text')
            }else{
                if(event.data[0].payload.description === "liveMode"){
                    // $store.commit('SET_LIVING',1)
                }else if(event.data[0].payload.description === "liveEnd"){
                    // $store.commit('SET_LIVING',3)
                }
            }
        }
        
        // 收到群提示消息
        if(event.data[0].type === TIM.TYPES.MSG_GRP_TIP){
            let operationType = event.data[0].payload.operationType;
            //处理加群操作--有成员加群
            if(operationType === TIM.TYPES.GRP_TIP_MBR_JOIN){

                // 更新群组人数
                let currentNum = Number($store.state.USER.GROUP_NUM) + 1;
                $store.commit('SET_USER_INFO',{ groupNum: currentNum })

                // 发送群组自定义消息
                let { userIDList } = event.data[0].payload;
                sendCustomMessage('group',{
                    toUserId: userIDList[0],
                    currentNum: currentNum,
                    description: 'updateLiveNum'
                })
            }
            //处理退群操作--有群成员退群
            else if(operationType === TIM.TYPES.GRP_TIP_MBR_QUIT){
                let currentNum = Number($store.state.USER.GROUP_NUM) - 1;
                $store.commit('SET_USER_INFO',{ groupNum: currentNum})

                // 发送群组自定义消息
                let { userIDList } = event.data[0].payload;
                sendCustomMessage('group',{
                    toUserId: userIDList[0],
                    currentNum: currentNum,
                    description: 'updateLiveNum'
                })
            }
        }
        
        // showMessageInBox(fromUserId, text);
        // // 接收处理图片消息
        // if (msg.payload.imageInfoArray[0].imageUrl) {
        //     showMessageInBox(
        //         msg.from,
        //         msg.payload.imageInfoArray[0].imageUrl,
        //         "img"
        //     );
        // }
    });

    // SDK 群组列表更新时触发
    window.timInit.on(window.TIM.EVENT.GROUP_LIST_UPDATED, function onGroupListUpdated(event){
        console.log(event.data);
    });

    // 用户被踢下线时触发
    window.timInit.on(window.TIM.EVENT.KICKED_OUT, function onKickedOut(event){
        console.log(event.data.type);
        self.$confirm('系统检测到您的帐号在其他设备登录，您已被T下线，当前无法进行任何操作！', '下线通知', {
            showConfirmButton:false,
            showCancelButton:false,
            closeOnClickModal:false,
            closeOnPressEscape:false,
            closeOnHashChange:false,
            showClose:false,
            type: 'error'
        })
    });
}


// 群组禁言/解除禁言
export const groupEstoppel = function(behavior, callbck) {
    // 1.调用 getGroupProfile 接口查看所在群组类型，确认是否支持禁言/取消禁言操作。
    let getGroupProfile =  window.timInit.getGroupProfile({
        groupID: $store.state.USER.ROOM_ID,
        groupCustomFieldFilter: []
    });
    getGroupProfile.then(imResponse => {
        let groupData = imResponse.data.group;
        if (groupData.type != 'Private' && groupData.type != 'Work') {
            // 2.调用 getGroupMemberProfile 接口查看指定的 userID 在当前群的成员角色，确认是否有权限进行禁言/取消禁言操作。
            let userGroup = [$store.state.USER.MEMBER_ID];

            _checkIdentity(userGroup, userInfo => {
                let ordinaryDentity = window.TIM.TYPES.GRP_MBR_ROLE_MEMBER; //普通身份
                if (userInfo[0].role === ordinaryDentity) {
                    Message.warning('抱歉 您无权进行此操作！仅群主或管理员可进行禁言控制！')
                } else {
                    _speechControlApi(behavior, callbck)
                }
            })

        } else {
            Message.warning('抱歉该群组暂不支持禁言操作')
        }
    }).catch((imError) => {
        this.errPrompt(imError)
    });
}

const _checkIdentity = function(userID, callbck){
    let promise = window.timInit.getGroupMemberProfile({
        groupID: $store.state.USER.ROOM_ID,
        userIDList: [...userID],
        memberCustomFieldFilter: [],
    });
    promise.then(function (imResponse) {
        callbck(imResponse.data.memberList);
    }).catch(function (imError) {
        console.warn('查看指定的 userID 在当前群的成员角色 error:', imError);
    });
}

const _speechControlApi = function(muteAllMembers, callbck) {
    let promise = window.timInit.updateGroupProfile({
        groupID: $store.state.USER.ROOM_ID,
        muteAllMembers: muteAllMembers, // true 全体禁言，false 取消全体禁言
    });
    promise.then((imResponse) => {
        console.log(imResponse.data.group) // 修改成功后的群组详细资料
        // 禁言/取消禁言成功后创建自定义消息实例并发送通知给其他群成员
        _HinweisOtherMitglied(muteAllMembers, callbck)

    }).catch(function (imError) {
        console.warn('禁言失败 error:', imError); // 修改群组资料失败的相关信息
    });
}

/**
 * 创建自定义消息并发送（全体/单人禁言相关）
 * muteAllMembers : true 禁言 false 取消禁言
 * SingleEstoppel:是否单人禁言 true单人
 * estoppelStudentID：被单独禁言的用户id
 */
const _HinweisOtherMitglied = function(muteAllMembers, callbck,SingleEstoppel=false,estoppelStudentID) {
    let options = {
        to: $store.state.USER.ROOM_ID,
        conversationType: window.TIM.TYPES.CONV_GROUP, //群组会话
        payload: {
            data: String(muteAllMembers), // true禁言 false取消禁言
            description:'speakControl'
        }
    };
    let message = window.timInit.createCustomMessage(options)

    let sendMsg = window.timInit.sendMessage(message);
    sendMsg.then((imResponse) => {
        // 发送成功
        // console.log(imResponse);
        if(!SingleEstoppel){
            let promptText = muteAllMembers ? '全体禁言中' : '已解除禁言'
            Message.success(promptText)
        }
        callbck()
    }).catch(function (imError) {
        // 发送失败
        console.warn('sendMessage error:', imError);
    });
}

/**
 * 消息发送接口
*/

// 发送群组文本消息

export const sendGroupTextMessage = function (msgObj,callback){
    let tim =  window.timInit;
    
    // 1. 创建群组文本消息
    let message = tim.createTextMessage({
        to: String($store.state.USER.ROOM_ID),
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
            text: JSON.stringify(msgObj)
        }
    })

    // 2. 发送消息
    let promise = tim.sendMessage(message);
    promise.then(function() {
        // 发送成功
        _showMessageInBox($store.state.USER.USER_ID, msgObj,'text')
        callback && callback()
    }).catch(function(imError) {
        // 发送失败
        console.warn('群组文本消息发送失败:', imError);
        if(imError.code === 10017){
            Message.error('禁言中，无法发送消息');
        }
    });
}

// 创建群组图片消息并发送
export const sendImgMsg = function(file,callbck) {
    // 1. 创建消息实例，接口返回的实例可以上屏
    let message = window.timInit.createImageMessage({
        to: String($store.state.USER.ROOM_ID),
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
            file: file
        },
        onProgress: function (event) {
            console.log('file uploading:', event)
        }
    });

    // 2. 发送消息
    let promise = window.timInit.sendMessage(message);
    promise.then(function (imResponse) {
        // 发送成功
        console.log(imResponse);
        let locUrl = URL.createObjectURL(file);
        _showMessageInBox($store.state.USER.USER_ID, locUrl, "img");
        callbck()
    }).catch(function (imError) {
        // 发送失败
        console.warn('sendMessage error:', imError);
    });
}

// 发送自定义消息

export const sendCustomMessage = function(type,options,callback){
    let tim =  window.timInit;
    let message = tim.createCustomMessage({
        to: type==='group' ? String($store.state.USER.ROOM_ID) : options.toUserId,
        conversationType: type==='group' ? TIM.TYPES.CONV_GROUP : TIM.TYPES.CONV_C2C,
        
        payload: {
            data: JSON.stringify(options.type!=undefined?options.type:options),
            description: options.description
        }
    });

    // 发送消息
    let promise = tim.sendMessage(message);
    promise.then(function(imResponse) {
        // 发送成功
        callback && callback(imResponse);
    }).catch(function(imError) {
        // 发送失败
        console.warn('sendCustomMessage error:', imError);
    });
}

const _showMessageInBox = function (fromUserId, text,type,timeStamp = undefined) {
    
    let d = timeStamp === undefined?new Date():new Date(timeStamp*1000);
    let time = `${('0' + d.getHours()).substr(-2)}:${('0' + d.getMinutes()).substr(-2)}:${('0' + d.getSeconds()).substr(-2)}`
    
    let params = {
        time: time,
        send: fromUserId,
        content: type === 'img'?text:text.message,
        type:text.type //0 消息 1问答
    }

    if(type && type === 'img') params.img = text;

    if(text.qs) params.qs = text.qs;

    $store.dispatch('syncUpdateGroupMsg', params) 
}

/**
 * 
 * @param {Object} options {
 *   type: 0 初始拉取消息列表 1 分页拉取指定会话的消息列表
 * }    
 * @param {Function} callback
 */
export const getMessageList = function(options,callback){
    let tim =  window.timInit;

    // 打开某个会话时，第一次拉取消息列表
    let params = {
        conversationID: `GROUP${$store.state.USER.ROOM_ID}`,
        count: 15
    };
    //分页拉取指定会话的消息列表
    if(options.type === 1) params.nextReqMessageID = options.conversationID

    let promise = tim.getMessageList(params);
    promise.then(async function(imResponse) {
        const filterMessageList = [];
        const messageList = imResponse.data.messageList; // 消息列表(包含自定义消息 需过滤)。
        const nextReqMessageID = imResponse.data.nextReqMessageID; // 用于续拉，分页续拉时需传入该字段。
        const isCompleted = imResponse.data.isCompleted; // 表示是否已经拉完所有消息。

        await messageList.forEach(element => {
            if(element.type === TIM.TYPES.MSG_TEXT || element.type === TIM.TYPES.MSG_IMAGE){
                filterMessageList.push(element)
            }
        });

        // 将拉取到的初始消息列表插入到GROUP_MSG中
        await _saveChatMsg(filterMessageList)

        callback(filterMessageList,nextReqMessageID,isCompleted)
    });
}

// 将拉取到的初始消息列表插入到GROUP_MSG中
const _saveChatMsg = function(options){
    let previousNews =  options
    // console.log(previousNews)
    previousNews.forEach(element => {
        if(element.type === TIM.TYPES.MSG_TEXT){
            let fromUserId = element.nick || element.from;
            let msg = JSON.parse(element.payload.text)
            _showMessageInBox(fromUserId, msg,'text',element.time)
        }else if(element.type === TIM.TYPES.MSG_IMAGE){
            _showMessageInBox($store.state.USER.USER_ID, element.payload.imageInfoArray[0].imageUrl, "img",element.time);
        }
    });
}


// 发布群公告(修改群资料)
export const releaseGroupNotice = function(introduction,callback){
    let promise = window.timInit.updateGroupProfile({
        groupID: $store.state.USER.ROOM_ID,
        notification: introduction,
      });
      promise.then(function(imResponse) {
        callback(imResponse.data.group)
      }).catch(function(imError) {
        debugger
        console.warn('updateGroupProfile error:', imError);
        Message.warning('抱歉 您无权进行此操作！仅管理员或群主可编辑群公告！')
      });
}

// 退出群组
export const quitLiveGroup = function (groupID) {
    let promise = window.timInit.quitGroup(String(groupID));
    promise.then(function(imResponse) {
        // console.log(imResponse.data.groupID); // 退出成功的群 ID
    }).catch(function(imError){
        console.warn('quitGroup error:', imError); // 退出群组失败的相关信息
    });
}
