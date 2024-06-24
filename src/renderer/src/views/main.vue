<template>
  <!-- <button @click="router.push('/index')">自动账号密码登录</button> -->
  <iframe
    v-if="iframeUrl"
    id="discordId"
    ref="iframeInstance"
    :src="iframeUrl"
    frameborder="0"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    @load="onIframeLoad"
  ></iframe>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { decrypt } from '../utils/crypto.js'
import Config from '@renderer/config'

const router = useRouter()
const iframeInstance = ref(null)
const base = 'https://discord.com/'
const iframeUrl = ref('')

const guildId = window.localStorage.getItem('__gid__')
const channelId = window.localStorage.getItem('__cid__')
const hideSideBar = () => guildId && channelId

if (hideSideBar()) {
  iframeUrl.value = base + 'channels/' + guildId + `/${channelId}`
} else {
  iframeUrl.value = base + 'channels/@me'
}

// const check
const loginOut = () => {
  window.localStorage.clear()
  router.replace('/')
}

const setToken = (token) => {
  const decryptToken = decrypt(token)
  iframeInstance.value.contentWindow &&
    iframeInstance.value.contentWindow.localStorage.setItem('token', token)
}

onMounted(() => {
  const token = window.localStorage.getItem('__token__')
  if (!token) {
    loginOut()
    return
  }
  setToken(token)

  nextTick(() => {
    setToken(token)
  })
})

const onIframeLoad = () => {
  hideSideBar() && hideDiscordMenu() // 只能限制在自己频道上
  setSomeStyleToIframe()
}

// 禁止一些样式
const setSomeStyleToIframe = async () => {
  try {
    const response = await axios.get(`${Config.baseUrl}/mjapp.json`, {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});
    const { style } = response.data
    const iframeDocument =
      iframeInstance.value.contentDocument || iframeInstance.value.contentWindow.document
    const styleElement = iframeDocument.createElement('style')

    // 在 style 元素中写入样式规则
    const styleText = style
    styleElement.appendChild(iframeDocument.createTextNode(styleText))

    // 将 style 元素添加到 iframe 内部文档的 head 中
    iframeDocument.head.appendChild(styleElement)
  } catch (error) {
    //
  }
}

// 隐藏侧边栏目
const hideDiscordMenu = () => {
  // 创建一个 style 元素
  const iframeDocument =
    iframeInstance.value.contentDocument || iframeInstance.value.contentWindow.document
  const styleElement = iframeDocument.createElement('style')

  // 在 style 元素中写入样式规则
  const styleText = '.wrapper_a7e7a8 { display: none !important; }'
  styleElement.appendChild(iframeDocument.createTextNode(styleText))

  // 将 style 元素添加到 iframe 内部文档的 head 中
  iframeDocument.head.appendChild(styleElement)
}

// 检查自家平台的登录
const checkAccount = async () => {
  const key = window.localStorage.getItem('__code__')
  if (!key) {
    loginOut()
    return
  }
  try {
    const res = await axios.post(`https://182.92.194.63:443/api/getKey/${Config.version}`, {
      params: {
        key: JSON.parse(key)
      }
    })
    const { status, token, guildId, channelId } = res.data || {}
    if (!status) {
      // 注销账号
      loginOut()
    } else {
      // 去discord检查token是否过期
      if (channelId && guildId) {
        // 更新其他频道数据
        window.localStorage.setItem('__gid__', guildId)
        window.localStorage.setItem('__cid__', channelId)
      }
      window.localStorage.setItem('__token__', JSON.stringify(token))
      checkAccountByDiscord(token)
    }
  } catch (error) {
    loginOut()
  }
}

// 检查dis过期
const checkAccountByDiscord = async (token) => {
  const d = decrypt(token)
  try {
    await axios.get(`https://discord.com/api/v9/users/@me/billing/payment-sources`, {
      headers: {
        Authorization: d
      }
    })
  } catch (error) {
    window.alert('登录已失效')
    loginOut()
  }
}

// 获取discord菜单列表
// https://discord.com/api/v9/users/@me/guilds 调用方式同上

checkAccount()
</script>
<style scoped lang="less">
iframe {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
