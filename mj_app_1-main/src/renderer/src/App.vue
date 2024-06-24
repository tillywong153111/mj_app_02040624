<template>
  <router-view></router-view>
</template>

<script setup>
import { ipc } from '@renderer/utils'
import { useRouter } from 'vue-router'
const router = useRouter()

ipc.on('back-home', () => {
  window.localStorage.clear()
  router.replace({
    path: '/index'
  })
})
</script>

<style lang="less">
@import '@renderer/assets/css/styles.less';
body,
html {
  margin: 0;
  padding: 0;
}
#app {
  overflow: hidden;
}
</style>
