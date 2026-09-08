import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/phase5-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const brooklynEvent = "evt_marisol_brooklyn";

const shots = [
  {
    name: "fulfillment-command-center",
    url: `${base}/studio/orders?event=${brooklynEvent}`,
    wait: "text=Are tonight's orders under control?",
  },
  {
    name: "fulfillment-pipeline",
    url: `${base}/studio/orders?event=${brooklynEvent}`,
    wait: "text=Current pipeline",
  },
  {
    name: "fulfillment-exceptions",
    url: `${base}/studio/orders?event=${brooklynEvent}`,
    wait: "text=need attention",
  },
  {
    name: "guided-step-2-fulfillment",
    url: `${base}/studio/insights?event=${brooklynEvent}&guided=marisol-artist-studio&step=2`,
    wait: "text=View fulfillment",
  },
  {
    name: "guided-step-6",
    url: `${base}/studio/insights?event=${brooklynEvent}&guided=marisol-artist-studio&step=6`,
    wait: "text=delivered within promise",
  },
];

async function signIn(page) {
  await page.goto(`${base}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', "elena@marisolreyes.example");
  await page.fill('input[name="password"]', "rollingga");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle", { timeout: 45000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await signIn(page);

      for (const shot of shots) {
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForSelector(shot.wait, { timeout: 30000 });
        const file = resolve(outDir, `${shot.name}-${width}px.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`Saved ${file}`);
      }

      await page.goto(`${base}/studio/orders?event=${brooklynEvent}`, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      await page.waitForSelector("text=Orders", { timeout: 30000 });
      const firstOrder = page.locator('a[href*="/studio/orders/ord_"]').first();
      if (await firstOrder.count()) {
        await firstOrder.click();
        await page.waitForLoadState("networkidle");
        await page.waitForSelector("text=Fulfillment timeline", { timeout: 30000 });
        const detailFile = resolve(outDir, `fulfillment-order-detail-${width}px.png`);
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
