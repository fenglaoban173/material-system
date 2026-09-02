import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '数据概览',
          icon: 'icon-dashboard',
        },
      },
      {
        path: '/material-demand',
        name: 'MaterialDemand',
        redirect: '/material-demand/requirement',
        meta: {
          title: '素材需求',
          icon: 'icon-file',
        },
        children: [
          {
            path: '/material-demand/requirement',
            name: 'Requirement',
            component: () => import('@/views/material-demand/requirement/index.vue'),
            meta: {
              title: '需求管理',
              icon: 'icon-list',
            },
          },
          {
            path: '/material-demand/video-assign',
            name: 'VideoAssign',
            component: () => import('@/views/material-demand/video-assign/index.vue'),
            meta: {
              title: '视频分配报表',
              icon: 'icon-video-camera',
            },
          },
          {
            path: '/material-demand/upload',
            name: 'MaterialUpload',
            component: () => import('@/views/material/upload/index.vue'),
            meta: {
              title: '素材上传',
              icon: 'icon-upload',
              hideInMenu: true,
            },
          },
        ],
      },
      {
        path: '/material-lib',
        name: 'MaterialLib',
        redirect: '/material-lib/list',
        meta: {
          title: '素材库',
          icon: 'icon-file',
        },
        children: [
          {
            path: '/material-lib/list',
            name: 'MaterialList',
            component: () => import('@/views/material-lib/index.vue'),
            meta: {
              title: '素材列表',
              icon: 'icon-list',
            },
          },
          {
            path: '/material-lib/pretest',
            name: 'MaterialPretest',
            component: () => import('@/views/material-lib/pretest/index.vue'),
            meta: {
              title: '素材前测任务',
              icon: 'icon-check-circle',
              hideInMenu: true,
            },
          },
          {
            path: '/material-lib/audit',
            name: 'MaterialAudit',
            component: () => import('@/views/material-lib/audit/index.vue'),
            meta: {
              title: '素材审核',
              icon: 'icon-check-square',
            },
          },
          {
            path: '/material-demand/push-task',
            name: 'PushTask',
            component: () => import('@/views/material-demand/push-task/index.vue'),
            meta: {
              title: '素材推送任务',
              icon: 'icon-upload',
            },
          },
        ],
      },
      {
        path: '/creative-center',
        name: 'CreativeCenter',
        redirect: '/creative-center/image-generate',
        meta: {
          title: '创意中心',
          icon: 'icon-apps',
        },
        children: [
          {
            path: '/creative-center/image-generate',
            name: 'ImageGenerate',
            component: () => import('@/views/creative-center/image-generate/index.vue'),
            meta: {
              title: '图片生成',
              icon: 'icon-image',
            },
          },
          {
            path: '/creative-center/video-generate',
            name: 'VideoGenerate',
            component: () => import('@/views/creative-center/video-generate/index.vue'),
            meta: {
              title: '视频生成',
              icon: 'icon-video-camera',
            },
          },
        ],
      },
      {
        path: '/report',
        name: 'Report',
        redirect: '/report/violation-score',
        meta: {
          title: '报表管理',
          icon: 'icon-storage',
        },
        children: [
          {
            path: '/report/violation-score',
            name: 'ViolationScore',
            component: () => import('@/views/report/violation-score/index.vue'),
            meta: {
              title: '违规积分明细',
              icon: 'icon-warning',
            },
          },
          {
            path: '/report/employee-work-hours',
            name: 'EmployeeWorkHours',
            component: () => import('@/views/report/employee-work-hours/index.vue'),
            meta: {
              title: '员工工时报表',
              icon: 'icon-clock-circle',
            },
          },
        ],
      },
      {
        path: '/settings',
        name: 'Settings',
        redirect: '/settings/work-hours',
        meta: {
          title: '设置',
          icon: 'icon-settings',
        },
        children: [
          {
            path: '/settings/work-hours',
            name: 'SettingsWorkHours',
            component: () => import('@/views/settings/work-hours/index.vue'),
            meta: {
              title: '工时设置',
              icon: 'icon-clock-circle',
            },
          },
          {
            path: '/settings/personal',
            name: 'SettingsPersonal',
            component: () => import('@/views/settings/index.vue'),
            meta: {
              title: '个人设置',
              icon: 'icon-user',
            },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/index.vue'),
    meta: {
      title: '站内信',
      icon: 'icon-notification',
      hideInMenu: true,
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation Guard
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!userStore.token) {
    next('/login')
    return
  }

  next()
})

export default router