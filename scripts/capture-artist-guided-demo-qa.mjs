/**
 * Captures Artist Studio guided demo screenshots at 390px, 430px, and 1440px.
 *
 * Usage (dev server must be running with demo mode + seeded data):
 *   npm run dev
 *   node scripts/capture-artist-guided-demo-qa.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "qa-screenshots", "artist-guided-demo");

const VIEWPORTS = [
  { name: "390px-mobile", width: 390, height: 844 },
  { name: "430px-mobile", width: 430, height: 932 },
  { name: "1440px-desktop", width: 1440, height: 900 },
];

const STEPS = [
  { step: 1, label: "01-tonights-show" },
  { step: 2, label: "02-see-what-sold" },
  { step: 3, label: "03-meet-your-fans" },
  { step: 4, label: "04-follow-one-fan" },
  { step: 5, label: "05-activate-audience" },
  { step: 6, label: "06-see-the-value" },
];

async function enterArtistDemo(page) {
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  const cta = page.locator("#main-content").getByRole("button", { name: /see the artist demo/i });
  await cta.click();
  await page.waitForURL(/\/studio\//, { timeout: 60_000 });
}

async function captureStep(page, viewport, step) {
  if (step.step > 1) {
    const next = page.locator("#artist-guided-demo-next-form button[type='submit']").first();
    if (await next.isVisible()) {
      await next.click();
      await page.waitForTimeout(1500);
    }
  }

  const file = path.join(OUT_DIR, viewport.name, `${step.label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Captured ${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const viewport of VIEWPORTS) {
    await mkdir(path.join(OUT_DIR, viewport.name), { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await enterArtistDemo(page);

    for (const step of STEPS) {
      await captureStep(page, viewport, step);
    }
  }

  await browser.close();
  console.log("Artist guided demo QA capture complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
