import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/board', name: 'board', component: () => import('@/views/BoardView.vue') },
    { path: '/board/new', name: 'board-create', component: () => import('@/views/PostCreateView.vue') },
    { path: '/board/:id', name: 'board-detail', component: () => import('@/views/PostDetailView.vue') },
    { path: '/board/:id/edit', name: 'board-edit', component: () => import('@/views/PostEditView.vue') },
    { path: '/regions', name: 'regions', component: () => import('@/views/RegionInfoView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
