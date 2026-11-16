import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: false,
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-gpu-watchdog",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) {
    logs.push(m.text());
    console.log(m.type(), m.text());
  }
});
page.on("pageerror", (e) => {
  logs.push(String(e));
  console.log(e);
});
try {
  await page.goto(process.env.QA_URL ?? "http://127.0.0.1:4173/?qa=1&tier=low");
  await page.waitForFunction(() => window.__AETHER__, null, { timeout: 60000 });
  await page.evaluate(() => window.__AETHER__.ready);
  await page.evaluate(
    (p) => window.__AETHER__.setProgress(p),
    Number(process.argv[3] ?? 0),
  );
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: "qa/screenshots/" + (process.argv[2] ?? "current") + ".png",
    timeout: 120000,
  });
  console.log(await page.evaluate(() => window.__AETHER__.getInfo()));
} finally {
  await writeFile("qa/milestone-errors.json", JSON.stringify(logs, null, 2));
  await browser.close();
}
