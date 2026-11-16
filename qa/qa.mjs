import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import pngjs from "pngjs";

const { PNG } = pngjs;
const URL_BASE = process.env.QA_URL ?? "http://127.0.0.1:4173";
const ITERATION = process.env.QA_ITERATION ?? "final";
const FAST = process.env.QA_FAST === "1";
const SOFTWARE = process.env.QA_SOFTWARE === "1";
const SCREEN_DIR =
  ITERATION === "final"
    ? "qa/screenshots"
    : "qa/screenshots/iteration" + ITERATION;
const REPORT_PATH =
  ITERATION === "final"
    ? "qa/report.json"
    : "qa/report-iteration" + ITERATION + ".json";
const POSITIONS = [0, 0.08, 0.16, 0.25, 0.34, 0.43, 0.52, 0.64, 0.78, 0.9, 1];
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const report = {
  generatedAt: new Date().toISOString(),
  iteration: ITERATION,
  url: URL_BASE,
  rendering: SOFTWARE
    ? "Chromium ANGLE SwiftShader software; FPS is not real-GPU performance"
    : "Chromium hardware request; actual renderer recorded in every sample",
  fullSuite: !FAST,
  samples: [],
  checks: [],
  console: [],
  externalRequests: [],
  pageErrors: [],
  navigation: [],
  memoryLoops: [],
  fpsSummary: {},
};
await mkdir(SCREEN_DIR, { recursive: true });
const browser = await chromium.launch({
  headless: process.env.QA_HEADLESS === "1",
  args: [
    ...(SOFTWARE
      ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
      : []),
    "--ignore-gpu-blocklist",
    "--disable-gpu-watchdog",
  ],
});

