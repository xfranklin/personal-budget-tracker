import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuestic } from 'vuestic-ui'

// Vuestic UI styling imports
import 'vuestic-ui/styles/essential.css'
import 'vuestic-ui/styles/grid.css'
import 'vuestic-ui/styles/reset.css'

// Our custom SCSS layout
import './style.scss'
import App from './App.vue'
import router from './router'

const initialTheme = (localStorage.getItem('theme') || 'light') as 'light' | 'dark'
document.documentElement.setAttribute('data-theme', initialTheme)

const themeColors = {
  light: {
    primary: '#154ec1',
    secondary: '#6c757d',
    success: '#00e5ff',
    info: '#00b0ff',
    danger: '#ff1744',
    warning: '#ffd600',
    backgroundPrimary: '#f4f6f9',
    backgroundSecondary: '#ffffff',
    textPrimary: '#1b1d23',
    textSecondary: '#6c757d',
  },
  dark: {
    primary: '#154ec1',
    secondary: '#6c757d',
    success: '#00e5ff',
    info: '#00b0ff',
    danger: '#ff1744',
    warning: '#ffd600',
    backgroundPrimary: '#111216',
    backgroundSecondary: '#1b1d23',
    textPrimary: '#f8f9fa',
    textSecondary: '#a5b0c0',
  },
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(
  createVuestic({
    config: {
      colors: {
        variables: themeColors[initialTheme],
      },
    },
  }),
)

app.mount('#app')
