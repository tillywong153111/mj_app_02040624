import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';

console.log('预加载脚本加载');
// 假设在开发环境中，assets 目录位于项目根目录下，而在生产环境中，它位于 resources/app.asar 下
const isDevelopment = process.env.NODE_ENV === 'development' || !process.defaultApp;

const api = {
  getImagePath: () => {
    let imagePath;
    if (isDevelopment) {
      // 假设assets目录位于项目根目录下
      imagePath = path.join(__dirname, '../../../assets/wechat.jpg');
    } else {
      // 生产环境下，资源位于app.asar内
      imagePath = path.join(process.resourcesPath, 'app.asar', 'assets', 'wechat.jpg');
    }
    return imagePath;
  }
};

// 使用 contextBridge 暴露 API
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI);
  contextBridge.exposeInMainWorld('api', api);
} else {
  window.electron = electronAPI;
  window.api = api;
}

console.log(path.join(__dirname, '../../../assets/wechat.jpg'));
console.log(process.resourcesPath);