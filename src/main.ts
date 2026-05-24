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

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(
  createVuestic({
    config: {
      colors: {
        variables: {
          primary: '#154ec1',
          secondary: '#6c757d',
          success: '#00e5ff', // beautiful neon turquoise for positive balance / income
          info: '#00b0ff',
          danger: '#ff1744', // hot coral red for expenses
          warning: '#ffd600',
          backgroundPrimary: '#111216', // Sleek dark mode backplate
          backgroundSecondary: '#1b1d23', // Elevated cards backplate
          textPrimary: '#f8f9fa',
          textSecondary: '#a5b0c0',
        },
      },
    },
  }),
)

app.mount('#app')