function pixelStats(bytes) {
  const png = PNG.sync.read(bytes);
  let total = 0,
    squared = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const value =
      0.2126 * png.data[i] +
      0.7152 * png.data[i + 1] +
      0.0722 * png.data[i + 2];
    total += value;
    squared += value * value;
  }
  const count = png.width * png.height,
    mean = total / count;
  return {
    mean: +mean.toFixed(3),
    standardDeviation: +Math.sqrt(squared / count - mean * mean).toFixed(3),
  };
}
async function check(name, operation, pageLabel = "desktop") {
  try {
    const evidence = await operation();
    report.checks.push({ name, page: pageLabel, status: "PASS", evidence });
    console.log("PASS " + pageLabel + ": " + name);
  } catch (error) {
    report.checks.push({
      name,
      page: pageLabel,
      status: "FAIL",
      error: String(error?.stack ?? error),
    });
    console.log("FAIL " + pageLabel + ": " + name + ": " + error.message);
  }
}
async function instrument(page, label) {
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error")
      report.console.push({
        page: label,
        type: message.type(),
        text: message.text(),
      });
  });
  page.on("pageerror", (error) =>
    report.pageErrors.push({ page: label, text: error.message }),
  );
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== new URL(URL_BASE).origin
    )
      report.externalRequests.push({ page: label, url: url.href });
  });
  await page.addInitScript(() => {
    window.__qaMetrics = {
      loader: {
        counts: [],
        status: "",
        wordmark: "",
        removedAt: null,
        loadedAt: null,
      },
      longTasks: [],
      cls: 0,
    };
    const observe = () => {
      const loader = document.querySelector("#loader");
      const metrics = window.__qaMetrics.loader;
      if (loader) {
        metrics.status =
          loader.querySelector(".loader-status")?.textContent?.trim() ?? "";
        metrics.wordmark =
          loader.querySelector(".loader-wordmark")?.textContent?.trim() ?? "";
        const counter = loader
          .querySelector(".loader-count")
          ?.textContent?.trim();
        if (counter && metrics.counts.at(-1) !== counter)
          metrics.counts.push(counter);
        if (
          loader.getAttribute("data-loaded") === "true" &&
          metrics.loadedAt === null
        )
          metrics.loadedAt = performance.now();
      } else if (metrics.counts.length && metrics.removedAt === null)
        metrics.removedAt = performance.now();
    };
    new MutationObserver(observe).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-loaded"],
    });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.__qaMetrics.longTasks.push({
            start: entry.startTime,
            duration: entry.duration,
          });
      }).observe({ type: "longtask", buffered: true });
    } catch {
      /* Optional Performance API. */
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__qaMetrics.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      /* Optional Performance API. */
    }
  });
}
async function openReady(page, label, query = "?qa=1&tier=low") {
  const started = Date.now();
  await page.goto(URL_BASE + "/" + query, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForFunction(() => Boolean(window.__AETHER__), null, {
    timeout: 120000,
  });
  await page.waitForFunction(() => !document.querySelector("#loader"), null, {
    timeout: 120000,
  });
  await page.evaluate(() => window.__AETHER__.ready);
  report.navigation.push({ page: label, milliseconds: Date.now() - started });
}
async function setProgress(page, progress, delay = 1500) {
  await page.bringToFront();
  const previousFrame = await page.evaluate(
    () => window.__AETHER__.getInfo().frame,
  );
  await page.evaluate((p) => window.__AETHER__.setProgress(p), progress);
  if (delay) await page.waitForTimeout(delay);
  await page.waitForFunction(
    (f) => window.__AETHER__.getInfo().frame > f,
    previousFrame,
    { timeout: 30000 },
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function capture(page, progress, viewport) {
  const name =
    "p" + progress + "-" + viewport.width + "x" + viewport.height + ".png";
  const bytes = await page.screenshot({
    path: SCREEN_DIR + "/" + name,
    timeout: 90000,
  });
  const pixels = pixelStats(bytes);
  const info = await page.evaluate(() => window.__AETHER__.getInfo());
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    canvas: document.querySelector("canvas")?.getBoundingClientRect().toJSON(),
  }));
  const sample = {
    progress,
    viewport,
    screenshot: SCREEN_DIR + "/" + name,
    pixels,
    ...info,
    layout,
  };
  report.samples.push(sample);
  assert(
    pixels.mean > 3 && pixels.mean < 230,
    "Screenshot mean luminance out of range: " + pixels.mean,
  );
  assert(pixels.standardDeviation > 2, "Screenshot nearly blank");
  assert(info.calls <= 120, "Draw calls exceed120: " + info.calls);
  assert(
    info.triangles <=
      (info.tier === "high" || info.tier === "ultra" ? 6000000 : 3000000),
    "Triangle budget exceeded: " + info.triangles,
  );
  assert(layout.scrollWidth <= layout.width + 1, "Horizontal overflow");
  return {
    screenshot: sample.screenshot,
    pixels,
    calls: info.calls,
    triangles: info.triangles,
  };
}
async function keyboardTest(page) {
  await setProgress(page, 0, 100);
  await page.evaluate(() => document.activeElement?.blur());
  const cases = [
    ["ArrowDown", 0.25],
    ["PageDown", 0.43],
    ["Space", 0.64],
    ["ArrowUp", 0.43],
    ["PageUp", 0.25],
    ["End", 1],
    ["Home", 0],
  ];
  const measured = [];
  for (const [key, expected] of cases) {
    await page.keyboard.press(key);
    await page.waitForFunction(
      (p) => Math.abs(window.__AETHER__.getState().target - p) < 0.018,
      expected,
      { timeout: 10000 },
    );
    const state = await page.evaluate(() => window.__AETHER__.getState());
    measured.push({ key, expected, actual: state.target });
  }
  return measured;
}
async function semanticTest(page) {
  const result = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("main section")];
    const focusables = [
      ...document.querySelectorAll('a[href],button,[tabindex="0"]'),
    ];
    const buttons = [...document.querySelectorAll("button")].filter(
      (button) => button.getBoundingClientRect().width > 0,
    );
    return {
      header: Boolean(document.querySelector("header")),
      sections: sections.length,
      labelled: sections.every((section) =>
        Boolean(
          document.getElementById(
            section.getAttribute("aria-labelledby") ?? "",
          ),
        ),
      ),
      nav: Boolean(document.querySelector('nav[aria-label="Chapters"]')),
      firstFocusable: focusables[0]?.textContent?.trim(),
      live: Boolean(document.querySelector('[aria-live="polite"]')),
      canvasHidden: document
        .querySelector("canvas")
        ?.getAttribute("aria-hidden"),
      buttons: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          name: button.getAttribute("aria-label") ?? button.textContent?.trim(),
          width: rect.width,
          height: rect.height,
        };
      }),
    };
  });
  assert(
    result.header &&
      result.sections === 6 &&
      result.labelled &&
      result.nav &&
      result.live,
  );
  assert.equal(result.firstFocusable, "Skip to content");
  assert.equal(result.canvasHidden, "true");
  assert(
    result.buttons.every(
      (button) => button.name && button.width >= 43.9 && button.height >= 43.9,
    ),
  );
  await page.keyboard.press("Tab");
  const outline = await page.locator(":focus").evaluate((element) => ({
    width: getComputedStyle(element).outlineWidth,
    style: getComputedStyle(element).outlineStyle,
  }));
  assert(parseFloat(outline.width) >= 2 && outline.style !== "none");
  return { ...result, outline };
}
async function desktopFeatures(page, context) {
  await check("keyboard navigation all seven keys", () => keyboardTest(page));
  await check("semantic labels, skip link, target sizes and focus", () =>
    semanticTest(page),
  );
  await check("pointer parallax and desktop cursor", async () => {
    await page.bringToFront();
    await page.mouse.move(720, 450);
    await page.mouse.move(1300, 200, { steps: 8 });
    await page.waitForFunction(
      () => {
        const p = window.__AETHER__.getState().pointer;
        return p[0] > 0.3 && p[1] > 0.2;
      },
      null,
      { timeout: 10000 },
    );
    const state = await page.evaluate(() => ({
      state: window.__AETHER__.getState(),
      cursor: document.body.classList.contains("cursor-active"),
      opacity: getComputedStyle(document.querySelector(".cursor-dot")).opacity,
    }));
    assert(
      state.state.pointer[0] > 0.3 &&
        state.state.pointer[1] > 0.2 &&
        state.cursor &&
        Number(state.opacity) > 0,
      JSON.stringify(state),
    );
    return state;
  });
  await check(
    "sound off by default, toggle and persistence without autoplay",
    async () => {
      assert.equal(
        (await page.evaluate(() => window.__AETHER__.getState())).audio,
        false,
      );
      await page.locator("#sound-toggle").click();
      await page.waitForFunction(() => window.__AETHER__.getState().audio);
      assert.equal(
        await page.evaluate(() => localStorage.getItem("aether-sound")),
        "on",
      );
      const extra = await context.newPage();
      await instrument(extra, "audio-reload");
      await openReady(extra, "audio-reload");
      const restored = await extra.evaluate(() => window.__AETHER__.getState());
      assert(restored.audioPreferred && !restored.audio);
      await extra.close();
      await page.locator("#sound-toggle").click();
      assert.equal(
        await page.evaluate(() => localStorage.getItem("aether-sound")),
        "off",
      );
      return restored;
    },
  );
  await check("Core shockwave on click", async () => {
    await setProgress(page, 1);
    const before = await page.evaluate(
      () => window.__AETHER__.getState().shockwaves,
    );
    await page.mouse.click(1040, 410);
    await page.waitForTimeout(150);
    await page.screenshot({
      path: SCREEN_DIR + "/core-click.png",
      timeout: 90000,
    });
    const after = await page.evaluate(
      () => window.__AETHER__.getState().shockwaves,
    );
    assert.equal(after, before + 1);
    return { before, after };
  });
  await check("Begin again and Replay the descent", async () => {
    await setProgress(page, 1);
    await page
      .getByRole("button", { name: "Begin again", exact: true })
      .click();
    await page.waitForFunction(
      () => window.__AETHER__.getState().target < 0.01,
      null,
      { timeout: 10000 },
    );
    await setProgress(page, 1);
    await page
      .getByRole("button", { name: "Replay the descent", exact: true })
      .click();
    await page.waitForTimeout(2500);
    const early = await page.evaluate(
      () => window.__AETHER__.getState().target,
    );
    assert(
      early > 0.01 && early < 0.2,
      "Replay must start and move at40s duration",
    );
    await page.waitForFunction(
      () => window.__AETHER__.getState().target > 0.995,
      null,
      { timeout: 50000 },
    );
    const end = await page.evaluate(() => window.__AETHER__.getState().target);
    return { early, end, durationSeconds: 40 };
  });
  await check(
    "memory remains stable after five full scroll loops",
    async () => {
      await setProgress(page, 0, 100);
      const initial = await page.evaluate(() => window.__AETHER__.getInfo());
      for (let loop = 0; loop < 5; loop++) {
        for (const p of [...POSITIONS, ...POSITIONS.toReversed()])
          await setProgress(page, p, 0);
        const info = await page.evaluate(() => window.__AETHER__.getInfo());
        report.memoryLoops.push({
          loop: loop + 1,
          geometries: info.geometries,
          textures: info.textures,
        });

        console.log("Memory loop " + (loop + 1) + "/5 complete");
      }
      assert(
        report.memoryLoops.every(
          (info) =>
            info.geometries === initial.geometries &&
            info.textures === initial.textures,
        ),
        "GPU resource counts changed between loops",
      );
      return {
        initial: { geometries: initial.geometries, textures: initial.textures },
        loops: report.memoryLoops,
      };
    },
  );
  await check(
    "automatic quality steps down once under slow frames",
    async () => {
      await page.evaluate(() => {
        window.__AETHER__.setTier("medium");
        window.__AETHER__.setAuto();
        window.__AETHER__.forceSlowFrames(35);
      });
      const before = await page.evaluate(
        () => window.__AETHER__.getState().steps,
      );
      await page.waitForFunction(
        (n) => window.__AETHER__.getState().steps > n,
        before,
        { timeout: 180000, polling: 250 },
      );
      const info = await page.evaluate(() => window.__AETHER__.getInfo());
      const state = await page.evaluate(() => window.__AETHER__.getState());
      assert.equal(info.tier, "low");
      assert.equal(state.steps, before + 1);
      await page.evaluate(() => {
        window.__AETHER__.forceSlowFrames(0);
        window.__AETHER__.setTier("low");
      });
      return { tier: info.tier, steps: state.steps };
    },
  );
  await check("context loss overlay and restoration reload", async () => {
    const origin = await page.evaluate(() => performance.timeOrigin);
    const supported = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2");
      window.__qaLostContext = gl.getExtension("WEBGL_lose_context");
      window.__qaLostContext?.loseContext();
      return Boolean(window.__qaLostContext);
    });
    assert(supported, "WEBGL_lose_context unavailable");
    await page
      .getByRole("alert")
      .filter({ hasText: "Graphics context lost, reloading" })
      .waitFor();
    await page.evaluate(() => window.__qaLostContext.restoreContext());
    await page.waitForFunction(
      (old) => performance.timeOrigin !== old,
      origin,
      { timeout: 30000 },
    );
    await page.waitForFunction(() => Boolean(window.__AETHER__), null, {
      timeout: 120000,
    });
    await page.evaluate(() => window.__AETHER__.ready);
    return { restored: true };
  });
}

