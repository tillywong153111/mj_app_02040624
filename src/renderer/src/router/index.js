import { createRouter, createWebHashHistory } from 'vue-router'
import routerMap from './routerMap'

const Router = createRouter({
  history: createWebHashHistory(),
  routes: routerMap
})

Router.beforeEach((to, from, next) => {
  if (to.path == '/main') {
    next()
  } else {
    if (window.localStorage.getItem('__token__')) {
      next('/main')
    } else {
      next()
    }
  }
})

export default Router
