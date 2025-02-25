import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Vue Routerni import qilamiz

const app = createApp(App)
app.use(router) // Routerni Vue ilovasiga qo‘shamiz
app.mount('#app')
