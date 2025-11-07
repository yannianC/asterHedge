import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Log from '../views/Log.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/log',
    name: 'Log',
    component: Log
  }
]

const router = createRouter({
  history: createWebHashHistory('/asterHedge/'),
  routes
})

export default router

