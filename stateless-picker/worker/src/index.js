import { Hono } from "hono/tiny";
import { getPageHtml, getSetLocationHtml } from "./page.js";
import { getLandingHtml } from "./landing.js";
import { parseCoords, toWgs84, gcj02ToWgs84, round6, fetchAltitude } from "./parse.js";
import { ICON_180_B64, ICON_512_B64, b64ToBytes } from "./icons.js";
import { LOCATION_SPOOFER_B64, LOCATION_SETTINGS_B64, LOCATION_SPOOFER_QX_B64 } from "./modules.js";

const app = new Hono();

app.get("/", (c) => {
  c.header("Cache-Control", "no-cache");
  return c.html(getLandingHtml());
});
app.get("/picker", (c) => {
  c.header("Cache-Control", "no-cache");
  return c.html(getPageHtml());
});

/* ---- PWA: manifest + icons (enables "Add to Home Screen") ---- */
const MANIFEST = {
  name: "iOS Location Spoofer",
  short_name: "iOSLoc",
  description: "Stateless map picker for iOS Location Spoofer (WGS-84 + altitude).",
  start_url: "/picker",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#f2f2f7",
  theme_color: "#007aff",
  icons: [
    { src: "/icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
const IMG_CACHE = "public, max-age=604800, immutable";
app.get("/manifest.webmanifest", (c) =>
  c.body(JSON.stringify(MANIFEST), 200, { "Content-Type": "application/manifest+json", "Cache-Control": IMG_CACHE })
);
app.get("/icon-180.png", (c) => c.body(b64ToBytes(ICON_180_B64), 200, { "Content-Type": "image/png", "Cache-Control": IMG_CACHE }));
app.get("/icon-512.png", (c) => c.body(b64ToBytes(ICON_512_B64), 200, { "Content-Type": "image/png", "Cache-Control": IMG_CACHE }));
app.get("/favicon.ico", (c) => c.body("", 204));

/* ---- Self-hosted on-device module ----
   Serve the two module scripts + a subscribable manifest so the whole stateless
   setup runs from this worker with NO GitHub dependency. The manifest self-references
   whatever domain served it (workers.dev URL or a custom domain). */
const JS_HEADERS = { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600" };
app.get("/location-spoofer.js", (c) => c.body(b64ToBytes(LOCATION_SPOOFER_B64), 200, JS_HEADERS));
app.get("/location-settings.js", (c) => c.body(b64ToBytes(LOCATION_SETTINGS_B64), 200, JS_HEADERS));
app.get("/location-spoofer-qx.js", (c) => c.body(b64ToBytes(LOCATION_SPOOFER_QX_B64), 200, JS_HEADERS));

function sgmodule(origin) {
  return String.raw`#!name=iOS Location Spoofer (Stateless)
#!desc=无状态版：坐标写入每台设备各自的本机存储、可公开共用、多人互不覆盖。搭配网页端使用。适用于 Shadowrocket / Surge / Egern。
#!homepage=${origin}

[Script]
iOS Location Spoofer = type=http-response,pattern=^https?:\/\/(?:gs-loc(?:-cn)?\.apple\.com|bluedot\.is\.autonavi\.com(?:\.gds\.alibabadns\.com)?)\/clls\/wloc(?:\?.*)?$,requires-body=1,binary-body-mode=1,max-size=1048576,timeout=10,script-path=${origin}/location-spoofer.js,argument=mode=response&debug=false
iLS Settings = type=http-request,pattern=^https?:\/\/gs-loc(?:-cn)?\.apple\.com\/ils-settings\/,requires-body=0,max-size=0,timeout=10,script-path=${origin}/location-settings.js

[MITM]
hostname = %APPEND% gs-loc.apple.com, gs-loc-cn.apple.com, bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com`;
}
function stoverride(origin) {
  return String.raw`name: iOS Location Spoofer (Stateless)
desc: "iOS Location Spoofer 无状态版 (Stash)"
homepage: ${origin}

http:
  mitm:
    - "gs-loc.apple.com"
    - "gs-loc-cn.apple.com"
  script:
    - match: ^https?:\/\/gs-loc(-cn)?\.apple\.com\/clls\/wloc
      name: ios-location-spoofer
      type: response
      require-body: true
      binary-mode: true
      max-size: 0
      timeout: 30
      argument: mode=response&debug=false
    - match: ^https?:\/\/gs-loc(-cn)?\.apple\.com\/ils-settings\/
      name: ios-location-settings
      type: request
      require-body: false
      timeout: 10

script-providers:
  ios-location-spoofer:
    url: ${origin}/location-spoofer.js
    interval: 86400
  ios-location-settings:
    url: ${origin}/location-settings.js
    interval: 86400`;
}
function lnplugin(origin) {
  return String.raw`#!name=iOS Location Spoofer (Stateless)
#!desc=无状态版，配合网页端使用。Loon 插件。
#!homepage=${origin}

[Script]
http-response ^https?:\/\/(?:gs-loc(?:-cn)?\.apple\.com|bluedot\.is\.autonavi\.com(?:\.gds\.alibabadns\.com)?)\/clls\/wloc(?:\?.*)?$ script-path=${origin}/location-spoofer.js, requires-body=true, binary-body-mode=true, max-size=1048576, timeout=12, tag=iOS Location Spoofer, argument=mode=response&debug=false
http-request ^https?:\/\/gs-loc(?:-cn)?\.apple\.com\/ils-settings\/ script-path=${origin}/location-settings.js, requires-body=false, timeout=10, tag=iLS Settings

[MITM]
hostname = gs-loc.apple.com, gs-loc-cn.apple.com, bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com`;
}
// Quantumult X has NO module/plugin system — it uses a "rewrite" reference. QX also does
// not auto-merge MITM hostnames the way Surge modules do, so the user must add them manually.
function qxsnippet(origin) {
  return String.raw`#!name=iOS Location Spoofer (Stateless)
#!desc=无状态版。Quantumult X 用「重写(rewrite)引用」(非模块/插件)。MITM 主机名需手动加进 QX 设置 → MITM。
#!homepage=${origin}

[rewrite_local]
^https?:\/\/(?:gs-loc(?:-cn)?\.apple\.com|bluedot\.is\.autonavi\.com(?:\.gds\.alibabadns\.com)?)\/clls\/wloc(?:\?.*)?$ url script-response-body ${origin}/location-spoofer-qx.js
^https?:\/\/gs-loc(?:-cn)?\.apple\.com\/ils-settings\/ url script-echo-response ${origin}/location-settings.js

[mitm]
hostname = gs-loc.apple.com, gs-loc-cn.apple.com, bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com`;
}
const TXT = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" };
app.get("/ios-location-spoofer.sgmodule", (c) => c.body(sgmodule(new URL(c.req.url).origin), 200, TXT));
app.get("/ios-location-spoofer.stoverride", (c) => c.body(stoverride(new URL(c.req.url).origin), 200, TXT));
app.get("/ios-location-spoofer.lnplugin", (c) => c.body(lnplugin(new URL(c.req.url).origin), 200, TXT));
app.get("/ios-location-spoofer.snippet", (c) => c.body(qxsnippet(new URL(c.req.url).origin), 200, TXT));

// Helper to resolve coordinates, elevation, and build the saveUrl for device writing
async function resolveLocationParams(c) {
  const raw = c.req.query("u") || "";
  const cs = (c.req.query("cs") || "").toLowerCase();
  const qLat = c.req.query("lat");
  const qLon = c.req.query("lon");
  const qAlt = c.req.query("alt");
  const qHacc = c.req.query("hacc");
  const qVacc = c.req.query("vacc");
  const qRr = c.req.query("rr") || c.req.query("randomRadius");

  if (!raw && (!qLat || !qLon)) {
    return { empty: true };
  }

  let lat, lon, name = "", src = "text";
  if (raw) {
    const parsed = await parseCoords(raw);
    lat = parsed.lat;
    lon = parsed.lon;
    name = parsed.name || "";
    src = parsed.src;
    if (cs === "none") {
      // leave coordinates untouched
    } else if (cs === "bd09" || cs === "baidu") {
      ({ lat, lon } = toWgs84(lat, lon, "baidu"));
    } else if (cs === "gcj") {
      ({ lat, lon } = gcj02ToWgs84(lat, lon));
    } else {
      ({ lat, lon } = toWgs84(lat, lon, src));
    }
  } else {
    lat = parseFloat(qLat);
    lon = parseFloat(qLon);
    name = c.req.query("name") || "";
  }

  lat = round6(lat);
  lon = round6(lon);

  let alt = null;
  if (qAlt !== undefined && qAlt !== null && qAlt !== "") {
    alt = Math.round(Number(qAlt));
  } else {
    alt = await fetchAltitude(lat, lon);
  }

  const hacc = qHacc ? Math.round(Number(qHacc)) : 39;
  const vacc = qVacc ? Math.round(Number(qVacc)) : 1000;
  const rr = (qRr !== null && qRr !== undefined && qRr !== "" && !isNaN(Number(qRr))) ? Math.round(Number(qRr)) : null;

  let saveUrl = `https://gs-loc.apple.com/ils-settings/save?lat=${lat}&lon=${lon}`;
  if (alt !== null && alt !== undefined && !isNaN(alt)) saveUrl += `&alt=${alt}`;
  if (hacc !== null && !isNaN(hacc)) saveUrl += `&hacc=${hacc}`;
  if (vacc !== null && !isNaN(vacc)) saveUrl += `&vacc=${vacc}`;
  if (rr !== null && !isNaN(rr)) saveUrl += `&randomRadius=${rr}`;

  return { success: true, name, lat, lon, alt, hacc, vacc, rr, saveUrl, u: raw };
}

// One-Click Set Route:
// GET /set?u=<map-link>
//   - Default with `u`: returns JSON payload with lat, lon, name, alt, save_url
//   - If format=html: returns visual web UI
//   - If redirect=1 / set=1: 302 redirects directly to gs-loc.apple.com/ils-settings/save
//   - If no params: returns the visual input page
app.get("/set", async (c) => {
  c.header("Cache-Control", "no-cache");
  c.header("Access-Control-Allow-Origin", "*");
  const fmt = (c.req.query("format") || "").toLowerCase();
  const doRedirect = c.req.query("redirect") === "1" || c.req.query("set") === "1";

  try {
    const loc = await resolveLocationParams(c);
    if (loc.empty) {
      return c.html(getSetLocationHtml({}));
    }
    if (doRedirect) {
      return c.redirect(loc.saveUrl, 302);
    }
    if (fmt === "html") {
      return c.html(getSetLocationHtml(loc));
    }
    return c.json({
      lat: loc.lat,
      lon: loc.lon,
      name: loc.name,
      alt: loc.alt,
      hacc: loc.hacc,
      vacc: loc.vacc,
      save_url: loc.saveUrl,
      success: true,
    });
  } catch (e) {
    const errMsg = String(e && e.message ? e.message : e);
    if (fmt === "html") return c.html(getSetLocationHtml({ error: errMsg, u: c.req.query("u") || "" }), 422);
    return c.json({ error: errMsg }, 422);
  }
});

// API One-Click Set:
// GET /api/set?u=<map-link>
//   - Default: 302 Redirect to gs-loc.apple.com/ils-settings/save (iOS Shortcuts "Get Contents of URL" saves directly in 1 step!)
//   - format=json: returns JSON coordinates + save_url
//   - format=html: returns visual web UI
app.get("/api/set", async (c) => {
  c.header("Cache-Control", "no-cache");
  c.header("Access-Control-Allow-Origin", "*");
  const fmt = (c.req.query("format") || "").toLowerCase();

  try {
    const loc = await resolveLocationParams(c);
    if (loc.empty) {
      if (fmt === "json") return c.json({ error: "缺少 u 或 lat/lon 参数" }, 400);
      return c.redirect("/set", 302);
    }
    if (fmt === "json") {
      return c.json({
        success: true,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        alt: loc.alt,
        hacc: loc.hacc,
        vacc: loc.vacc,
        save_url: loc.saveUrl,
      });
    }
    if (fmt === "html") {
      return c.html(getSetLocationHtml(loc));
    }
    return c.redirect(loc.saveUrl, 302);
  } catch (e) {
    const errMsg = String(e && e.message ? e.message : e);
    if (fmt === "html") return c.html(getSetLocationHtml({ error: errMsg, u: c.req.query("u") || "" }), 422);
    return c.json({ error: errMsg }, 422);
  }
});

// Enhanced Map link parsing:
// GET /api/parse?u=<link>&format=json&set=<1|0>
//   - Backward compatible: format=json returns {lat, lon, name, alt, save_url}
//   - set=1 / redirect=1: 302 redirects directly to save_url
app.get("/api/parse", async (c) => {
  c.header("Cache-Control", "no-cache");
  c.header("Access-Control-Allow-Origin", "*");
  const fmt = (c.req.query("format") || "").toLowerCase();
  const doSet = c.req.query("set") === "1" || c.req.query("redirect") === "1";

  try {
    const loc = await resolveLocationParams(c);
    if (loc.empty) {
      return c.json({ error: "空输入" }, 400);
    }
    if (doSet) {
      return c.redirect(loc.saveUrl, 302);
    }
    if (fmt === "json") {
      return c.json({
        success: true,
        lat: loc.lat,
        lon: loc.lon,
        name: loc.name,
        alt: loc.alt,
        hacc: loc.hacc,
        vacc: loc.vacc,
        save_url: loc.saveUrl,
      });
    }
    return c.text(`lat=${loc.lat}&lon=${loc.lon}`);
  } catch (e) {
    return c.json({ error: String(e && e.message ? e.message : e) }, 422);
  }
});

/* ---- Telegram bot webhook: a user sends /link (or /start) → the bot replies with the homepage link.
   One-time setup:
     1) @BotFather → 你的 bot → 拿 API token
     2) 终端:  wrangler secret put TG_BOT_TOKEN            (粘贴 token)
     3) (可选) wrangler secret put TG_WEBHOOK_SECRET       (任意随机串，防伪造)
     4) 注册回调:  curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<origin>/tg&secret_token=<SECRET>"
     5) @BotFather → /setprivacy → 选该 bot → Disable      (这样它才能读到群里的 /link)
   Token 只存在 Cloudflare Secret 里，不写进代码。未配置时本路由静默返回 ok，不影响其它功能。 */
app.post("/tg", async (c) => {
  const secret = c.env && c.env.TG_WEBHOOK_SECRET;
  if (secret && c.req.header("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    return c.text("forbidden", 403);
  }
  const token = c.env && c.env.TG_BOT_TOKEN;
  let update = null;
  try { update = await c.req.json(); } catch (e) { }
  const msg = update && (update.message || update.channel_post);
  const text = (msg && msg.text) || "";
  const chatId = msg && msg.chat && msg.chat.id;
  // Match /link, /links, /start — tolerate the /link@BotName form Telegram uses in groups.
  const cmd = text.trim().split(/\s+/)[0].split("@")[0].toLowerCase();
  if (token && chatId && (cmd === "/link" || cmd === "/links" || cmd === "/start")) {
    const origin = new URL(c.req.url).origin;
    const reply = "📍 iOS Location\n" + origin + "/";
    await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply, disable_web_page_preview: false }),
    });
  }
  return c.text("ok", 200);
});

app.onError((e, c) => {
  console.error(`${e}`);
  return c.text(`${e}`, 500);
});

export default {
  async fetch(request, env, ctx) {
    let pathname = "/";
    try { pathname = new URL(request.url).pathname; } catch (e) { }
    // Lightweight access log — stream it live with `wrangler tail` to spot resale / abuse.
    // (No IP logged; edge-cached static fetches won't appear here, but page loads will.)
    try {
      console.log("REQ " + JSON.stringify({
        path: pathname,
        ref: request.headers.get("referer") || "",
        ua: (request.headers.get("user-agent") || "").slice(0, 90),
      }));
    } catch (e) { }
    return app.fetch(request, env, ctx);
  },
};
