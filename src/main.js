import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from "axios";
import store from './store'
import $ from 'jquery'
import 'lib-flexible'
import 'normalize.css/normalize.css'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './utils/moment'


// TIC相关
import TRTC from "trtc-js-sdk";
import TIM from 'tim-js-sdk';
import COS from "cos-js-sdk-v5";

// iconfont
import './assets/css/iconfont.css';
import './assets/css/iconfont/iconfont.ttf';
import './assets/css/iconfont/iconfont.eot';
import './assets/css/iconfont/iconfont.svg';
import './assets/css/iconfont/iconfont.woff';

//预览
import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'


Vue.config.productionTip = false

window.axios = axios

window.TRTC = TRTC
window.TIM = TIM
window.COS = COS

Vue.use(ElementUI);
Vue.use(Viewer);

new Vue({
  router,
  store,
  $,
  render: h => h(App)
}).$mount('#app')
