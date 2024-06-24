<template>
  <div class="login-wrap">
    <div class="bg">
      <img src="@renderer/assets/bg-daa6ee4f.svg" alt="My Happy SVG" />
    </div>
    <div class="wrapper">
      <div class="login">
        <div class="auth">
          <div class="desc">
            <h1 class="welcome">欢迎回来！</h1>
            <div>
              <p style="line-height: 28px">很高兴再次见到您!</p>
            </div>
          </div>
          <div class="form">
            <p style="font-size: 12px; text-align: left; color: #c2c2c2; margin-bottom: 6px">
              请输入授权登陆码<span style="color: red">*</span>
            </p>
            <input v-model="code" class="code-input" placeholder="请输入授权码" />
            <button class="login-btn" @click="loginHandler">
              {{ loginLoading ? '登录中...' : '登录' }}
            </button>
            <!-- <p style="font-size: 12px; color: #c2c2c2; text-align: left; margin-top: 8px">
              不会使用Midjourney?
              <a
                style="color: #409eff; cursor: pointer"
                href="https://fia4ernqvtt.feishu.cn/docx/Ke9Cdk0iuoOUL9x97l0cxpmtnbb"
                target="_blank"
                >查看使用教程
              </a>
            </p> -->
          </div>
        </div>
        <div class="qrCode">
          <div class="code-div"><img src="@renderer/assets/wechat.jpg" /></div>
          <h1 class="add-wechat">客服微信</h1>
          <!-- <p>反馈建议，合作请加微信</p> -->
          <p>使用问题请直接联系店铺客服</p>
          <p>(8:30-23:00)</p>
        </div>
      </div>

      <div
        class="wrapper-foot"
        :class="{
          'sign-error': !netWordStatus
        }"
      >
        <ul class="sign">
          <li v-for="i in 3" :key="i"></li>
        </ul>
        <span>网络连接{{ netWordStatus ? '正常' : '异常' }}</span>
        <span style="padding-left: 6px; color: #409eff; cursor: pointer" @click="refreshNetword">
          {{ loading ? '检测中...' : '刷新' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ipc } from '../utils/index.js'
import Config from '@renderer/config'

const code = ref('')
const netWordStatus = ref(false)
const loading = ref(false)
const loginLoading = ref(false)
const router = useRouter()

const loginHandler = async () => {
  if (!netWordStatus.value) {
    window.alert('请检查网络连接')
    return
  }
  if (loginLoading.value) return
  loginLoading.value = true
  const key = code.value.trim()
  axios
    .post(`https://182.92.194.63:443/api/getKey/${Config.version}`, {
    // .get(`${Config.baseApiUrl}/api/getkey`, {
      params: {
        key
      }
    })
    .then((res) => {
      const { token, status, guildId, channelId } = res.data || {}
      if (status == 0) {
        window.alert('请联系客服获取最新版本')
        return
      }
      if (!status || status != 1) {
        window.alert('账号不存在')
        return
      }
      // 限制在自己频道
      if (channelId && guildId) {
        window.localStorage.setItem('__gid__', guildId)
        window.localStorage.setItem('__cid__', channelId)
      }
      window.localStorage.setItem('__token__', JSON.stringify(token))
      window.localStorage.setItem('__code__', JSON.stringify(key))

      router.push('/main')
    })
    .catch(() => {
      window.alert('账号不存在')
    })
    .finally(() => {
      loginLoading.value = false
    })
}

const refreshNetword = () => {
  if (loading.value) return
  loading.value = true
  ipc.send('getNetworkStatus')
}

refreshNetword()

ipc.on('networkStatus', (e, arg) => {
  loading.value = false
  netWordStatus.value = arg.connected
})
</script>
