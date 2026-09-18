export function getLandingHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>iOS Location Spoofer</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0a0c11">
<link rel="apple-touch-icon" href="/icon-180.png">
<style>
:root{
  --bg:#0a0c11; --card:#12161d; --card2:#191e28; --line:#242b38;
  --cyan:#17c3cf; --cyan2:#0e97a1; --green:#22c55e; --green2:#159a45;
  --red:#ff5b60; --amber:#f5a623; --txt:#eef2f8; --muted:#8a93a5; --mono:#7fe3ea;
}
*{ margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
body{
  font-family:-apple-system,system-ui,"SF Pro","Helvetica Neue",sans-serif;
  color:var(--txt); line-height:1.5;
  background:
    radial-gradient(1100px 420px at 50% -140px, rgba(23,195,207,.16), transparent 70%),
    radial-gradient(700px 360px at 90% 8%, rgba(34,197,94,.08), transparent 65%),
    var(--bg);
  background-attachment:fixed;
}
.wrap{ max-width:600px; margin:0 auto; padding:16px 16px calc(44px + env(safe-area-inset-bottom)); }

/* --- unified primary CTAs grid --- */
.ctas-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:14px 0 6px; }
.cta-btn{
  display:flex; align-items:center; justify-content:center; gap:7px;
  padding:15px 8px; border:none; border-radius:14px;
  font-size:15px; font-weight:800; cursor:pointer; text-decoration:none;
  transition:transform .12s, box-shadow .12s, filter .12s;
  text-align:center; white-space:nowrap;
}
.cta-btn:active{ transform:scale(.97); }
.cta-btn.green{ background:linear-gradient(135deg,#2ee06a,#129a44); color:#04240f; box-shadow:0 8px 22px rgba(34,197,94,.32); }
.cta-btn.cyan{ background:linear-gradient(135deg,var(--cyan),var(--cyan2)); color:#022a2d; box-shadow:0 8px 22px rgba(23,195,207,.28); }
.cta-btn.coral{ background:linear-gradient(135deg,#ff6267,#db272e); color:#ffffff; box-shadow:0 8px 22px rgba(255,91,96,.30); }
.cta-btn.blue{ background:linear-gradient(135deg,#38bdf8,#0284c7); color:#032130; box-shadow:0 8px 22px rgba(14,165,233,.28); }
@media (max-width:380px){
  .cta-btn{ font-size:13.5px; padding:13px 4px; gap:5px; }
}

.divider{ height:1px; background:linear-gradient(90deg,transparent,var(--line),transparent); margin:20px 0 20px; }

/* --- section heads with accent bar --- */
h2{ font-size:16px; font-weight:800; margin-bottom:4px; display:flex; align-items:center; gap:9px; }
h2::before{ content:""; width:4px; height:16px; border-radius:2px; background:linear-gradient(180deg,var(--cyan),var(--green)); }
.sub{ font-size:12.5px; color:var(--muted); margin:0 0 14px 13px; }
.note{ background:var(--card); border:1px solid var(--line); border-left:4px solid var(--cyan); border-radius:11px; padding:12px 14px; font-size:12.5px; color:#c3ccdb; margin-bottom:16px; }
.note b{ color:var(--txt); }

/* --- platform cards --- */
.plat{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px; margin-bottom:12px; }
.plat .big{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; border:none; border-radius:11px; background:linear-gradient(135deg,var(--cyan),var(--cyan2)); color:#022a2d; font-size:15.5px; font-weight:800; cursor:pointer; text-align:center; text-decoration:none; transition:filter .12s,transform .12s; }
.plat .big:active{ filter:brightness(1.1); transform:scale(.98); }
.plat .line{ display:flex; align-items:center; gap:8px; margin-top:9px; }
.plat .url{ flex:1; min-width:0; font-family:"SF Mono",ui-monospace,monospace; font-size:11px; color:var(--muted); background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:8px 10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.plat .copy{ flex:none; padding:8px 15px; border:1px solid var(--line); border-radius:8px; background:var(--card2); color:var(--txt); font-size:12.5px; font-weight:600; cursor:pointer; transition:all .12s; }
.plat .copy:active{ background:#2a3140; }
.plat .copy.ok{ background:var(--green); border-color:var(--green); color:#04240f; }
.plat .pnote{ font-size:11.5px; color:var(--muted); margin-top:7px; line-height:1.6; }

/* --- info boxes --- */
.mitm{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 15px; font-size:12.5px; color:#c3ccdb; margin-top:16px; }
.mitm b{ color:var(--txt); }
.mitm code{ display:inline-block; font-family:"SF Mono",ui-monospace,monospace; font-size:11.5px; color:var(--mono); word-break:break-all; line-height:2; }
.mitm .hosts{ margin-top:8px; padding:10px 12px; background:var(--bg); border:1px solid var(--line); border-radius:9px; }
.mitm .hosts code{ line-height:2.1; }

.toast{ position:fixed; left:50%; bottom:40px; transform:translateX(-50%) translateY(20px); background:rgba(8,10,14,.92); color:#fff; padding:11px 20px; border-radius:22px; font-size:14px; opacity:0; transition:all .25s; pointer-events:none; z-index:99; border:1px solid var(--line); }
.toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }
footer{ text-align:center; font-size:11.5px; color:var(--muted); margin-top:26px; line-height:1.9; }
footer b{ color:#8fe0e6; }
</style>
</head>
<body>
<div class="wrap">
  <div class="ctas-grid">
    <a class="cta-btn green" href="/picker">🗺️ 进入选点网页</a>
    <a class="cta-btn cyan" href="/set">⚡ 一键换定位</a>
    <a class="cta-btn coral" href="https://www.icloud.com/shortcuts/b60615c5ac5a401a9bf56de4f55c1dbb" target="_blank" rel="noopener">🧹 清除定位</a>
    <a class="cta-btn blue" href="https://www.icloud.com/shortcuts/1365464980fd430fb6a7c1e591eb564c" target="_blank" rel="noopener">📍 分享定位</a>
  </div>

  <div class="divider"></div>

  <h2>安装模块</h2>
  <p class="sub">选你的代理客户端，点「一键导入」直接装；或「复制」手动添加。</p>
  <div class="note">📍 生效前提：① 代理 App 已连接（开关/引擎打开、<b>非「直连」模式</b>）；② 开启 HTTPS 解密(MITM) 并信任证书；③ 装好对应客户端的模块。之后打开选点页选位置、点「储存到设备」即可生效。iOS 26+ 切换后可能需重启一次设备清缓存。</div>

  <div id="plats"></div>

  <div class="mitm">
    <b>Quantumult X 资源解析器 URL（QX 一键导入 / 重写引用需先配好）：</b><br>
    <code>https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js</code><br>
    添加方式 —— 把下面这段填进 QX 配置：<br>
    <code>[general]<br>#复制下面这些内容（另起一行）<br>resource_parser_url=https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js</code>
  </div>
  <div class="mitm">
    <b>MITM 主机名（如全部配置成功仍不生效，在 MITM / HTTPS 解密中手动加入下面四个域名）：</b>
    <div class="hosts"><code>gs-loc.apple.com<br>gs-loc-cn.apple.com<br>bluedot.is.autonavi.com<br>bluedot.is.autonavi.com.gds.alibabadns.com</code></div>
  </div>

  <footer>
    坐标只存在你<b>当前设备</b>上，服务端不留存记录。<br>
    GNU AGPL-3.0
  </footer>
</div>
<div class="toast" id="toast"></div>
<script>
var origin = location.origin;
function u(file){ return origin + '/' + file; }
var qxExtra = ', tag=iOS Location Spoofer, update-interval=172800, opt-parser=true, enabled=true';
var PLATS = [
  { name:'Surge', file:'ios-location-spoofer.sgmodule', scheme:function(x){ return 'surge:///install-module?url=' + encodeURIComponent(x); } },
  { name:'Shadowrocket', file:'ios-location-spoofer.sgmodule', scheme:function(x){ return 'shadowrocket://install?module=' + encodeURIComponent(x); } },
  { name:'Egern', file:'ios-location-spoofer.sgmodule', scheme:function(x){ return 'egern:///install-module?url=' + encodeURIComponent(x); } },
  { name:'Loon', file:'ios-location-spoofer.lnplugin', scheme:function(x){ return 'loon://import?plugin=' + encodeURIComponent(x); } },
  { name:'Stash', file:'ios-location-spoofer.stoverride', scheme:function(x){ return 'stash://install-override?url=' + encodeURIComponent(x); } },
  { name:'Quantumult X', file:'ios-location-spoofer.snippet',
    scheme:function(x){ return 'quantumult-x:///add-resource?remote-resource=' + encodeURIComponent(JSON.stringify({ rewrite_remote:[x + qxExtra] })); },
    note:'QX 没有模块面板：一键导入=添加「重写」资源(需已配资源解析器)；MITM 主机名要手动加进 设置→MITM。' }
];

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function toast(m){ var t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 1800); }
function copyText(s){
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s);
  return new Promise(function(res,rej){ try{ var ta=document.createElement('textarea'); ta.value=s; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); var ok=document.execCommand('copy'); document.body.removeChild(ta); ok?res():rej(); }catch(e){ rej(e); } });
}
function doCopy(s, btn){ copyText(s).then(function(){ toast('已复制模块链接'); var o=btn.textContent; btn.classList.add('ok'); btn.textContent='✓'; setTimeout(function(){ btn.textContent=o; btn.classList.remove('ok'); }, 1200); }).catch(function(){ toast('复制失败，请手动选择'); }); }

var html = '';
for (var i=0; i<PLATS.length; i++){
  var p = PLATS[i];
  var url = u(p.file);
  html += '<div class="plat">' +
    '<a class="big" href="' + esc(p.scheme(url)) + '">一键导入 ' + esc(p.name) + '</a>' +
    '<div class="line"><span class="url">' + esc(url) + '</span>' +
    '<button class="copy" data-url="' + esc(url) + '">复制</button></div>' +
    (p.note ? '<div class="pnote">' + esc(p.note) + '</div>' : '') +
    '</div>';
}
document.getElementById('plats').innerHTML = html;
var btns = document.querySelectorAll('.copy');
for (var j=0; j<btns.length; j++){ (function(b){ b.addEventListener('click', function(){ doCopy(b.getAttribute('data-url'), b); }); })(btns[j]); }
<\/script>
</body>
</html>`;
}
