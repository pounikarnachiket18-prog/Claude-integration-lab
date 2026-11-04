// render.mjs: renders index.html frame by frame in headless Chromium and encodes the video.
//
//   node render.mjs                 → full film: 840 frames at 60 fps → out/picture.mp4
//   node render.mjs --stills 0,3,9.6 → just a few still frames (PNG) to check the look
//
// Each frame calls window.renderAt(frame / 60), so every frame is exact and repeatable.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright"); // installed globally on this machine
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const FPS = 60, SECONDS = 14, FRAMES = FPS * SECONDS;
fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });

// A tiny local web server (browsers won't load ES modules straight from file://)
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("console", (m) => { if (m.type() === "error") console.error("page:", m.text()); });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://localhost:${port}/index.html?t=0`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

const grab = async (t) => {
  await page.evaluate((tt) => window.renderAt(tt), t);
  return page.locator("canvas").screenshot({ type: "png" });
};

const stillsArg = process.argv.indexOf("--stills");
if (stillsArg > 0) {
  for (const t of process.argv[stillsArg + 1].split(",").map(Number)) {
    fs.writeFileSync(path.join(ROOT, "out", `still_${t.toFixed(2)}.png`), await grab(t));
    console.log("still", t);
  }
} else {
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-movflags", "+faststart", path.join(ROOT, "out", "picture.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const png = await grab(f / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 60 === 0) console.log(`frame ${f}/${FRAMES}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s → out/picture.mp4`);
}
await browser.close();
server.close();
