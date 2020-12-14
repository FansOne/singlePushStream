import { sendCode } from '../api/liveStatus/index'
import $store from '../store/index'

/**
 * @description 轮询发送当前登录教师code，进行直播状态及权限控制
 * @param {Object} params 请求数据 
 * @param {Number} delay 轮询间隔时间
 */
export const pollingCode =  function(params, delay = 1000) {
    return new Promise((resolve, reject) => {
        sendCode(params).then(res =>{
            if(res === null){
                $store.commit('SET_OPERATING_SWITCH',true)
                $store.commit('SET_LIVING',3)
            }else if(typeof res === 'string'){

                $store.commit('SET_LIVING',1)

                if(res === $store.state.CODE) $store.commit('SET_OPERATING_SWITCH',true);
                else $store.commit('SET_OPERATING_SWITCH',false);
            }
            
            setTimeout(() => {
                resolve(pollingCode(params, delay));
            }, delay)
        })

    })
}

/*函数节流*/
export const throttle = function(fn, interval) {
    var enterTime = 0; //触发的时间
    var gapTime = interval || 1000; //间隔时间
    return function () {
      var context = this;
      var backTime = new Date();
      if (backTime - enterTime > gapTime) {
        fn.call(context, arguments);
        enterTime = backTime;
      }
    };
  }