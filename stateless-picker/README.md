# iOS Location Spoofer — 无状态选点页（Stateless Picker）

给 [`ios-location-spoofer`](https://github.com/flavedo/ios-location-spoofer) 配一个**可公开共用、多人互不覆盖**的地图选点页：点地图选点 → 自动查海拔 → 一键写入本机 → `location-spoofer.js` 直接生效。

用的是这个项目**自己的模块**（`location-spoofer.js`，保留 ARPC / 海拔 / 运动状态等全部能力），只是把坐标来源从"共享服务器"换成"每台设备各自的本地存储"。

---

## 为什么能公开共用（无状态原理）

原来的 `location-picker/` 是**有状态**的：坐标存在服务端 KV（单个 `loc.json`），所有设备靠 `configUrl` 读同一个点 —— 多人一起用会**互相覆盖**。

本方案改成**无状态**：

```
选点页 → fetch gs-loc.apple.com/ils-settings/save?lat=&lon=&alt=
       → 请求不发往 Apple，被【用户自己设备上】的代理模块 MITM 拦截
       → location-settings.js 写入本机 $persistentStore：
             latitude / longitude / altitude / enabled=true
       → 下次 /clls/wloc 触发 → location-spoofer.js 读这些本机值 → patch protobuf
```

- **服务端不存任何用户坐标**。worker 只做两件无状态的事：托管选点页 + `/api/parse` 转发解析地图链接（收到即处理，不写存储、不记日志、不缓存）。海拔由浏览器直接查 Open-Meteo（防抖 + 内存缓存），也不经服务端。
- 生效坐标存在**每台设备各自的 `$persistentStore`**，收藏存在**各自浏览器的 `localStorage`**。
- 因此**一个公共选点页可被无数人同时用，各写各的设备，互不覆盖**。
- `location-spoofer.js` 早就会从 `$persistentStore` 读 `latitude/longitude/altitude`（`enrichArgsFromPluginStore`），所以**大模块几乎不用改**。

---

## 模块改动（只有一行）

- **`location-spoofer.js`**：`DEFAULT_CONFIG.enabled` 由 `true` 改为 **`false`**。

  为什么：无状态清单不在参数里写死经纬度/enabled，全部交给设备端持久化控制。若默认 `enabled=true`，没选点时会被定到内置默认坐标（Apple Park）。改成默认 `false` 后，**没选点 / 已清除 → `enabled=false` → 脚本放行真实定位**（`location-spoofer.js:1853`）。选点页保存时写 `enabled=true` 才开始伪造。
- **兼容**：原有的有状态清单（`ios-location-spoofer.sgmodule` / `-surge.sgmodule` / `.stoverride`）已补上 `enabled=true`，行为不变；Loon 清单 UI 本就默认 `enabled=true`；Quantumult X 用的是另一个文件 `location-spoofer-qx.js`，不受影响。

新增文件：
- **`location-settings.js`**（仓库根）：save 拦截脚本，把选点写进本机 `$persistentStore`。支持 Surge / Shadowrocket / Loon / Stash / Egern（`$persistentStore`）与 Quantumult X（`$prefs`）。
- **`stateless-picker/worker/`**：选点页 worker（地图选点 / 地名搜索 / 地图链接解析 / 收藏 / 海拔自动 / 逐项复制 / PWA）。

---

## 用法

### 1. 装无状态模块（两种拿法，二选一）

**A. 从 worker 直接装（推荐：免 push GitHub，脚本也托管在 worker 上）**

| 客户端 | 地址 |
|---|---|
| Surge / Shadowrocket / Egern | `https://你的worker域名/ios-location-spoofer.sgmodule` |
| Loon | `…/ios-location-spoofer.lnplugin` |
| Stash | `…/ios-location-spoofer.stoverride` |
| Quantumult X（重写引用） | `…/ios-location-spoofer.snippet` |

**B. 从 GitHub raw 装（需先把你的 fork push 上去）**

根目录已是无状态模块，脚本指向 `raw.githubusercontent.com/flavedo/…`：
- Surge / Shadowrocket / Egern：`…/main/ios-location-spoofer.sgmodule`
- Loon：`…/main/ios-location-spoofer.lnplugin`
- Stash：`…/main/ios-location-spoofer.stoverride`
- Quantumult X：`…/main/ios-location-spoofer.snippet`

> 都要开 MITM 并信任 `gs-loc.apple.com`、`gs-loc-cn.apple.com`（另含 `bluedot.is.autonavi.com` 两个）。
>
> **⚠️ Quantumult X 特殊**：QX **没有「模块/插件」**，用**「设置 → 重写 → 引用」**添加上面的 `.snippet` 地址（`/clls/wloc` 走 `script-response-body`，`/ils-settings/` 走 `script-echo-response`）。而且 QX **不会像 Surge 那样自动合并 MITM**——需手动把这 4 个主机名加进「设置 → MITM → Host」。QX 用的是单独的 `location-spoofer-qx.js`（读 `$prefs`），已改为无状态。

### 2. 打开选点页

用公共 worker 或自部署（见下）。地图选点 / 搜地名 / 粘地图链接 → 点「储存到设备」→ 下次定位生效。iOS 26+ 切换后需重启一次设备清缓存。

恢复真实定位：点选点页的「清除数据」（写 `enabled=false`），或关闭模块。

---

## 自部署选点页 worker

```bash
git clone https://github.com/flavedo/ios-location-spoofer.git
cd ios-location-spoofer/stateless-picker/worker
npm install
npx wrangler login       # 首次；需先在 Cloudflare 验证账号邮箱
npm run deploy
```

无需 KV / D1 / 任何存储绑定（这正是无状态的关键）。部署后得到 `https://ios-location-picker.<你的子域名>.workers.dev`。

- **免构建单文件版**：`stateless-picker/worker/single-file-worker.js` 可直接粘进 Cloudflare Dashboard 新建 Worker（内容由 `npm run build:single` 从 `src/` 自动生成）。

坐标系：选点页的链接解析统一走 `/api/parse` 归一化为 **WGS-84**（高德/苹果(中国)/Google=GCJ-02、百度=BD-09，境外自动 no-op）。

---

## 自测（已在 Node 中逐条验证）

- save 拦截脚本把 `latitude/longitude/altitude/enabled=true` 正确写入持久化；query 读回；clear 写 `enabled=false`。
- `location-spoofer.js` 读这些本机值后正确 patch（含海拔 field 5）；未选点 / `enabled=false` → 透传真实定位。
- 端到端集成：选点保存 → 模块读出 → 定位到目标点（经纬度 + 海拔均正确）。
- 选点页两条部署路径（Hono `src/index.js` 与单文件）路由、坐标转换、manifest、图标全部通过。

---

## 署名与许可

本项目是 [`acheong08/ios-location-spoofer`](https://github.com/acheong08/ios-location-spoofer) 血脉的 fork，采用 **GNU AGPL-3.0**（见根目录 `LICENSE`）。本目录下所有新增（`location-settings.js`、选点页 worker、无状态清单）均为其衍生作品，**同样以 AGPL-3.0 授权**——公开分发时请保持源码可得，并遵守 AGPL 的网络服务条款。

- 无状态选点页的机制参考了 WLOC 血脉（[Yu9191/wloc](https://github.com/Yu9191/wloc) / [FFF686868/proxypin-wloc-spoofer](https://github.com/FFF686868/proxypin-wloc-spoofer)）「写设备端、不存服务端」的思路，独立实现。
- 海拔数据：[Open-Meteo](https://open-meteo.com/) Elevation API（WGS-84，免 key）。
- 地图底图 / 地名搜索：ArcGIS / OSM / Carto / 高德瓦片、Nominatim。
