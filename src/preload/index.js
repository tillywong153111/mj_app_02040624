import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import { pathToFileURL } from 'url'; // 引入 url 模块的 pathToFileURL 方法

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
       // 生产环境下，资源位于app.asar内或用户数据目录下
      // 如果你决定把资源放在用户数据目录下，确保你的主进程或者打包脚本已经相应地复制了这些资源
      const userDataPath = app.getPath('userData'); // 使用Electron的app模块获取用户数据目录的路径
      imagePath = path.join(userDataPath, 'assets', 'wechat.jpg');
      // 如果资源直接包含在 app.asar 中，使用下面的路径
      // imagePath = path.join(process.resourcesPath, 'app.asar', 'assets', 'wechat.jpg');
    }
    // 使用 pathToFileURL 转换 imagePath 为 file:// URL
    return pathToFileURL(imagePath).href;
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
