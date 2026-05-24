<template>
  <div class="login-overlay">
    <va-button
      preset="secondary"
      :icon="theme === 'light' ? 'dark_mode' : 'light_mode'"
      color="textSecondary"
      class="theme-toggle-fixed"
      @click="toggleTheme"
    >
      {{ theme === 'light' ? 'Dark Mode' : 'Light Mode' }}
    </va-button>
    <div class="glass-panel login-card glowing-border">
      <div class="login-header">
        <div class="login-icon-wrapper">
          <va-icon name="lock" color="primary" size="large" class="pulse-animation" />
        </div>
        <h2>Private Access Portal</h2>
        <p>This Secure Budget Tracker requires password authorization.</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Portal Password</label>
          <va-input
            v-model="passwordInput"
            type="password"
            placeholder="••••••••••••"
            required
            outline
            class="w-full"
            :error="!!authError"
            :error-messages="authError"
          >
            <template #prependInner>
              <va-icon name="vpn_key" color="textSecondary" />
            </template>
          </va-input>
        </div>
        <va-button
          type="submit"
          color="primary"
          class="w-full submit-button"
          icon="vpn_key"
          :loading="isAuthenticating"
        >
          Unlock Dashboard
        </va-button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '@/types'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const passwordInput = ref('')
const authError = ref('')
const isAuthenticating = ref(false)

const { theme, toggleTheme, initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const handleLogin = async () => {
  if (!passwordInput.value) return
  isAuthenticating.value = true
  authError.value = ''

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value }),
    })
    const result = (await response.json()) as ApiResponse<{ token: string }>

    if (response.ok && result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token)
      passwordInput.value = ''
      router.push({ name: 'dashboard' })
    } else {
      authError.value = result.error || 'Access denied: Incorrect password.'
    }
  } catch {
    authError.value = 'Network error: Cannot reach authentication gateway.'
  } finally {
    isAuthenticating.value = false
  }
}
</script>

<style lang="scss" scoped>
.theme-toggle-fixed {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10000;
}

.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  backdrop-filter: blur(28px);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 32px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  color: var(--text-primary);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 16px 0 8px;
    color: var(--text-primary);
  }

  p {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }
}

.login-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px var(--glow-color);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: block;
}

.w-full {
  width: 100%;
}
</style>
