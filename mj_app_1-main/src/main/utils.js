const https = require('https')
const fs = require('fs')
const path = require('path')
import axios from 'axios'

export async function downloadImage(imageUrl, downloadPath) {
  try {
    let str = imageUrl.replace('media.discordapp.net', 'media01.nanlili.com') // 用国内地址下载
    const index = str.indexOf('?')
    if (index !== -1) {
      str = str.substring(0, index)
    }
    const fileNameMatches = str.match(/\/([^\/?#]+)[^\/]*$/)
    const fileName = fileNameMatches ? fileNameMatches[1] : 'mj_下载图片.jpg' // 提取文件名及扩展名称
    // 使用 axios 发送 HTTP 请求
    const response = await axios.get(str, {
      responseType: 'arraybuffer',
      timeout: 5000 // 设置超时时间，单位为毫秒
    })

    // 生成保存图片的文件路径
    const filePath = path.join(downloadPath, fileName)

    // 将图片数据保存到文件
    fs.writeFileSync(filePath, Buffer.from(response.data))

    // 在这里您可以通过事件向渲染进程发送通知，告诉它下载已完成
    return true
  } catch (error) {
    console.error('Error downloading image:', error.message)
    return false
  }
  // return new Promise((resolve, reject) => {
  //   console.log('获取成功，地址!', imageUrl, downloadPath)

  //   https.get(imageUrl, (response) => {
  //     console.log('获取成功!', response)
  //     let data = ''

  //     // 将图片数据保存到data中
  //     response.on('data', (chunk) => {
  //       data += chunk
  //     })

  //     response.on('end', () => {
  //       // 生成保存图片的文件路径
  //       const filePath = path.join(downloadPath, 'downloaded_image.jpg')
  //       fs.writeFileSync(filePath, data)
  //       resolve(true)
  //     })
  //   })
  // })
}
