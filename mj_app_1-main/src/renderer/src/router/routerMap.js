/**
 * 基础路由
 * @type { *[] }
 */

const constantRouterMap = [
  {
    path: '/',
    name: 'Home',
    redirect: { name: 'Index' },
    children: [
      {
        path: '/index',
        name: 'Index',
        component: () => import('@renderer/views/index.vue')
      },
      {
        path: '/main',
        name: 'Main',
        component: () => import('@renderer/views/main.vue')
      },
    ]
  }
]

export default constantRouterMap
