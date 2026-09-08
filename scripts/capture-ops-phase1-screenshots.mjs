import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/ops-phase1-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const brooklynEvent = "evt_marisol_brooklyn";

const shots = [
  { name: "ops-command-center", url: `${base}/ops`, wait: "text=Tonight's operations" },
  {
    name: "ops-needs-attention",
    url: `${base}/ops`,
    wait: "text=Needs attention",
  },
  {
    name: "ops-show-detail",
    url: `${base}/ops/shows/${brooklynEvent}`,
    wait: "text=Is this show under control",
  },
  {
    name: "ops-pipeline",
    url: `${base}/ops/shows/${brooklynEvent}`,
    wait: "text=Current pipeline",
  },
  {
    name: "ops-promise",
    url: `${base}/ops/shows/${brooklynEvent}`,
    wait: "text=Next-day promise",
  },
];

async function signInOps(page) {
  await page.goto(`${base}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', "ops@rollingga.example");
  await page.fill('input[name="password"]', "rollingga");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle", { timeout: 45000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440, 1728]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await signInOps(page);

      for (const shot of shots) {
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForSelector(shot.wait, { timeout: 30000 });
        const file = resolve(outDir, `${shot.name}-${width}px.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`Saved ${file}`);
      }

      await page.goto(`${base}/ops/shows/${brooklynEvent}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForSelector("text=Needs attention", { timeout: 30000 });
      const orderLink = page.locator('a[href*="/ops/orders/"]').first();
      if (await orderLink.count()) {
        await orderLink.click();
        await page.waitForLoadState("networkidle");
        await page.waitForSelector("text=Order detail", { timeout: 30000 });
        const detailFile = resolve(outDir, `ops-order-detail-${width}px.png`);
        await page.screenshot({ path: detailFile, fullPage: true });
        console.log(`Saved ${detailFile}`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
