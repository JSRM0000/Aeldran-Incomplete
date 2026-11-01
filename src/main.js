import { createApp } from 'vue'
import App from './App.vue'
import { installTip } from './directives/tip.js'
import './styles/tokens.css'
import './styles/base.css'
import './styles/controls.css'
import './styles/settings.css'
import './styles/create.css'

installTip()
createApp(App).mount('#app')
