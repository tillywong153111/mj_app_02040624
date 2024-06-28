const fs = require('fs');
const path = require('path');
import axios from 'axios';

export async function downloadImage(imageUrl, downloadPath) {
  try {
    console.log(`开始下载图片: ${imageUrl}`);

    // 不去除URL中的查询参数，直接使用完整URL进行下载
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      validateStatus: (status) => status >= 200 && status < 300, // 确保成功状态码范围
      timeout: 5000 // 设置超时时间，单位为毫秒
    });

    const fileNameMatches = imageUrl.match(/\/([^\/?#]+)[^\/]*$/);
    const fileName = fileNameMatches ? fileNameMatches[1] : 'downloaded_image.jpg';
    const filePath = path.join(downloadPath, fileName);

    console.log(`文件名: ${fileName}`);
    console.log(`保存路径: ${filePath}`);
    
    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log('图片下载并保存成功');

    return true;
  } catch (error) {
    console.error('下载图片时出错:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应头信息:', error.response.headers);
    }
    return false;
  }
}