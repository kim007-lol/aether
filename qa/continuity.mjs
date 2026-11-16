import { chromium } from "playwright";
import { Quaternion, Euler, Vector3 } from "three";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: false,
  args: ["--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const samples = [],
  issues = [];
page.on("pageerror", (e) => issues.push(String(e)));
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) issues.push(m.text());
});
await mkdir("qa/screenshots/continuity", { recursive: true });
try {
  await page.goto("http://127.0.0.1:4173/?qa=1&tier=low");
  await page.waitForFunction(() => window.__AETHER__);
  await page.evaluate(() => window.__AETHER__.ready);
  for (let i = 0; i <= 200; i++) {
    const p = i / 200;
    await page.bringToFront();
    const old = await page.evaluate(() => window.__AETHER__.getInfo().frame);
    await page.evaluate((p) => window.__AETHER__.setProgress(p), p);
    await page.waitForFunction(
      (f) => window.__AETHER__.getInfo().frame > f + 1,
      old,
    );
    const state = await page.evaluate(() => window.__AETHER__.getState());
    samples.push({
      progress: p,
      position: state.cameraPosition,
      rotation: state.cameraRotation.slice(0, 3),
    });
    if (i % 5 === 0) {
      await page.screenshot({
        path: "qa/screenshots/continuity/p" + p + ".png",
        timeout: 90000,
      });
      console.log("Captured", p);
    }
  }
} finally {
  await browser.close();
}
let maxPosition = 0,
  maxRotation = 0;
for (let i = 1; i < samples.length; i++) {
  const a = samples[i - 1],
    b = samples[i];
  maxPosition = Math.max(
    maxPosition,
    new Vector3(...a.position).distanceTo(new Vector3(...b.position)),
  );
  maxRotation = Math.max(
    maxRotation,
    new Quaternion()
      .setFromEuler(new Euler(...a.rotation))
      .angleTo(new Quaternion().setFromEuler(new Euler(...b.rotation))),
  );
}
await writeFile(
  "qa/continuity-report.json",
  JSON.stringify(
    {
      samples,
      maxPositionStep: maxPosition,
      maxRotationRadians: maxRotation,
      issues,
      method:
        "201 progress samples at.005,41frames captured at.025; visible UI and camera motion reviewed fromcontact sheets; spatialstep magnitudes are descriptive, notproof ofallpossibleframes.",
    },
    null,
    2,
  ),
);
console.log({ maxPosition, maxRotation, issues });
if (issues.length) process.exitCode = 1;
