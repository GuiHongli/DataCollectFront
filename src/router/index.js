import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
    ],
  },
  {
    path: '/region',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Region',
        component: () => import('@/views/region/index.vue'),
        meta: { title: '地域管理', icon: 'Location' },
      },
    ],
  },
  {
    path: '/network-type',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'NetworkType',
        component: () => import('@/views/network-type/index.vue'),
        meta: { title: '网络类型管理', icon: 'Connection' },
      },
    ],
  },
  {
    path: '/executor',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Executor',
        component: () => import('@/views/executor/index.vue'),
        meta: { title: '执行机管理', icon: 'Monitor' },
      },
    ],
  },
  {
    path: '/ue',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Ue',
        component: () => import('@/views/ue/index.vue'),
        meta: { title: 'UE管理', icon: 'Mobile' },
      },
    ],
  },
  {
    path: '/logic-environment',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'LogicEnvironment',
        component: () => import('@/views/logic-environment/index.vue'),
        meta: { title: '逻辑环境管理', icon: 'Setting' },
      },
    ],
  },
  {
    path: '/test-case-set',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'TestCaseSet',
        component: () => import('@/views/test-case-set/index.vue'),
        meta: { title: '用例集管理', icon: 'Document' },
      },
      {
        path: 'detail/:id',
        name: 'TestCaseSetDetail',
        component: () => import('@/views/test-case-set/detail.vue'),
        meta: { title: '用例集详情', icon: 'Document' },
        hidden: true,
      },
    ],
  },
  {
    path: '/collect-strategy',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'CollectStrategy',
        component: () => import('@/views/collect-strategy/index.vue'),
        meta: { title: '采集策略管理', icon: 'Operation' },
      },
    ],
  },
  {
    path: '/collect-task',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'CollectTask',
        component: () => import('@/views/collect-task/index.vue'),
        meta: { title: '采集任务管理', icon: 'List' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
