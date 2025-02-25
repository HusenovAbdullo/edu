import { createRouter, createWebHistory } from 'vue-router'
import TestPageVue from '@/components/TestPage.vue'
import AdminPageVue from '@/components/AdminPage.vue'

const routes = [
  { path: '/', component: TestPageVue },
  { path: '/admin', component: AdminPageVue }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
