<template>
  <!-- <button @click="isFouces">自动账号密码登录</button> -->
  <iframe
    id="discordId"
    ref="iframeInstance"
    src="https://discord.com/channels/662267976984297473/981697648119648266"
    frameborder="0"
    sandbox="allow-scripts allow-same-origin allow-forms"
    @load="onIframeLoad"
  ></iframe>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue'
import { ipc } from '@renderer/utils'

const iframeInstance = ref(null)
const userName = window.localStorage.getItem('__user_name__')
const password = window.localStorage.getItem('__user_password__')
const time = ref(0)
let timer = null
// 这里做自动轮询

const onIframeLoad = () => {
  getDom()
  // test()
}

const getDom = () => {
  if (time.value === 100) {
    // 轮询100次无效立即解除
    return
  }
  const iframeWindow = iframeInstance.value.contentWindow.document
  console.log(iframeInstance.value.contentWindow.localStorage, '--------')
  if (!iframeWindow) {
    time.value++
    timer = setTimeout(() => {
      getDom()
    }, 100)
    return
  }
  const formInstance = iframeWindow.forms[0]
  const userNameInput = iframeWindow.getElementById('uid_5')
  const passwordInput = iframeWindow.getElementById('uid_7')
  const submitButton = iframeWindow.querySelector('button[type="submit"]')

  if (formInstance && userNameInput) {
    const isfocus = () => {
      console.log(iframeWindow.activeElement == userNameInput)
      if (iframeWindow.activeElement == userNameInput) {
        ipc.send('c-name-focus', userName)
        ipc.on('b-password-focus', () => {
          passwordInput.focus()
          ipc.send('c-password-focus', password)
        })
        //
        ipc.on('b-submit', () => {
          submitButton.click()
          window.localStorage.setItem('__is_login__', 1)
        })
      } else {
        ipc.send('c-window-focus', userName)
        setTimeout(() => {
          userNameInput.focus()
          isfocus()
        }, 100)
      }
    }
    isfocus()

    // const grandparentElement = formInstance.parentNode.parentNode
    // const isRender = () => {
    //   const computedStyle = window.getComputedStyle(grandparentElement)
    //   var opacityVal = computedStyle.getPropertyValue('opacity')
    //   if (opacityVal == 1) {
    //     setTimeout(() => {
    //       userNameInput.focus()
    //       // userNameInput.value = userName
    //       ipc.send('c-name-focus', userName)
    //       ipc.on('b-password-focus', () => {
    //         passwordInput.focus()
    //         ipc.send('c-password-focus', password)
    //       })
    //       //
    //       ipc.on('b-submit', () => {
    //         submitButton.click()
    //         window.localStorage.setItem('__is_login__', 1)
    //       })
    //     }, 100)
    //   } else {
    //     setTimeout(() => {
    //       isRender()
    //     }, 100)
    //   }
    // }
    // isRender()
    // const transitionendFn = () => {
    //   grandparentElement.removeEventListener('transitionend', transitionendFn)
    //   debugger
    //   setTimeout(() => {
    //     // userNameInput.focus()
    //     debugger
    //     ipc.send('c-name-focus', userName)
    //     ipc.on('b-password-focus', () => {
    //       passwordInput.focus()
    //       ipc.send('c-password-focus', password)
    //     })
    //     //
    //     ipc.on('b-submit', () => {
    //       submitButton.click()
    //       window.localStorage.setItem('__is_login__', 1)
    //     })
    //   }, 1000)
    // }
    // grandparentElement.addEventListener('transitionend', transitionendFn)
  } else {
    time.value++
    timer = setTimeout(() => {
      getDom()
    }, 100)
  }
}

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>
<style scoped lang="less">
iframe {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
