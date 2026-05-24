import { computed } from 'vue'
import { useColors } from 'vuestic-ui'
import { useBudgetStore } from '@/store/budget'

export const themeColors = {
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

export function useTheme() {
  const { setColors } = useColors()
  const budgetStore = useBudgetStore()

  const initTheme = () => {
    const theme = budgetStore.theme
    document.documentElement.setAttribute('data-theme', theme)
    setColors(themeColors[theme])
  }

  const toggleTheme = () => {
    budgetStore.toggleTheme()
    const theme = budgetStore.theme
    setColors(themeColors[theme])
  }

  return {
    theme: computed(() => budgetStore.theme),
    initTheme,
    toggleTheme,
  }
}
export default useTheme
