import { app, shell, BrowserWindow, ipcMain, Menu, net, clipboard, dialog, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../build/icon.png?asset'
import { downloadImage } from './utils'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { join } from 'path'
const url = require('url');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';


let mainWindow; // 假设您已经有一个创建主窗口的变量


function createPurchaseWindow() {
  let purchaseWindow = new BrowserWindow({
    width: 540,
    height: 630,
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false, 
      preload: join(__dirname, '../preload/index.js')// 指定预加载脚本的路径
    }
  });

  const htmlPath = url.format({
    pathname: path.join(app.getAppPath(), 'src', 'renderer', 'purchase.html'),
    protocol: 'file:',
    slashes: true
  });

  purchaseWindow.loadURL(htmlPath);
  
  purchaseWindow.on('closed', () => {
    purchaseWindow = null;
  });
}

const isMac = process.platform === 'darwin'

app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

// bootstrap()
function createWindow() {
  // 环境检测
  const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;

  let imagePath;
  

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      partition: 'persist:your_partition_name', 
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      experimentalFeatures: true
    }
  });

  if (!isDev) {
    const menu = Menu.buildFromTemplate([
      {
        label: '静婳AI',
        submenu: [
          ...(isMac
            ? [
                {
                  label: '关于静婳AI',
                  click: function () {
                    // 在这里添加点击“关于静婳AI”时应执行的操作
                  }
                }
              ]
            : []),
          {
            label: '退出应用',
            accelerator: 'Command+Q',
            click: function () {
              app.quit(); // 退出应用
            }
          },
          {
            label: '退出重登',
            click: function () {
              mainWindow.webContents.send('back-home'); // 退出并返回首页
            }
          }
        ]
      },
      {
        label: '切换账号',
        submenu: [
          {
            label: '点击后输入新的授权码即可',
            click: function () {
              mainWindow.webContents.send('back-home'); // 发送'back-home'消息以处理账号切换
            }
          }
        ]
      },
      {
        label: 'GPT会员',
        submenu: [
          {
            label: '点这儿咨询购买',
            click: () => createPurchaseWindow() // 点击时创建并显示购买窗口
          }
        ]
      },
      {
        label: '声音控制',
        submenu: [
            {
                label: '一键静音',
                click: () => {
                    // 直接设置静音为 true，关闭所有声音
                    mainWindow.webContents.setAudioMuted(true);
                }
            },
            {
                label: '开启声音',
                click: () => {
                    // 直接设置静音为 false，开启声音
                    mainWindow.webContents.setAudioMuted(false);
                }
            }
        ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    }
    ]);
    Menu.setApplicationMenu(menu); // 设置应用菜单
  }
  
  
  // mainWindow.webContents.openDevTools({
  //   mode: 'bottom'
  // })
  // 兼容跨域
  mainWindow.webContents.session.webRequest.onHeadersReceived((d, c) => {
    if (d.responseHeaders['x-frame-options'] || d.responseHeaders['X-Frame-Options']) {
      delete d.responseHeaders['x-frame-options']
      delete d.responseHeaders['X-Frame-Options']
    }
    c({ cancel: false, responseHeaders: d.responseHeaders })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })
  mainWindow.show()

  mainWindow.webContents.setWindowOpenHandler((details) => {
    //const mySession = session.fromPartition('persist:your_partition_name');
  
    const newWindow = new BrowserWindow({
      webPreferences: {
        // 使用与父窗口相同的会话
        partition: 'persist:your_partition_name',
        contextIsolation: false,
        nodeIntegration: true,
      }
    });

    newWindow.loadURL(details.url);
    return { action: 'deny' };
  });
  

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 监听本地网络操作
  ipcMain.on('getNetworkStatus', (event) => {
    const request = net.request('https://discord.com') // 使用你想要检查的URL
    if (!net.isOnline()) {
      event.reply('networkStatus', { connected: false })
      return
    }
    event.reply('networkStatus', { connected: false })
    console.log(net.isOnline())
    request.on('response', (response) => {
      console.log(`Status Code: ${response}`)
      if (response.statusCode === 200) {
        console.log('Local network is accessible.')
        event.reply('networkStatus', { connected: true })
      } else {
        console.log('Local network is not accessible.')
        event.reply('networkStatus', { connected: false })
      }
    })

    request.on('error', (error) => {
      console.error(`Error: ${error.message}`)
      console.log('Local network is not accessible.')
      event.reply('networkStatus', { connected: false })
    })

    request.end()
  })

  mainWindow.webContents.on('context-menu', async (event, params) => {
    const { x, y, srcURL } = params;
    if (!srcURL) return;

    const menu = Menu.buildFromTemplate([
      {
        label: '复制图片地址',
        click: function () {
          if (srcURL) {
            clipboard.writeText(srcURL);
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '提示',
              message: '图片地址复制成功'
            });
          }
        }
      },
      {
        label: '保存到本地',
        click: function () {
          if (srcURL) {
            dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            }).then(async (result) => {
              if (!result.canceled && result.filePaths.length > 0) {
                const downloadPath = result.filePaths[0];
                const res = await downloadImage(srcURL, downloadPath);
                const message = res ? '保存成功' : '保存失败，请在浏览器中保存图片';
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: '提示',
                  message
                });
                if (!res) {
                  shell.openExternal(srcURL);
                }
              }
            }).catch(err => {
              console.error('打开目录选择对话框时发生错误:', err);
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: '错误',
                message: '保存图片时发生错误'
              });
            });
          }
        }
      }
    ]);

    menu.popup({
      window: mainWindow,
      x,
      y
    });
  });
}




  // autoUpdater.on('download-progress', (progressObj) => {
  //   if (mainWindow && !mainWindow.isDestroyed()) {
  //     mainWindow.setProgressBar((progressObj && progressObj.percent) ? progressObj.percent / 100 : -1)
  //   }
  // });

  // ipcMain.on('getNetworkStatus', (event) => {
  //   const domain = 'discord.com'
  //   const isWindows = process.platform === 'win32'

  //   // 构建 ping 命令
  //   const pingCommand = isWindows ? `ping -n 4 ${domain}` : `ping -c 4 ${domain}`

  //   // 执行 ping 命令
  //   exec(pingCommand, (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error: ${error.message}`)
  //       console.log(`Website ${domain} is not accessible.`)
  //     } else {
  //       console.log('Ping Result:')
  //       console.log(stdout)

  //       // 检查 ping 结果中是否包含 "TTL" 或 "time" 字段，表示连接成功
  //       if (stdout.includes('TTL') || stdout.includes('time')) {
  //         console.log(`Website ${domain} is accessible.`)
  //       } else {
  //         console.log(`Website ${domain} is not accessible.`)
  //       }
  //     }
  //   })
  // })

  // ipcMain.on('c-window-focus', (event, arg) => {
  //   mainWindow.webContents.sendInputEvent({
  //     type: 'mouseDown',
  //     x: 10,
  //     y: 10,
  //     button: 'left',
  //     clickCount: 1
  //   })
  // })

  // ipcMain.on('c-password-focus', (event, arg) => {
  //   mainWindow.show()
  //   mainWindow.webContents.executeJavaScript(`
  //   document.getElementById('discordId').contentWindow.document.getElementById('uid_7').focus();
  // `)
  //   for (const i of arg) {
  //     mainWindow.webContents.sendInputEvent({
  //       type: 'char',
  //       keyCode: i
  //     })
  //   }
  //   event.sender.send('b-submit')
  // })


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  // 注释掉这个块的代码
  // 在窗口创建后验证会话数据
  //const { session } = require('electron'); 
  //session.fromPartition('persist:name_of_your_partition').cookies.get({})
    //.then((cookies) => {
      //console.log(cookies); // 查看所有 cookies
      // 在这里添加基于 cookies 的逻辑，例如更新窗口或状态
    //})
    //.catch((error) => {
      //console.error(error);
    //});

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Object.defineProperty(app, 'isPackaged', {
  //   get() {
  //     return true;
  //   }
  // });

  autoUpdater.setFeedURL({
    provider: 'github',
    repo: 'tillywong153111',
    owner: 'MMJ1',
    private: false, // 如果你的仓库是私有的，需要设置为 true
  });
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdatesAndNotify();
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '软件更新',
    message: '发现新版本，确定更新',
    buttons: ['确定', '取消']
  }).then(resp => {
    if (resp.response == 0) {
      autoUpdater.downloadUpdate()
    }
  })
});

autoUpdater.on('error', (err) => {
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: '软件更新',
  //   message: '更新出错: ' + err
  // })
});

autoUpdater.on('update-downloaded', () => {
  // const response = dialog.showMessageBox({
  //   type: 'info',
  //   title: '软件更新',
  //   message: '下载完成，即将安装重启',
  //   buttons: ['确定']
  // });
  // if (response == 0) {
  //   autoUpdater.quitAndInstall();
  // }
  autoUpdater.quitAndInstall();
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
