import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/play/live/:userType/:roomId/:code',
    name: 'index',
    component: () => import('../views/layout/index.vue')
  },
  {
    path: '*', 
    name: '404',
    component: () => import('../views/404.vue')
  },
  {
    path: '/deviceNothing', 
    name: 'deviceNothing',
    component: () => import('../views/deviceNothing.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: window.SITE_CONFIG['BASE_ROUTE'] || '',
  routes
})

export default router