try {
  for (const viewport of VIEWPORTS) {
    const mobile = viewport.width < 600,
      label = viewport.width + "x" + viewport.height;
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await instrument(page, label);
    await openReady(page, label);
    await check(
      "loader counter and duration",
      async () => {
        const metrics = await page.evaluate(() => window.__qaMetrics);
        assert.equal(metrics.loader.wordmark, "AETHER");
        assert(
          metrics.loader.status.toLowerCase().includes("calibrating orbit"),
        );
        assert(
          metrics.loader.counts.includes("000") &&
            metrics.loader.counts.includes("100"),
        );
        assert(metrics.loader.removedAt >= 2200);
        return metrics;
      },
      label,
    );
    for (const p of POSITIONS) {
      await setProgress(page, p);
      await check(
        "sample progress " + p,
        () => capture(page, p, viewport),
        label,
      );
    }
    for (const p of POSITIONS.toReversed()) await setProgress(page, p, 80);
    await check(
      "solid mesh path clearance and near-miss gates",
      async () => {
        const info = await page.evaluate(() => window.__AETHER__.getInfo());
        assert(info.minClearance >= 1.5);
        assert(
          info.gates.filter((distance) => distance >= 1.5 && distance <= 3)
            .length >= 6,
        );
        return { minimum: info.minClearance, gates: info.gates };
      },
      label,
    );
    if (!FAST && !mobile) await desktopFeatures(page, context);
    if (!FAST && mobile) {
      await check(
        "native touch swipe scroll",
        async () => {
          await setProgress(page, 0, 100);
          const cdp = await context.newCDPSession(page);
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: 310, y: 680 }],
          });
          for (const y of [600, 520, 440, 360, 280]) {
            await cdp.send("Input.dispatchTouchEvent", {
              type: "touchMove",
              touchPoints: [{ x: 310, y }],
            });
            await page.waitForTimeout(70);
          }
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await page.waitForTimeout(1200);
          const target = await page.evaluate(
            () => window.__AETHER__.getState().target,
          );
          await cdp.detach();
          assert(target > 0.01);
          return { target };
        },
        label,
      );
      await check(
        "custom cursor hidden on touch",
        async () => {
          const data = await page.locator(".cursor-dot").evaluate((el) => ({
            display: getComputedStyle(el).display,
            opacity: getComputedStyle(el).opacity,
          }));
          assert(data.display === "none" || Number(data.opacity) === 0);
          return data;
        },
        label,
      );
      await check(
        "Core shockwave on tap",
        async () => {
          await setProgress(page, 1);
          const before = await page.evaluate(
            () => window.__AETHER__.getState().shockwaves,
          );
          await page.touchscreen.tap(195, 300);
          await page.waitForTimeout(120);
          const after = await page.evaluate(
            () => window.__AETHER__.getState().shockwaves,
          );
          assert(after > before);
          return { before, after };
        },
        label,
      );
      await check(
        "orientation resize and canvas aspect",
        async () => {
          await page.setViewportSize({ width: 844, height: 390 });
          await page.waitForTimeout(1500);
          const data = await page.evaluate(() => {
            const c = document.querySelector("canvas");
            const r = c.getBoundingClientRect();
            return {
              w: r.width,
              h: r.height,
              width: c.width,
              height: c.height,
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
            };
          });
          assert(!data.overflow && data.w === 844 && data.h === 390);
          assert(Math.abs(data.width / data.height - 844 / 390) < 0.01);
          await page.screenshot({
            path: SCREEN_DIR + "/landscape-844x390.png",
            timeout: 90000,
          });
          return data;
        },
        label,
      );
    }
    const metrics = await page.evaluate(() => window.__qaMetrics);
    report.checks.push({
      name: "runtime performance observations",
      page: label,
      status: "MEASURED",
      evidence: {
        cls: metrics.cls,
        longTasksAfterLoader: metrics.longTasks.filter(
          (task) => task.start > metrics.loader.removedAt,
        ),
      },
    });
    await context.close();
  }
  if (!FAST) {
    const reducedContext = await browser.newContext({
      viewport: VIEWPORTS[1],
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await instrument(reducedPage, "reduced-motion");
    await openReady(reducedPage, "reduced-motion");
    await check(
      "reduced motion disables parallax and shockwave",
      async () => {
        await setProgress(reducedPage, 1);
        await reducedPage.mouse.move(300, 200);
        await reducedPage.evaluate(() => window.__AETHER__.shockwave());
        await reducedPage.waitForTimeout(1000);
        const state = await reducedPage.evaluate(() =>
          window.__AETHER__.getState(),
        );
        assert(
          state.reduced &&
            !state.cameraParallaxEnabled &&
            state.shockwaves === 0,
        );
        await reducedPage.screenshot({
          path: SCREEN_DIR + "/reduced-motion.png",
          timeout: 90000,
        });
        return state;
      },
      "reduced-motion",
    );
    await reducedContext.close();
    const fallbackContext = await browser.newContext({
      viewport: VIEWPORTS[1],
    });
    const fallbackPage = await fallbackContext.newPage();
    await instrument(fallbackPage, "fallback");
    await check(
      "forceFallback renders complete designed copy",
      async () => {
        await fallbackPage.goto(URL_BASE + "/?forceFallback=1", {
          waitUntil: "networkidle",
        });
        assert(
          await fallbackPage
            .locator("body")
            .evaluate((el) => el.classList.contains("fallback")),
        );
        assert.equal(await fallbackPage.locator("main section").count(), 6);
        assert.equal(await fallbackPage.locator("canvas").count(), 0);
        assert.equal(await fallbackPage.locator(".fallback-orb").count(), 1);
        const noOverflow = await fallbackPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        );
        assert(noOverflow);
        await fallbackPage.screenshot({
          path: SCREEN_DIR + "/fallback.png",
          fullPage: true,
          timeout: 90000,
        });
        return { sections: 6, noOverflow };
      },
      "fallback",
    );
    await fallbackContext.close();
    const unavailableContext = await browser.newContext({
      viewport: VIEWPORTS[1],
    });
    await unavailableContext.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === "webgl2" ? null : original.call(this, type, ...args);
      };
    });
    const unavailable = await unavailableContext.newPage();
    await instrument(unavailable, "WebGL2-unavailable");
    await check(
      "missing WebGL2 automatically selects fallback",
      async () => {
        await unavailable.goto(URL_BASE + "/", { waitUntil: "networkidle" });
        assert(
          await unavailable
            .locator("body")
            .evaluate((el) => el.classList.contains("fallback")),
        );
        assert.equal(await unavailable.locator("main section").count(), 6);
        return { fallback: true };
      },
      "WebGL2-unavailable",
    );
    await unavailableContext.close();
  }
} catch (error) {
  report.fatal = String(error?.stack ?? error);
  console.error(error);
} finally {
  await browser.close();
  const fps = report.samples.map((sample) => sample.fps);
  report.fpsSummary = fps.length
    ? {
        min: Math.min(...fps),
        max: Math.max(...fps),
        mean: fps.reduce((a, b) => a + b, 0) / fps.length,
      }
    : {};
  report.renderers = [...new Set(report.samples.map((s) => s.gpu))];
  report.softwareRendering = report.renderers.some((s) =>
    /swiftshader|software|llvmpipe/i.test(s),
  );
  report.passed =
    !report.fatal &&
    report.checks.every((check) => check.status !== "FAIL") &&
    report.console.length === 0 &&
    report.pageErrors.length === 0 &&
    report.externalRequests.length === 0 &&
    report.samples.length === 22;
  report.summary = {
    samples: report.samples.length,
    checksPassed: report.checks.filter((check) => check.status === "PASS")
      .length,
    checksFailed: report.checks.filter((check) => check.status === "FAIL")
      .length,
    consoleIssues: report.console.length,
    pageErrors: report.pageErrors.length,
    externalRequests: report.externalRequests.length,
  };
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      { report: REPORT_PATH, passed: report.passed, ...report.summary },
      null,
      2,
    ),
  );
  if (!report.passed) process.exitCode = 1;
}
