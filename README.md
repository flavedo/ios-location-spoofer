# iOS Location Spoofer

自建了worker网页，选点页也在里面：https://cyberhandyman-ioslocspo.cyberhandyman.workers.dev

视频教程：https://youtu.be/EspuRlKWUxc

> 📺 YouTube：**[CyberHandyman 赛博工具人](https://www.youtube.com/@CyberHandyman/videos)** ｜ ✈️ Telegram 讨论群：**[@cyberhandymancngroup](https://t.me/cyberhandymancngroup)**

> ✅ **已同步上游 [Yu9191/wloc v1.1](https://github.com/Yu9191/wloc/releases)**：随机扰动半径（每次定位在目标点周围随机偏移，避免结果完全相同）· 港澳台坐标（苹果/Google 在港澳台直发 WGS-84，不再误做 GCJ 反算）· 百度链接解析 · 高德 `position=` 经纬顺序修正。扰动半径在选点页设置。

---

## ⚠️ 免费开源项目 · 禁止售卖

**如果你是通过付款来到本页面，请立即联系退款。**
任何售卖本项目 / 模块的都是骗子。一经发现立即删库，血本无归。

---

## 🚀 一键部署你自己的选点页

不想用我的网址、或者想自己掌控？点下面的按钮，登录 Cloudflare 后一路下一步，
**30 秒**就能部署一份**属于你自己的**选点页（Cloudflare 免费额度完全够用）：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cyberhandyman/ios-location-spoofer/tree/main/stateless-picker/worker)

部署完你会拿到一个自己的网址（形如 `https://xxx.你的账号.workers.dev`）。
它自带全部模块文件，主页里的「一键导入」按钮会**自动指向你自己的域名**，不用改任何代码。

> **无状态说明**：坐标只存在**各自设备**上，服务端不存任何数据（没有绑定 KV / D1 等任何存储）。
> 所以同一个网址可以被无数人同时使用、互不覆盖，你部署的这份也一样。

---

## 📖 使用教程

| | |
|---|---|
| 🇨🇳 小白保姆级图文教程 | [使用教程.md](使用教程.md) |
| 🇬🇧 English guide | [使用教程.en.md](使用教程.en.md) ｜ [README.en.md](README.en.md) |
| 📲 iOS 快捷指令（分享地图链接直接改定位） | [见使用教程末尾](使用教程.md#-ios-快捷指令分享地图链接直接改定位) |

**生效前提**：① 代理 App 已连接（开关/引擎打开、非「直连」模式）② 开启 HTTPS 解密(MITM) 并信任证书 ③ 装好对应客户端的模块。

> **macOS 也能用**：Shadowrocket 需打开「强制路由」、Surge 需打开「增强模式」，让代理真正全量接管流量后，同一个模块即可生效。

---

## 📦 模块安装地址

推荐直接在[选点页首页](https://cyberhandyman-ioslocspo.cyberhandyman.workers.dev)点「一键导入」。手动添加用下面的地址：

| 客户端 | 模块地址 |
|---|---|
| Shadowrocket / Surge / Egern | `https://raw.githubusercontent.com/cyberhandyman/ios-location-spoofer/main/ios-location-spoofer.sgmodule` |
| Loon | `https://raw.githubusercontent.com/cyberhandyman/ios-location-spoofer/main/ios-location-spoofer.lnplugin` |
| Stash | `https://raw.githubusercontent.com/cyberhandyman/ios-location-spoofer/main/ios-location-spoofer.stoverride` |
| Quantumult X | `https://raw.githubusercontent.com/cyberhandyman/ios-location-spoofer/main/ios-location-spoofer.snippet` |

**MITM 主机名**（如全部配置成功仍不生效，手动加入这四个域名）：

```
gs-loc.apple.com
gs-loc-cn.apple.com
bluedot.is.autonavi.com
bluedot.is.autonavi.com.gds.alibabadns.com
```

---

## 🔍 原理

iPhone 靠周围 Wi-Fi、基站的 BSSID 去问 Apple「这些设备在哪」，Apple 回一份坐标清单，iOS 据此算出自己的位置。

本模块在 **Apple 回坐标的半路上**（`gs-loc.apple.com/clls/wloc`）把响应里的坐标全部改成你指定的数字，iPhone 算出来就是你选的地方。选点页则通过 `ils-settings` 请求把坐标写进**你手机本机**的持久化存储，模块读取后生效——**全程不经过任何服务器**。

---

## 🙏 fork from 鸣谢贡献者

[Yu9191/wloc](https://github.com/Yu9191/wloc) · [mekos2772/ios-location-spoofer](https://github.com/mekos2772/ios-location-spoofer) · [acheong08/ios-location-spoofer](https://github.com/acheong08/ios-location-spoofer)

---

## 📄 免责声明

1. 本项目为免费开源工具，**仅供个人学习、研究与技术测试之用**，请勿用于任何违反所在国家/地区法律法规的用途。
2. 使用本项目（含模块、脚本、选点页）所引发的**一切风险与后果由使用者自行承担**，与开源项目原作者、贡献者及本仓库维护者无关。
3. 本项目与 **Apple Inc.** 无任何关联，不隶属、不代表 Apple，亦未获其授权或认可。
4. 下载、安装或使用本项目，即视为你已阅读并同意本声明；如不同意，请立即停止使用。

许可证：**GNU AGPL-3.0**（继承自上游项目）
