import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/ops-phase3-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const brooklynEvent = "evt_marisol_brooklyn";

const shots = [
  {
    name: "ops-packing-summary",
    url: `${base}/ops/packing`,
    wait: "text=Pack + carrier handoff",
  },
  {
    name: "ops-packing-must-leave-next",
    url: `${base}/ops/packing`,
    wait: "text=Must leave next",
  },
  {
    name: "ops-packing-ready-to-pack",
    url: `${base}/ops/packing?filter=ready_to_pack`,
    wait: "text=Ready to pack",
  },
  {
    name: "ops-packing-ready-for-handoff",
    url: `${base}/ops/packing?filter=ready_for_handoff`,
    wait: "text=Ready for handoff",
  },
  {
    name: "ops-packing-blocked",
    url: `${base}/ops/packing?filter=blocked`,
    wait: "text=Pack queue",
  },
  {
    name: "ops-packing-by-show",
    url: `${base}/ops/packing`,
    wait: "text=By show",
  },
  {
    name: "ops-command-packing-pressure",
    url: `${base}/ops`,
    wait: "text=Pack + handoff",
  },
  {
    name: "ops-show-packing-block",
    url: `${base}/ops/shows/${brooklynEvent}`,
    wait: "text=Pack + handoff",
  },
];

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

      for (const shot of shots) {
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForSelector(shot.wait, { timeout: 30000 });
        await assertNoHorizontalOverflow(page, `${shot.name}-${width}px`);
        const file = resolve(outDir, `${shot.name}-${width}px.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`Saved ${file}`);
      }

      await page.goto(`${base}/ops/packing`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForSelector("text=Must leave next", { timeout: 30000 });
      const packBtn = page.getByRole("button", { name: /start packing/i }).first();
      if (await packBtn.count()) {
        await packBtn.click();
        await page.waitForTimeout(1500);
        await assertNoHorizontalOverflow(page, `ops-packing-action-${width}px`);
        const actionFile = resolve(outDir, `ops-packing-action-${width}px.png`);
        await page.screenshot({ path: actionFile, fullPage: true });
        console.log(`Saved ${actionFile}`);
      }

      await page.goto(`${base}/ops/shows/${brooklynEvent}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      const orderLink = page.locator('a[href*="/ops/orders/"]').first();
      if (await orderLink.count()) {
        await orderLink.click();
        await page.waitForLoadState("networkidle");
        await page.waitForSelector("text=Packing", { timeout: 30000 });
        await assertNoHorizontalOverflow(page, `ops-order-packing-detail-${width}px`);
        const detailFile = resolve(outDir, `ops-order-packing-detail-${width}px.png`);
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
