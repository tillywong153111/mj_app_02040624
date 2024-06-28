import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import { pathToFileURL } from 'url'; // 引入 url 模块的 pathToFileURL 方法
import { app } from 'electron';

console.log('预加载脚本加载');

// 假设在开发环境中，assets 目录位于项目根目录下，而在生产环境中，它位于 resources/app.asar 下
const isDevelopment = process.env.NODE_ENV === 'development' || !process.defaultApp;

const api = {
  getImagePath: () => {
    // 使用 GitHub 上托管的图片的 URL
    const imageUrl = "https://raw.githubusercontent.com/tillywong153111/mj_resources/main/wechat.jpg";
    console.log('Image URL:', imageUrl); // 输出图片URL
    return imageUrl;
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

console.log(process.resourcesPath);
