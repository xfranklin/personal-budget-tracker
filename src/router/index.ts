import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import RecordsView from '@/views/RecordsView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import DataTransferView from '@/views/DataTransferView.vue'
import { useBudgetStore } from '@/store/budget'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/records',
    name: 'records',
    component: RecordsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoriesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/data-transfer',
    name: 'data-transfer',
    component: DataTransferView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  // Wildcard fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('auth_token')
  const isAuthenticated = !!token

  if (!isAuthenticated) {
    const budgetStore = useBudgetStore()
    budgetStore.setTransactions([])
    budgetStore.setCategories([])
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
