import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const url = process.env.QA_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({
  headless: false,
  args: ["--ignore-gpu-blocklist", "--disable-gpu-watchdog"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = {
  gpu: "",
  software: false,
  console: [],
  errors: [],
  tiers: [],
  fps: [],
};
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) report.console.push(m.text());
});
page.on("pageerror", (e) => report.errors.push(String(e)));
try {
  await page.goto(url + "/?qa=1&tier=medium");
  await page.waitForFunction(() => window.__AETHER__, null, {
    timeout: 120000,
  });
  await page.evaluate(() => window.__AETHER__.ready);
  let info = await page.evaluate(() => window.__AETHER__.getInfo());
  report.gpu = info.gpu;
  report.software = /swiftshader|software|llvmpipe/i.test(info.gpu);
  console.log("GPU:", info.gpu);
  for (const tier of ["medium", "high"]) {
    await page.evaluate((t) => window.__AETHER__.setTier(t), tier);
    for (const p of [
      0, 0.08, 0.16, 0.25, 0.34, 0.43, 0.52, 0.64, 0.78, 0.9, 1,
    ]) {
      await page.bringToFront();
      let frameBefore = await page.evaluate(
        () => window.__AETHER__.getInfo().frame,
      );
      await page.evaluate((p) => window.__AETHER__.setProgress(p), p);
      await page.waitForFunction(
        (f) => window.__AETHER__.getInfo().frame > f,
        frameBefore,
        { timeout: 30000 },
      );
      await page.waitForTimeout(1200);
      info = await page.evaluate(() => window.__AETHER__.getInfo());
      report.tiers.push({
        ...info,
        pass:
          info.calls <= 120 &&
          info.triangles <= (tier === "medium" ? 3000000 : 6000000),
      });
      console.log(tier, p, info.calls, info.triangles);
    }
  }
  for (const p of [0, 0.25, 0.43, 0.64, 0.78, 1]) {
    await page.evaluate((p) => window.__AETHER__.setProgress(p), p);
    await page.waitForTimeout(6000);
    info = await page.evaluate(() => window.__AETHER__.getInfo());
    report.fps.push(info);
    console.log("FPS", info.chapter, info.fps.toFixed(1));
  }
  await page.evaluate(() => window.__AETHER__.setProgress(0.43));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "qa/screenshots/high-rings.png",
    timeout: 90000,
  });
} catch (e) {
  report.errors.push(String(e));
  console.error(e);
} finally {
  await writeFile(
    "qa/supplemental-report.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (
  report.errors.length ||
  report.console.length ||
  report.tiers.some((t) => !t.pass)
)
  process.exitCode = 1;
