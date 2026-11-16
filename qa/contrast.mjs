import { chromium } from "playwright";
import pngjs from "pngjs";
import { writeFile } from "node:fs/promises";
const { PNG } = pngjs;
const browser = await chromium.launch({
  headless: false,
  args: ["--ignore-gpu-blocklist"],
});
const results = [];
const linear = (x) => {
  x /= 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const luminance = (r, g, b) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto("http://127.0.0.1:4173/?qa=1&tier=low");
    await page.waitForFunction(() => window.__AETHER__);
    await page.evaluate(() => window.__AETHER__.ready);
    for (const p of [0, 0.08, 0.25, 0.43, 0.64, 0.78, 1]) {
      await page.bringToFront();
      await page.evaluate((p) => window.__AETHER__.setProgress(p), p);
      await page.waitForTimeout(1700);
      const elements = await page.evaluate(() => {
        const selector =
          window.__AETHER__.getInfo().progress < 0.03
            ? "#hero .eyebrow,#hero h1,#hero .hero-subtitle"
            : ".chapter-copy.is-active .chapter-label,.chapter-copy.is-active h2,.chapter-copy.is-active .chapter-body";
        return [...document.querySelectorAll(selector)].map((e) => ({
          text: e.textContent.trim(),
          color: getComputedStyle(e).color,
          rect: e.getBoundingClientRect().toJSON(),
        }));
      });
      const style = await page.addStyleTag({
        content:
          "#hero *, .chapter-copy * {color:transparent!important;text-shadow:none!important;}",
      });
      const bytes = await page.screenshot({ timeout: 90000 });
      await style.evaluate((e) => e.remove());
      const image = PNG.sync.read(bytes);
      for (const el of elements) {
        const fg = el.color.match(/[\d.]+/g).map(Number),
          fl = luminance(...fg);
        let min = 100;
        let brightest = 0;
        const rect = el.rect;
        for (
          let y = Math.max(0, Math.ceil(rect.y));
          y < Math.min(image.height, rect.bottom);
          y++
        )
          for (
            let x = Math.max(0, Math.ceil(rect.x));
            x < Math.min(image.width, rect.right);
            x++
          ) {
            const i = (y * image.width + x) * 4;
            const bg = luminance(
              image.data[i],
              image.data[i + 1],
              image.data[i + 2],
            );
            const ratio = (Math.max(fl, bg) + 0.05) / (Math.min(fl, bg) + 0.05);
            min = Math.min(min, ratio);
            brightest = Math.max(bg, brightest);
          }
        results.push({
          viewport,
          progress: p,
          text: el.text,
          worstRectangleContrast: +min.toFixed(2),
          brightestBackgroundLuminance: brightest,
          pass: min >= 4.5,
        });
      }
      console.log(
        viewport.width,
        p,
        results.slice(-elements.length).map((r) => r.worstRectangleContrast),
      );
    }
    await page.close();
  }
} finally {
  await writeFile(
    "qa/contrast-report.json",
    JSON.stringify(
      {
        method:
          "Foreground hidden while preserving local scrim; minimum WCAG ratio over entire DOM text rectangles (including spaces), conservative single-frame evidence. Does not guarantee all animated frames.",
        results,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
if (results.some((r) => !r.pass)) process.exitCode = 1;
