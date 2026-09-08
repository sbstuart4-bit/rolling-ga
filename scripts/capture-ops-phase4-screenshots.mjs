import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/ops-phase4-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const brooklynEvent = "evt_marisol_brooklyn";

async function signInOps(page) {
  await page.goto(`${base}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', "ops@rollingga.example");
  await page.fill('input[name="password"]', "rollingga");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle", { timeout: 45000 });
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  if (overflow) {
    throw new Error(`Horizontal overflow detected at ${label}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 430, 1440, 1728]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await signInOps(page);

      const shots = [
        { name: "ops-exceptions-summary", url: `${base}/ops/exceptions`, wait: "text=Exception resolution" },
        { name: "ops-exceptions-past-promise", url: `${base}/ops/exceptions?filter=past_promise`, wait: "text=Past promise" },
        { name: "ops-exceptions-resolved", url: `${base}/ops/exceptions?filter=resolved`, wait: "text=Exceptions" },
        { name: "ops-production-blocked", url: `${base}/ops/production`, wait: "text=Blocked by exception" },
        { name: "ops-packing-blocked", url: `${base}/ops/packing?filter=blocked`, wait: "text=Resolve issue" },
        { name: "ops-command-center", url: `${base}/ops`, wait: "text=Needs attention" },
        { name: "ops-show-exceptions", url: `${base}/ops/shows/${brooklynEvent}`, wait: "text=Exceptions" },
      ];

      for (const shot of shots) {
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForSelector(shot.wait, { timeout: 30000 });
        await assertNoHorizontalOverflow(page, `${shot.name}@${width}`);
        await page.screenshot({
          path: resolve(outDir, `${shot.name}-${width}.png`),
          fullPage: true,
        });
      }

      await page.goto(`${base}/ops/exceptions`, { waitUntil: "networkidle" });
      const firstResolve = page.locator('text=Resolve →').first();
      if (await firstResolve.count()) {
        await firstResolve.click();
        await page.waitForSelector("text=Exception resolution workbench", { timeout: 30000 });
        await assertNoHorizontalOverflow(page, `ops-exception-detail@${width}`);
        await page.screenshot({
          path: resolve(outDir, `ops-exception-detail-${width}.png`),
          fullPage: true,
        });
        await page.waitForSelector("text=Action history", { timeout: 15000 });
        await page.screenshot({
          path: resolve(outDir, `ops-exception-history-${width}.png`),
          fullPage: true,
        });
      }

      await page.close();
    }
    console.log(`Screenshots saved to ${outDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
